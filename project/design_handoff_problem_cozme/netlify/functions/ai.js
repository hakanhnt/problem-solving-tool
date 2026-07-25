// Netlify Function: YZ köprüsü — MiniMax anahtarı sunucuda (ortam değişkeninde) kalır,
// tarayıcıya asla gönderilmez. İstemci "Otomatik" modda bu uca POST atar.
exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Yalnızca POST' }) };

  const key = process.env.MINIMAX_API_KEY;
  if (!key) return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'Sunucuda MINIMAX_API_KEY ortam değişkeni tanımlı değil' }) };

  try {
    const { system, messages, max_tokens } = JSON.parse(event.body || '{}');
    const r = await fetch(process.env.MINIMAX_BASE_URL || 'https://api.minimax.io/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model: process.env.MINIMAX_MODEL || 'MiniMax-Text-01',
        max_tokens: Math.min(max_tokens || 2000, 6000),
        messages: [{ role: 'system', content: system || '' }].concat(Array.isArray(messages) ? messages : [])
      })
    });
    const j = await r.json();
    if (!r.ok) return { statusCode: 502, headers: cors, body: JSON.stringify({ error: (j.error && (j.error.message || j.error.type)) || ('Sağlayıcı hatası HTTP ' + r.status) }) };
    const text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!text) return { statusCode: 502, headers: cors, body: JSON.stringify({ error: (j.base_resp && j.base_resp.status_msg) || 'Sağlayıcıdan boş yanıt' }) };
    return { statusCode: 200, headers: Object.assign({ 'content-type': 'application/json' }, cors), body: JSON.stringify({ text }) };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: String((e && e.message) || e) }) };
  }
};
