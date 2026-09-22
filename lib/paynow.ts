import { Paynow } from "paynow";

// Trailing slashes are stripped: without this, a NEXT_PUBLIC_SITE_URL that ends
// in "/" produces "https://host//api/paynow/result" (double slash), which
// Paynow rejects outright.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://major-five-xi.vercel.app")
  .trim()
  .replace(/\/+$/, "");

// The official Paynow Node SDK documents PAYNOW_INTEGRATION_ID / PAYNOW_INTEGRATION_KEY.
// We accept either naming so a deployment that used the SDK's own names still works.
// Values are trimmed because a stray space or newline pasted into a hosting
// dashboard's env var UI is a silent cause of "Hashes do not match!".
const PAYNOW_ID = (process.env.PAYNOW_ID || process.env.PAYNOW_INTEGRATION_ID)?.trim();
const PAYNOW_KEY = (process.env.PAYNOW_KEY || process.env.PAYNOW_INTEGRATION_KEY)?.trim();

/**
 * Paynow's SDK swallows every network/HTTP error inside its own `.catch()`, logs
 * the real reason to stdout, and resolves the promise with `undefined`. That
 * makes a DNS failure, a timeout and a bad credential all look identical to the
 * caller. This wraps those calls so the actual failure is thrown to us instead
 * of being silently converted into `undefined`.
 */
export async function callPaynow<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const originalError = console.error;
  const originalLog = console.log;
  let captured = "";

  const capture = (...args: any[]) => {
    captured = args
      .map((a) => (a instanceof Error ? `${a.name}: ${a.message}` : String(a)))
      .join(" ");
  };
  // The SDK writes its real error with console.log; capture both to be safe.
  console.error = capture;
  console.log = capture;

  try {
    const result = await fn();
    if (result === undefined || result === null) {
      const reason = captured || "SDK returned no response";
      throw new Error(`Paynow ${label} failed: ${reason}`);
    }
    return result;
  } finally {
    console.error = originalError;
    console.log = originalLog;
  }
}

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
