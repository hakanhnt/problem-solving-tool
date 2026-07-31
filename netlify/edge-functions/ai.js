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

  // OpenAI uyumlu uç — M serisi (M3) ve thinking parametresi burada desteklenir.
  // Eski yerel uç (v1/text/chatcompletion_v2) yalnız MINIMAX_BASE_URL ile seçilirse kullanılır.
  const upstreamUrl = env('MINIMAX_BASE_URL') || 'https://api.minimax.io/v1/chat/completions';
  const legacyUpstream = upstreamUrl.includes('chatcompletion_v2');
  const num = (v, lo, hi) => (isFinite(parseFloat(v)) ? Math.max(lo, Math.min(hi, parseFloat(v))) : undefined);
  const model = (typeof body.model === 'string' && body.model.trim().slice(0, 64)) || env('MINIMAX_MODEL') || 'MiniMax-M3';
  const temperature = num(body.temperature, 0, 2);
  const topP = num(body.top_p, 0.01, 1);

  const payload = {
    model,
    max_tokens: Math.min(body.max_tokens || 2000, 64000),
    stream: true,
    messages: [{ role: 'system', content: body.system || '' }].concat(Array.isArray(body.messages) ? body.messages : [])
  };
  if (temperature !== undefined) payload.temperature = temperature;
  if (topP !== undefined) payload.top_p = topP;

  // Düşünme (reasoning) modu — M3 ailesi destekler: enabled | adaptive | disabled.
  // reasoning_split=true, düşünce metnini content'ten AYIRIR; aksi hâlde yanıtın
  // içine <think>...</think> olarak gömülür ve JSON ayrıştırması bozulur.
  // Eski uç bu parametreleri tanımaz — orada hiç gönderilmez.
  const think = typeof body.thinking === 'string' ? body.thinking.trim() : '';
  if (!legacyUpstream && (think === 'enabled' || think === 'adaptive' || think === 'disabled')) {
    payload.thinking = { type: think };
    if (think !== 'disabled') payload.reasoning_split = true;
  }

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

  const upCt = (upstream.headers.get('content-type') || '').toLowerCase();

  // MiniMax hataları çoğu kez HTTP 200 + JSON gövdeyle gelir (base_resp.status_code != 0).
  // Böyle bir gövdeyi SSE diye iletirsek istemci "data:" satırı bulamaz ve gerçek hata
  // yutulup "boş yanıt" olur — akış değilse gövdeyi burada açıp anlamlı hata döndürürüz.
  if (!upstream.ok || !upstream.body || !upCt.includes('text/event-stream')) {
    let detail = 'Sağlayıcı hatası HTTP ' + upstream.status;
    let text = '';
    try {
      const t = await upstream.text();
      const j = JSON.parse(t);
      detail = (j.error && (j.error.message || j.error.type))
        || (j.base_resp && j.base_resp.status_code && j.base_resp.status_msg)
        || detail;
      // Akışsız ama başarılı yanıt (bazı uyumluluk katmanları stream'i yok sayar):
      // metni tek bir SSE olayına sarıp istemciye normal yoldan verelim.
      text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
    } catch (e) { /* gövde JSON değil — varsayılan mesaj kalsın */ }
    if (upstream.ok && text) {
      const sse = 'data: ' + JSON.stringify({ choices: [{ message: { content: text } }] }) + '\n\ndata: [DONE]\n\n';
      return new Response(sse, { status: 200, headers: { ...CORS, 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' } });
    }
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
