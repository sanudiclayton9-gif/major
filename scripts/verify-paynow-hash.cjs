const crypto = require('crypto');

function parseBody(body) {
  const params = {};
  const parts = body.split('&');
  for (const p of parts) {
    const idx = p.indexOf('=');
    if (idx === -1) continue;
    const k = p.slice(0, idx);
    const v = p.slice(idx + 1);
    params[k.toLowerCase()] = v;
  }
  return params;
}

function toHexUpper(buf) {
  return buf.toString('hex').toUpperCase();
}

function hmacSha512(key, data) {
  return crypto.createHmac('sha512', key).update(data, 'utf8').digest('hex').toUpperCase();
}

function tryVariants(params, key, providedHash) {
  const orders = [
    ['resulturl','returnurl','reference','amount','id','additionalinfo','authemail','phone','method','status'],
    ['id','amount','reference','resulturl','returnurl'],
    ['id','reference','amount','resulturl','returnurl'],
    ['reference','amount','id','resulturl','returnurl'],
  ];

  const seps = ['','|','&'];

  const decodeVariants = (v) => {
    return [v, decodeURIComponent(v), (() => { try { return decodeURIComponent(decodeURIComponent(v)); } catch(e){ return decodeURIComponent(v); } })()];
  };

  for (const order of orders) {
    // build arrays of possible values considering decode variations for each field
    const valueLists = order.map((k) => {
      const raw = params[k] ?? '';
      return Array.from(new Set(decodeVariants(raw)));
    });

    // iterate combinations (cartesian) but cap to reasonable count
    function cartesian(arrs) {
      return arrs.reduce((a,b)=> a.flatMap(x=> b.map(y=> x.concat([y]))), [[]]);
    }

    const combos = cartesian(valueLists).slice(0, 2000);
    for (const combo of combos) {
      for (const sep of seps) {
        const candidate = combo.join(sep);
        const digest = hmacSha512(key, candidate);
        if (digest === providedHash) {
          return { match: true, order, sep, candidate, digest };
        }
      }
    }
  }
  return { match: false };
}

function main() {
  const body = process.argv[2];
  const key = process.env.PAYNOW_KEY || process.env.PAYNOW_INTEGRATION_KEY;
  if (!body) {
    console.error('Usage: node scripts/verify-paynow-hash.cjs "resulturl=...&...&hash=..."');
    process.exit(2);
  }
  if (!key) {
    console.error('Set PAYNOW_KEY environment variable before running.');
    process.exit(2);
  }

  const params = parseBody(body);
  const provided = (params['hash'] || params['hash'] || '').toUpperCase();
  if (!provided) {
    console.error('No hash param found in body.');
    process.exit(2);
  }

  console.log('Provided hash:', provided);
  const result = tryVariants(params, key, provided);
  if (result.match) {
    console.log('MATCH FOUND');
    console.log('Order tried:', result.order.join(','));
    console.log('Separator used:', JSON.stringify(result.sep));
    console.log('Candidate string:', result.candidate);
    console.log('Digest:', result.digest);
  } else {
    console.log('No match found with tried orders/separators/decodings.');
    console.log('This strongly suggests the integration key in use is not the one used to produce the outgoing hash (or the Paynow hash algorithm/field order is different).');
  }
}

main();
