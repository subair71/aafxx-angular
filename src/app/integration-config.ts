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
    provider: "stripe" | "paypal";
    paypal: {
      links: Record<"pdf" | "print" | "bundle", string>;
      destinationVerified: boolean;
      usdVerified: boolean;
      paymentVerificationReady: boolean;
      digitalDeliveryReady: boolean;
      shippingCaptureReady: boolean;
      bundleDeliveryReady: boolean;
    };
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
    leadsReady: boolean;
    privacyApproved: boolean;
    privacyVersion: string;
  };
  brand: {
    logo: string | null;
    checklist: string | null;
    founderPhoto: string | null;
    email: string;
    founderEmail: string;
    location: string;
    whatsapp: string;
    social: { instagram: string; youtube: string; tiktok: string };
  };
}

export const integrationConfig: IntegrationConfig = {
  payments: {
    provider: "paypal",
    paypal: {
      links: {
        pdf: "https://www.paypal.com/paypalme/AAFXMLSOLUTI/27",
        print: "https://www.paypal.com/paypalme/AAFXMLSOLUTI/47",
        bundle: "https://www.paypal.com/paypalme/AAFXMLSOLUTI/97",
      },
      // 2026-10-28: all three supplied URLs return "We can't find this profile".
      // Keep these false until the merchant destination, USD and fulfilment are tested.
      destinationVerified: false,
      usdVerified: false,
      paymentVerificationReady: false,
      digitalDeliveryReady: false,
      shippingCaptureReady: false,
      bundleDeliveryReady: false,
    },
    environment: "test",
    liveApproved: false,
    policiesApproved: false,
    verifiedPaymentWorkflowReady: false,
    links: {},
    digital: { privateDeliveryReady: false, contentReadySkus: [] },
    print: { fulfilmentReady: false, shippingReadySkus: [] },
    bundle: { contentsConfirmed: false, format: null, contentsLabel: "", includedSkus: [], fulfilmentReady: false },
  },
  forms: { apiBase: "", contactReady: false, waitlistReady: false, leadsReady: false, privacyApproved: false, privacyVersion: "2026-10-23" },
  brand: {
    logo: "assets/brand/aafxx-logo.svg",
    checklist: null,
    founderPhoto: null,
    email: "admin@aafxx.com",
    founderEmail: "berthram@aafxx.com",
    location: "Manama, Bahrain - Online Global",
    whatsapp: "+973 3435 2786",
    social: { instagram: "https://www.instagram.com/aafxx_official/", youtube: "https://www.youtube.com/@aafxx_official", tiktok: "https://www.tiktok.com/@aafxx_official" },
  },
};
