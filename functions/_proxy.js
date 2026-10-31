// Shared reverse-proxy for Cloudflare Pages Functions.
// Forwards an incoming /portal/* or /udm/* request to the real portal (server-side), so the
// browser only ever talks to this same origin — no CORS, no mixed content, and the portal
// hostname stays out of the public JS bundle.
//
// Set the portal host as a Pages environment variable named PORTAL_ORIGIN, e.g.
//   PORTAL_ORIGIN = https://selfcare.example.com
// The path after /portal or /udm is forwarded verbatim:
//   /portal/PortalApi/            -> ${PORTAL_ORIGIN}/PortalApi/
//   /udm/api/h8UDMProxy.ashx/...  -> ${PORTAL_ORIGIN}/api/h8UDMProxy.ashx/...

const HOP_BY_HOP = ['host', 'connection', 'content-length', 'content-encoding', 'cf-connecting-ip', 'cf-ipcountry', 'x-forwarded-proto', 'x-forwarded-for'];

export async function proxy(context) {
  const { request, env, params } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const origin = (env.PORTAL_ORIGIN || '').replace(/\/+$/, '');
  if (!origin) {
    return json({ error: 'PORTAL_ORIGIN is not configured on this deployment' }, 500);
  }

  const seg = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
  const search = new URL(request.url).search;
  const target = `${origin}/${seg}${search}`;

  const headers = new Headers(request.headers);
  for (const h of HOP_BY_HOP) headers.delete(h);

  const init = { method: request.method, headers, redirect: 'follow' };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  let upstream;
  try {
    upstream = await fetch(target, init);
  } catch (e) {
    return json({ error: 'Upstream fetch failed', detail: String(e) }, 502);
  }

  const outHeaders = new Headers(upstream.headers);
  outHeaders.delete('content-encoding');
  outHeaders.delete('content-length');
  outHeaders.delete('transfer-encoding');
  for (const [k, v] of Object.entries(corsHeaders())) outHeaders.set(k, v);

  return new Response(upstream.body, { status: upstream.status, headers: outHeaders });
}

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
    'access-control-allow-headers': 'Authorization,Content-Type,centralApiKey,X-Requested-With',
  };
}

function json(body, status) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...corsHeaders() } });
}
