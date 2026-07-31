// Netlify Function: YZ köprüsü — MiniMax anahtarı sunucuda (ortam değişkeninde) kalır,
// tarayıcıya asla gönderilmez. İstemci "Otomatik" modda bu uca POST atar.
// ESM: kökteki package.json "type": "module" olduğu için handler export edilir.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const json = (statusCode, obj) => ({
  statusCode,
  headers: { ...CORS, 'content-type': 'application/json' },
  body: JSON.stringify(obj)
});

// Netlify'ın senkron fonksiyon sınırı 10 sn; sağlayıcıyı biraz önce keserek
// gövdesiz 502 yerine anlaşılır bir hata döndürüyoruz.
const PROVIDER_TIMEOUT_MS = 9000;

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Yalnızca POST' });

  const key = process.env.MINIMAX_API_KEY;
  if (!key) return json(500, { error: 'Sunucuda MINIMAX_API_KEY ortam değişkeni tanımlı değil' });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const body = JSON.parse(event.body || '{}');
    const { system, messages, max_tokens } = body;
    const num = (v, lo, hi) => (isFinite(parseFloat(v)) ? Math.max(lo, Math.min(hi, parseFloat(v))) : undefined);
    const payload = {
      model: (typeof body.model === 'string' && body.model.trim().slice(0, 64)) || process.env.MINIMAX_MODEL || 'MiniMax-M3',
      max_tokens: Math.min(max_tokens || 2000, 64000),
      messages: [{ role: 'system', content: system || '' }].concat(Array.isArray(messages) ? messages : [])
    };
    const temperature = num(body.temperature, 0, 2);
    const topP = num(body.top_p, 0.01, 1);
    if (temperature !== undefined) payload.temperature = temperature;
    if (topP !== undefined) payload.top_p = topP;
    // OpenAI uyumlu uç — M serisi ve thinking burada desteklenir; eski uç yalnız
    // MINIMAX_BASE_URL ile seçilirse kullanılır ve thinking parametresi gönderilmez.
    const upstreamUrl = process.env.MINIMAX_BASE_URL || 'https://api.minimax.io/v1/chat/completions';
    const think = typeof body.thinking === 'string' ? body.thinking.trim() : '';
    if (!upstreamUrl.includes('chatcompletion_v2') && (think === 'enabled' || think === 'adaptive' || think === 'disabled')) {
      payload.thinking = { type: think };
      if (think !== 'disabled') payload.reasoning_split = true;
    }

    const r = await fetch(upstreamUrl, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify(payload)
    });
    const j = await r.json();
    if (!r.ok) return json(502, { error: (j.error && (j.error.message || j.error.type)) || ('Sağlayıcı hatası HTTP ' + r.status) });
    const text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!text) return json(502, { error: (j.base_resp && j.base_resp.status_msg) || 'Sağlayıcıdan boş yanıt' });
    return json(200, { text });
  } catch (e) {
    if (e && e.name === 'AbortError') {
      return json(504, { error: 'Sağlayıcı ' + (PROVIDER_TIMEOUT_MS / 1000) + ' sn içinde yanıt vermedi — daha kısa bir istekle tekrar deneyin ya da Ayarlar > YZ Sağlayıcı bölümünden kendi anahtarınızı girin' });
    }
    return json(500, { error: String((e && e.message) || e) });
  } finally {
    clearTimeout(timer);
  }
};
