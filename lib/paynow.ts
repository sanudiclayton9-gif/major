import { Paynow } from "paynow";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function getPaynow(orderId?: string) {
  const paynow = new Paynow(
    process.env.PAYNOW_ID!,
    process.env.PAYNOW_KEY!
  );
  paynow.resultUrl = `${SITE_URL}/api/paynow/result`;
  paynow.returnUrl = orderId
    ? `${SITE_URL}/track/${orderId}`
    : `${SITE_URL}/track`;
  return paynow;
}
