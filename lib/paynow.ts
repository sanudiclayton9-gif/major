import { Paynow } from "paynow";
import https from "https";
import http from "http";

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
// Normalize and remove invisible/control characters which may be pasted into
// hosting dashboards and silently break signature computations ("Hashes do
// not match!"). We keep visible characters and trim surrounding whitespace.
function normalizeEnv(value?: string) {
  if (!value) return undefined;
  // remove C0/C1 control characters and BOM, keep printable ASCII/UTF-8
  return value.replace(/[\u0000-\u001F\u007F-\u009F\uFEFF]/g, "").trim();
}

const PAYNOW_ID = normalizeEnv(process.env.PAYNOW_ID || process.env.PAYNOW_INTEGRATION_ID);
const PAYNOW_KEY = normalizeEnv(process.env.PAYNOW_KEY || process.env.PAYNOW_INTEGRATION_KEY);

// Optional debugging: when `PAYNOW_DEBUG=1` the runtime will log outgoing
// HTTP(S) request bodies that target Paynow hosts. This helps inspect the
// actual payload/hash the SDK sends. Do NOT enable in production for long;
// it is intended for short troubleshooting only.
if (process.env.PAYNOW_DEBUG === "1") {
  try {
    const origHttpsRequest = https.request;
    const origHttpRequest = http.request;

    function makeWrapper(orig: typeof https.request | typeof http.request) {
      return function (options: any, callback?: any) {
        const host = (options && (options.hostname || options.host)) || (typeof options === 'string' ? options : '');
        const shouldLog = typeof host === 'string' && host.includes('paynow');
        const req = orig.call(this, options, callback);
        if (!shouldLog) return req;

        let body = '';
        const origWrite = req.write;
        const origEnd = req.end;
        req.write = function (chunk: any, encoding?: any, cb?: any) {
          try { body += chunk?.toString?.() || String(chunk); } catch (e) {}
          return origWrite.call(req, chunk, encoding, cb);
        } as any;
        req.end = function (chunk: any, encoding?: any, cb?: any) {
          try { if (chunk) body += chunk?.toString?.(); } catch (e) {}
          try {
            // redact the actual integration key if present
            const redacted = body.replace(/(integration_key=)[^&\n\r]*/i, "$1[REDACTED]");
            // eslint-disable-next-line no-console
            console.log('[paynow-debug] outgoing request to', host, 'body:', redacted);
          } catch (e) {}
          return origEnd.call(req, chunk, encoding, cb);
        } as any;
        return req;
      } as any;
    }

    https.request = makeWrapper(origHttpsRequest);
    http.request = makeWrapper(origHttpRequest);
    // eslint-disable-next-line no-console
    console.log('[paynow-debug] HTTP(S) request wrapper installed');
  } catch (e) {
    // ignore
  }
}

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
      "Paynow credentials are missing or invalid. Ensure PAYNOW_ID and PAYNOW_KEY (or PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY) are set in your environment and re-deploy."
    );
  }

  // Helpful non-secret diagnostics for server logs: lengths indicate stray
  // characters (do not log the actual keys).
  try {
    // eslint-disable-next-line no-console
    console.log(`[paynow] PAYNOW_ID length=${String(PAYNOW_ID.length)} PAYNOW_KEY length=${String(PAYNOW_KEY.length)}`);
  } catch (e) {
    // ignore logging errors
  }

  const paynow = new Paynow(PAYNOW_ID, PAYNOW_KEY);
  paynow.resultUrl = `${SITE_URL}/api/paynow/result`;
  paynow.returnUrl = orderId
    ? `${SITE_URL}/track/${orderId}`
    : `${SITE_URL}/track`;
  return paynow;
}
