const fs = require('fs');
const path = require('path');
const { Paynow } = require('paynow');
const https = require('https');
const http = require('http');

function readEnvFile(file) {
  try {
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx);
      const val = trimmed.slice(idx + 1);
      env[key] = val;
    }
    return env;
  } catch (e) {
    return {};
  }
}

const repoRoot = path.resolve(__dirname, '..');
const envFile = path.join(repoRoot, '.env.local');
const env = readEnvFile(envFile);

const PAYNOW_ID = (env.PAYNOW_ID || process.env.PAYNOW_ID || '').trim();
const PAYNOW_KEY = (env.PAYNOW_KEY || process.env.PAYNOW_KEY || '').trim();
const SITE_URL = (env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');

if (!PAYNOW_ID || !PAYNOW_KEY) {
  console.error('Missing PAYNOW_ID or PAYNOW_KEY. Check .env.local or environment.');
  process.exit(2);
}

console.log('Using PAYNOW_ID=', PAYNOW_ID);
console.log('Using SITE_URL=', SITE_URL || '(empty)');

const p = new Paynow(PAYNOW_ID, PAYNOW_KEY);
if (SITE_URL) {
  p.resultUrl = `${SITE_URL}/api/paynow/result`;
  p.returnUrl = `${SITE_URL}/track/test-order`;
}

// Local debug: capture outgoing http(s) request bodies when PAYNOW_DEBUG=1
if (process.env.PAYNOW_DEBUG === '1') {
  try {
    const origHttpsRequest = https.request;
    const origHttpRequest = http.request;

    function makeWrapper(orig) {
      return function (options, callback) {
        const host = (options && (options.hostname || options.host)) || (typeof options === 'string' ? options : '');
        const shouldLog = typeof host === 'string' && host.includes('paynow');
        const req = orig(options, callback);
        if (!shouldLog) return req;

        let body = '';
        const origWrite = req.write.bind(req);
        const origEnd = req.end.bind(req);
        req.write = function (chunk, encoding, cb) {
          try { body += chunk && chunk.toString ? chunk.toString() : String(chunk); } catch (e) {}
          return origWrite(chunk, encoding, cb);
        };
        req.end = function (chunk, encoding, cb) {
          try { if (chunk) body += chunk && chunk.toString ? chunk.toString() : String(chunk); } catch (e) {}
          try {
            const redacted = body.replace(/(integration_key=)[^&\n\r]*/i, "$1[REDACTED]");
            console.log('[paynow-debug] outgoing request to', host, 'body:', redacted);
          } catch (e) {}
          return origEnd(chunk, encoding, cb);
        };
        return req;
      };
    }

    https.request = makeWrapper(origHttpsRequest);
    http.request = makeWrapper(origHttpRequest);
    console.log('[paynow-debug] local HTTP wrapper installed');
  } catch (e) {
    // ignore
  }
}

async function main() {
  const orderId = `test-${Date.now()}`;
  // mimic the real app: use the phone-as-email pattern it creates
  const testPhoneLocal = '07751234567';
  const testPhoneIntl = '263775123456';
  const email = `${testPhoneLocal}@wearchimsol.co.zw`;
  const payment = p.createPayment(orderId, email);
  payment.add('Test item', 1);

  // Print payment details so you can compare what is being hashed/sent
  try {
    const items = payment.items || payment._items || [];
    const total = items.reduce((s, it) => s + (it.amount || it.price || 0), 0);
    console.log('--- Payment details ---');
    console.log('reference:', orderId);
    console.log('email:', email);
    console.log('items:', JSON.stringify(items, null, 2));
    console.log('total:', total);
    console.log('resultUrl:', p.resultUrl);
    console.log('returnUrl:', p.returnUrl);
    console.log('-----------------------');
  } catch (err) {
    // ignore
  }

  // Capture SDK console outputs by temporarily overriding console.log/error
  const origLog = console.log;
  const origErr = console.error;
  let captured = '';
  const cap = (...args) => { captured += args.map(String).join(' ') + '\n'; };
  console.log = cap;
  console.error = cap;

  try {
    // Use the international-formatted phone which Paynow expects for mobile pushes
    const res = await p.sendMobile(payment, testPhoneIntl, 'ecocash');
    console.log = origLog;
    console.error = origErr;
    console.log('Paynow sendMobile response:', res);
    if (captured) {
      console.error('Captured SDK output:\n', captured);
    }
  } catch (e) {
    console.log = origLog;
    console.error = origErr;
    console.error('sendMobile threw error:', e && e.message ? e.message : e);
    if (captured) console.error('Captured SDK output:\n', captured);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Unexpected error:', e && e.stack ? e.stack : e);
  process.exit(1);
});
