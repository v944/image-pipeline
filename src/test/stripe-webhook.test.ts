// @vitest-environment node
import { describe, it, expect, afterEach } from "vitest";
import { planFromAmount, planFromPaymentLink, resolvePlan, verifyStripeSignature } from "../../api/_shared/stripe";

const SECRET_BYTES = Uint8Array.from({ length: 32 }, (_, i) => i + 17);
const SECRET_B64 = btoa(String.fromCharCode(...SECRET_BYTES));
const NOW = 1_700_000_000;
const PAYLOAD = JSON.stringify({ id: "evt_test", type: "checkout.session.completed", data: {} });

function b64encode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

async function signHeader(payload: string, timestamp: number, secretB64: string): Promise<string> {
  const keyBytes = Uint8Array.from(atob(secretB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${hex}`;
}

describe("Stripe webhook signature verification", () => {
  it("accepts a valid signature", async () => {
    const header = await signHeader(PAYLOAD, NOW, SECRET_B64);
    const result = await verifyStripeSignature(PAYLOAD, header, SECRET_B64, NOW);
    expect(result).toEqual({ valid: true });
  });

  it("accepts an uppercase hex signature", async () => {
    const header = (await signHeader(PAYLOAD, NOW, SECRET_B64)).toUpperCase().replace("T=", "t=").replace("V1=", "v1=");
    const result = await verifyStripeSignature(PAYLOAD, header, SECRET_B64, NOW);
    expect(result.valid).toBe(true);
  });

  it("rejects a tampered payload", async () => {
    const header = await signHeader(PAYLOAD, NOW, SECRET_B64);
    const result = await verifyStripeSignature(PAYLOAD.replace("evt_test", "evt_evil"), header, SECRET_B64, NOW);
    expect(result.valid).toBe(false);
  });

  it("rejects a wrong secret", async () => {
    const otherSecret = b64encode(Uint8Array.from({ length: 32 }, (_, i) => 255 - i));
    const header = await signHeader(PAYLOAD, NOW, otherSecret);
    const result = await verifyStripeSignature(PAYLOAD, header, SECRET_B64, NOW);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("signature-mismatch");
  });

  it("rejects a timestamp outside the tolerance window", async () => {
    const header = await signHeader(PAYLOAD, NOW - 400, SECRET_B64);
    const result = await verifyStripeSignature(PAYLOAD, header, SECRET_B64, NOW);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("timestamp-outside-tolerance");
  });

  it("rejects a malformed signature header", async () => {
    const result = await verifyStripeSignature(PAYLOAD, "not-a-signature", SECRET_B64, NOW);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("malformed-signature-header");
  });

  it("accepts when one of several v1 signatures is valid (secret rotation)", async () => {
    const otherSecret = b64encode(Uint8Array.from({ length: 32 }, (_, i) => 128 + i));
    const stale = await signHeader(PAYLOAD, NOW, otherSecret);
    const staleSig = stale.split("v1=")[1];
    const current = await signHeader(PAYLOAD, NOW, SECRET_B64);
    const header = `${current},v1=${staleSig}`;
    const result = await verifyStripeSignature(PAYLOAD, header, SECRET_B64, NOW);
    expect(result.valid).toBe(true);
  });
});

describe("Stripe plan mapping from payment links", () => {
  afterEach(() => {
    delete process.env.STRIPE_PRO_PAYMENT_LINK;
    delete process.env.STRIPE_LIFETIME_PAYMENT_LINK;
  });

  it("maps configured payment links to plans", () => {
    process.env.STRIPE_PRO_PAYMENT_LINK = "pl_test_pro";
    process.env.STRIPE_LIFETIME_PAYMENT_LINK = "pl_test_lifetime";
    expect(planFromPaymentLink("pl_test_pro")).toBe("pro");
    expect(planFromPaymentLink("pl_test_lifetime")).toBe("lifetime");
  });

  it("returns null for unknown or missing payment links", () => {
    process.env.STRIPE_PRO_PAYMENT_LINK = "pl_test_pro";
    expect(planFromPaymentLink("pl_unknown")).toBeNull();
    expect(planFromPaymentLink(null)).toBeNull();
    expect(planFromPaymentLink("")).toBeNull();
  });
});

describe("Stripe plan mapping from amount", () => {
  afterEach(() => {
    delete process.env.STRIPE_PRO_PAYMENT_LINK;
    delete process.env.STRIPE_LIFETIME_PAYMENT_LINK;
  });

  it("maps the fixed plan prices to plans", () => {
    expect(planFromAmount(1000)).toBe("pro");
    expect(planFromAmount(3000)).toBe("lifetime");
    expect(planFromAmount(999)).toBeNull();
    expect(planFromAmount(null)).toBeNull();
  });

  it("prefers the payment link mapping and falls back to amount", () => {
    process.env.STRIPE_PRO_PAYMENT_LINK = "pl_test_pro";
    process.env.STRIPE_LIFETIME_PAYMENT_LINK = "pl_test_lifetime";
    expect(resolvePlan({ payment_link: "pl_test_lifetime", amount_total: 1000 })).toBe("lifetime");
    expect(resolvePlan({ payment_link: "pl_unknown", amount_total: 1000 })).toBe("pro");
    expect(resolvePlan({ payment_link: null, amount_total: 3000 })).toBe("lifetime");
    expect(resolvePlan({ payment_link: null, amount_total: 1234 })).toBeNull();
  });
});
