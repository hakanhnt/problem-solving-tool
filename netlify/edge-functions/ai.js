// Netlify Edge Function: akışlı YZ köprüsü (/api/ai).
//
// Neden edge + akış: serverless fonksiyonların senkron çalışma sınırı 10 sn ve
// MiniMax uzun JSON yanıtlarını bu sürede bitiremiyor (opak 502). Akışta ilk bayt
// saniyeler içinde gider, gövde akmaya devam eder; sınır sorun olmaz.
//
// İstek gövdesi serverless köprüyle aynıdır: {system, messages, max_tokens}
// Yanıt: sağlayıcının SSE akışı olduğu gibi iletilir (OpenAI uyumlu delta'lar).
// Hatalar JSON gövdeyle döner: {error: "..."}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'POST, OPTIONS'
};

const json = (status, obj) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'content-type': 'application/json' } });

const env = k => (globalThis.Netlify ? Netlify.env.get(k) : undefined) || (globalThis.Deno ? Deno.env.get(k) : undefined);

export default async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return json(405, { error: 'Yalnızca POST' });

  const key = env('MINIMAX_API_KEY');
  if (!key) return json(500, { error: 'Sunucuda MINIMAX_API_KEY ortam değişkeni tanımlı değil' });

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json(400, { error: 'Geçersiz istek gövdesi' });
  }

  const upstreamUrl = env('MINIMAX_BASE_URL') || 'https://api.minimax.io/v1/text/chatcompletion_v2';
  const payload = {
    model: env('MINIMAX_MODEL') || 'MiniMax-Text-01',
    max_tokens: Math.min(body.max_tokens || 2000, 6000),
    stream: true,
    messages: [{ role: 'system', content: body.system || '' }].concat(Array.isArray(body.messages) ? body.messages : [])
  };

  let upstream;
  try {
    upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    return json(502, { error: 'Sağlayıcıya ulaşılamadı: ' + String((e && e.message) || e) });
  }

  if (!upstream.ok || !upstream.body) {
    let detail = 'Sağlayıcı hatası HTTP ' + upstream.status;
    try {
      const t = await upstream.text();
      const j = JSON.parse(t);
      detail = (j.error && (j.error.message || j.error.type)) || (j.base_resp && j.base_resp.status_msg) || detail;
    } catch (e) { /* gövde JSON değil — varsayılan mesaj kalsın */ }
    return json(502, { error: detail });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      ...CORS,
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-accel-buffering': 'no'
    }
  });
};

export const config = { path: '/api/ai' };
