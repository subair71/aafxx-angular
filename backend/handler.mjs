import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { createApi } from "./core.mjs";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions: { removeUndefinedValues: true } });
const s3 = new S3Client({});
const ses = new SESv2Client({});
const secrets = new SecretsManagerClient({});
const table = process.env.DATA_TABLE;
const bucket = process.env.PDF_BUCKET;
const conditionFailed = (error) => error?.name === "ConditionalCheckFailedException";
const pk = (sessionId) => `ORDER#${sessionId}`;
let cached;

const store = {
  async rateLimit(key, limit, expiresAt) {
    try {
      await dynamo.send(new UpdateCommand({ TableName: table, Key: { pk: key },
        UpdateExpression: "SET expiresAt = :expires ADD #count :one", ConditionExpression: "attribute_not_exists(#count) OR #count < :limit",
        ExpressionAttributeNames: { "#count": "count" }, ExpressionAttributeValues: { ":expires": expiresAt, ":one": 1, ":limit": limit } }));
      return true;
    } catch (error) { if (conditionFailed(error)) return false; throw error; }
  },
  async persistSubmission(kind, id, record) {
    try {
      await dynamo.send(new PutCommand({ TableName: table, Item: { pk: `${kind.toUpperCase()}#${id}`, kind, ...record }, ConditionExpression: "attribute_not_exists(pk)" }));
    } catch (error) {
      // Existing waitlist membership is accepted without leaking registration state.
      if (!(["waitlist", "leads"].includes(kind) && conditionFailed(error))) throw error;
    }
  },
  async getOrder(sessionId) {
    return (await dynamo.send(new GetCommand({ TableName: table, Key: { pk: pk(sessionId) }, ConsistentRead: true }))).Item;
  },
  async recordUnpaid(sessionId, status, sku) {
    try {
      await dynamo.send(new UpdateCommand({ TableName: table, Key: { pk: pk(sessionId) },
        UpdateExpression: "SET paymentStatus = :status, sessionId = :session, sku = :sku, updatedAt = :updated",
        ConditionExpression: "attribute_not_exists(paymentStatus) OR paymentStatus IN (:pending, :failed)",
        ExpressionAttributeValues: { ":status": status, ":session": sessionId, ":sku": sku, ":updated": new Date().toISOString(), ":pending": "pending", ":failed": "failed" } }));
    } catch (error) { if (!conditionFailed(error)) throw error; }
  },
  async recordPaid(order) {
    const names = Object.fromEntries(Object.keys(order).map((key, index) => [`#f${index}`, key]));
    const values = Object.fromEntries(Object.values(order).map((value, index) => [`:v${index}`, value]));
    values[":pending"] = "pending";
    values[":failed"] = "failed";
    try {
      await dynamo.send(new UpdateCommand({ TableName: table, Key: { pk: pk(order.sessionId) },
        UpdateExpression: "SET " + Object.keys(order).map((_, index) => `#f${index} = :v${index}`).join(", "),
        ConditionExpression: "attribute_not_exists(paymentStatus) OR paymentStatus IN (:pending, :failed)",
        ExpressionAttributeNames: names, ExpressionAttributeValues: values }));
    } catch (error) { if (!conditionFailed(error)) throw error; }
    return store.getOrder(order.sessionId);
  },
  async claimDelivery(sessionId, lease, until) {
    try {
      await dynamo.send(new UpdateCommand({ TableName: table, Key: { pk: pk(sessionId) },
        UpdateExpression: "SET deliveryLease = :lease, deliveryLeaseUntil = :until",
        ConditionExpression: "paymentStatus = :paid AND attribute_not_exists(receiptSent) AND (attribute_not_exists(deliveryLeaseUntil) OR deliveryLeaseUntil < :now)",
        ExpressionAttributeValues: { ":lease": lease, ":until": until, ":paid": "paid", ":now": Math.floor(Date.now() / 1000) } }));
      return true;
    } catch (error) { if (conditionFailed(error)) return false; throw error; }
  },
  async markDelivered(sessionId, lease, deliveredAt) {
    await dynamo.send(new UpdateCommand({ TableName: table, Key: { pk: pk(sessionId) },
      UpdateExpression: "SET receiptSent = :sent, receiptSentAt = :at REMOVE deliveryLease, deliveryLeaseUntil",
      ConditionExpression: "deliveryLease = :lease", ExpressionAttributeValues: { ":sent": true, ":at": deliveredAt, ":lease": lease } }));
  },
  async releaseDelivery(sessionId, lease) {
    try {
      await dynamo.send(new UpdateCommand({ TableName: table, Key: { pk: pk(sessionId) }, UpdateExpression: "REMOVE deliveryLease, deliveryLeaseUntil", ConditionExpression: "deliveryLease = :lease", ExpressionAttributeValues: { ":lease": lease } }));
    } catch (error) { if (!conditionFailed(error)) throw error; }
  },
  async extendDownload(sessionId, expires) {
    try {
      await dynamo.send(new UpdateCommand({ TableName: table, Key: { pk: pk(sessionId) },
        UpdateExpression: "SET downloadExpiresAt = :expires", ConditionExpression: "paymentStatus = :paid AND downloadExpiresAt < :expires",
        ExpressionAttributeValues: { ":expires": expires, ":paid": "paid" } }));
    } catch (error) { if (!conditionFailed(error)) throw error; }
    return store.getOrder(sessionId);
  },
};

async function service() {
  // Short cache supports rotation without putting secrets in deployment output.
  if (cached && cached.until > Date.now()) return cached.api;
  if (!table || !bucket || !process.env.CONFIG_SECRET_ARN || !process.env.DEPLOYMENT_MODE || !process.env.ALLOWED_ORIGINS) throw new Error("Missing backend configuration.");
  const secret = await secrets.send(new GetSecretValueCommand({ SecretId: process.env.CONFIG_SECRET_ARN }));
  const config = JSON.parse(secret.SecretString || "{}");
  if (config.mode !== process.env.DEPLOYMENT_MODE || !["test", "live"].includes(config.mode)) throw new Error("Environment mismatch.");
  config.allowedOrigins = process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim());
  // Set this from the actual ApiBase stack output in Secrets Manager after the
  // first deployment. Referencing Api here through Lambda environment variables
  // would create a circular dependency with SAM's generated HTTP API integration.
  if (typeof config.publicApiBase !== "string" || !config.publicApiBase) throw new Error("The deployed API origin has not been configured.");
  for (const origin of [...config.allowedOrigins, config.publicApiBase]) {
    const parsed = new URL(origin);
    if (parsed.protocol !== "https:" || parsed.origin !== origin) throw new Error("Invalid HTTPS origin.");
  }
  if ([config.rateLimitSalt, config.downloadTokenSecret].some((value) => typeof value !== "string" || value.length < 43 || value.includes("SET_")) || config.rateLimitSalt === config.downloadTokenSecret) throw new Error("Missing independent strong token secrets.");
  let stripe;
  if (config.paymentsEnabled) {
    const prefix = config.mode === "test" ? "sk_test_" : "sk_live_";
    if (!config.stripeSecretKey?.startsWith(prefix) || !config.stripeWebhookSecret?.startsWith("whsec_") || !process.env.SENDER_EMAIL) throw new Error("Payment configuration is incomplete.");
    stripe = new Stripe(config.stripeSecretKey, { timeout: 10000, maxNetworkRetries: 1 });
    if (!Array.isArray(config.products) || !config.products.length || ["sku", "stripePriceId", "stripePaymentLinkId"].some((key) => new Set(config.products.map((product) => product[key])).size !== config.products.length)) throw new Error("Product configuration must be unique and explicit.");
  }
  const api = createApi({
    config, store,
    verifyWebhook: (raw, signature) => stripe.webhooks.constructEvent(raw, signature, config.stripeWebhookSecret),
    retrieveSession: (id) => stripe.checkout.sessions.retrieve(id, { expand: ["line_items.data.price.product"] }),
    async signDownload(file) {
      return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: file.key, ResponseContentType: "application/pdf", ResponseContentDisposition: `attachment; filename="${file.filename}"`, ResponseCacheControl: "private, no-store" }), { expiresIn: 300 });
    },
    async sendChecklist(id, data) {
      if (!config.checklist?.approved || !/^free-content\/[A-Za-z0-9/_-]+\.pdf$/.test(config.checklist.key) || !process.env.SENDER_EMAIL) throw new Error("Checklist delivery is not configured.");
      if (config.mode === "test" && !config.testRecipientAllowlist?.includes(data.email)) throw new Error("Test recipient not approved.");
      const key = { pk: `LEADS#${id}` };
      const now = Math.floor(Date.now()/1000);
      const lease = randomUUID();
      try {
        await dynamo.send(new UpdateCommand({ TableName: table, Key: key,
          UpdateExpression: "SET deliveryLease = :lease, deliveryLeaseUntil = :until",
          ConditionExpression: "attribute_exists(pk) AND attribute_not_exists(checklistSent) AND (attribute_not_exists(deliveryLeaseUntil) OR deliveryLeaseUntil < :now)",
          ExpressionAttributeValues: { ":lease": lease, ":until": now+90, ":now": now } }));
      } catch(error) {
        if (!conditionFailed(error)) throw error;
        const existing = (await dynamo.send(new GetCommand({TableName:table, Key:key, ConsistentRead:true}))).Item;
        return existing?.checklistSent ? "sent" : "pending";
      }
      try {
        const head = await s3.send(new HeadObjectCommand({Bucket:bucket, Key:config.checklist.key}));
        if (!head.ContentLength || !head.ContentType?.toLowerCase().startsWith("application/pdf")) throw new Error("Checklist unavailable.");
        const url = await getSignedUrl(s3, new GetObjectCommand({Bucket:bucket, Key:config.checklist.key, ResponseContentType:"application/pdf", ResponseContentDisposition:'attachment; filename="AAFXX-Standard-Checklist.pdf"', ResponseCacheControl:"private, no-store"}), {expiresIn:86400});
        await ses.send(new SendEmailCommand({FromEmailAddress:process.env.SENDER_EMAIL, Destination:{ToAddresses:[data.email]}, Content:{Simple:{Subject:{Data:"Your free AAFXX Standard Checklist",Charset:"UTF-8"}, Body:{Text:{Data:`Thank you for your interest in structured forex education.\n\nDownload your approved AAFXX Standard Checklist using this private link (valid for up to 24 hours):\n${url}\n\nEducation does not guarantee trading outcomes.`,Charset:"UTF-8"}}}}}));
        await dynamo.send(new UpdateCommand({TableName:table, Key:key, UpdateExpression:"SET checklistSent = :sent REMOVE deliveryLease, deliveryLeaseUntil",ConditionExpression:"deliveryLease = :lease",ExpressionAttributeValues:{":sent":true,":lease":lease}}));
        return "sent";
      } catch(error) {
        await dynamo.send(new UpdateCommand({TableName:table,Key:key,UpdateExpression:"REMOVE deliveryLease, deliveryLeaseUntil",ConditionExpression:"deliveryLease = :lease",ExpressionAttributeValues:{":lease":lease}}));
        throw error;
      }
    },
    async sendReceipt(order, files) {
      // Missing PDFs fail delivery and allow a webhook retry, instead of emailing broken links.
      await Promise.all(order.files.map(async (file) => {
        const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: file.key }));
        if (!head.ContentLength || !head.ContentType?.toLowerCase().startsWith("application/pdf")) throw new Error("PDF content is unavailable.");
      }));
      const lines = [
        "Thank you for your AAFXX order.", "", `Order reference: ${order.sessionId}`, `Publication: ${order.title}`, `Format: ${order.format}`, "",
        ...files.flatMap((file) => [file.name, file.url, ""]),
        ...(files.length ? ["These private links expire after 24 hours. Keep them private. If they expire, use the order recovery form with your order reference and this email address.", ""] : []),
        ...(order.format !== "pdf" ? ["Your printed-book order has been recorded for merchant fulfilment. Shipping details were collected at checkout.", ""] : []),
        "Trading education does not guarantee financial results.",
      ];
      await ses.send(new SendEmailCommand({ FromEmailAddress: process.env.SENDER_EMAIL, Destination: { ToAddresses: [order.email] }, Content: { Simple: { Subject: { Data: `${config.mode === "test" ? "[TEST] " : ""}Your AAFXX book order`, Charset: "UTF-8" }, Body: { Text: { Data: lines.join("\n"), Charset: "UTF-8" } } } } }));
    },
  });
  cached = { api, until: Date.now() + 60000 };
  return api;
}

export async function handler(event) {
  try { return await (await service())(event); }
  catch {
    // Fail closed without logging customer data, request bodies or secrets.
    return { statusCode: 503, headers: { "content-type": "application/json", "cache-control": "no-store" }, body: JSON.stringify({ ok: false, accepted: false, message: "The service is not configured yet." }) };
  }
}
