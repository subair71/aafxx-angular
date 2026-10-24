/**
 * PUBLIC configuration only. Stripe secret keys, webhook secrets and storage
 * credentials belong in the backend secret store, never in this module.
 * Leave readiness flags false until the corresponding integration is tested.
 */
export type PaymentEnvironment = "test" | "live";

export interface StripePaymentReference {
  url: string;
  sku: string;
  environment: PaymentEnvironment;
  stripeProductId: string;
  stripePriceId: string;
  amountCents: number;
  currency: "usd";
  /** Confirm the actual Stripe object, currency, amount and completion behaviour. */
  merchantVerified: boolean;
}

export interface IntegrationConfig {
  payments: {
    environment: PaymentEnvironment;
    liveApproved: boolean;
    policiesApproved: boolean;
    verifiedPaymentWorkflowReady: boolean;
    links: Record<string, Partial<Record<PaymentEnvironment, StripePaymentReference>>>;
    digital: { privateDeliveryReady: boolean; contentReadySkus: string[] };
    print: { fulfilmentReady: boolean; shippingReadySkus: string[] };
    bundle: {
      contentsConfirmed: boolean;
      format: "pdf" | "print" | "mixed" | null;
      contentsLabel: string;
      includedSkus: string[];
      fulfilmentReady: boolean;
    };
  };
  forms: {
    /** HTTPS API base, without a trailing slash. The optional backend exposes /contact and /waitlist. */
    apiBase: string;
    contactReady: boolean;
    waitlistReady: boolean;
    privacyApproved: boolean;
    privacyVersion: string;
  };
  brand: {
    logo: string | null;
    checklist: string | null;
    founderPhoto: string | null;
    email: string;
    whatsapp: string;
    social: { instagram: string; youtube: string; tiktok: string };
  };
}

export const integrationConfig: IntegrationConfig = {
  payments: {
    environment: "test",
    liveApproved: false,
    policiesApproved: false,
    verifiedPaymentWorkflowReady: false,
    links: {},
    digital: { privateDeliveryReady: false, contentReadySkus: [] },
    print: { fulfilmentReady: false, shippingReadySkus: [] },
    bundle: { contentsConfirmed: false, format: null, contentsLabel: "", includedSkus: [], fulfilmentReady: false },
  },
  forms: { apiBase: "", contactReady: false, waitlistReady: false, privacyApproved: false, privacyVersion: "2026-10-23" },
  brand: {
    logo: "assets/brand/aafxx-logo.svg",
    checklist: null,
    founderPhoto: null,
    email: "",
    whatsapp: "",
    social: { instagram: "", youtube: "", tiktok: "" },
  },
};
