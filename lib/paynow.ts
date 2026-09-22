import { Paynow } from "paynow";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://major-five-xi.vercel.app/";

// The official Paynow Node SDK documents PAYNOW_INTEGRATION_ID / PAYNOW_INTEGRATION_KEY.
// We accept either naming so a deployment that used the SDK's own names still works.
const PAYNOW_ID = process.env.PAYNOW_ID || process.env.PAYNOW_INTEGRATION_ID;
const PAYNOW_KEY = process.env.PAYNOW_KEY || process.env.PAYNOW_INTEGRATION_KEY;

export function getPaynow(orderId?: string) {
  if (!PAYNOW_ID || !PAYNOW_KEY) {
    throw new Error(
      "Paynow credentials are missing. Set PAYNOW_ID and PAYNOW_KEY (or PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY) in your environment, then redeploy."
    );
  }

  const paynow = new Paynow(PAYNOW_ID, PAYNOW_KEY);
  paynow.resultUrl = `${SITE_URL}/api/paynow/result`;
  paynow.returnUrl = orderId
    ? `${SITE_URL}/track/${orderId}`
    : `${SITE_URL}/track`;
  return paynow;
}
