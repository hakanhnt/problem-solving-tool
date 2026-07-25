// Netlify Function: referans linki içeriği çekme köprüsü.
// POST {url} → {text} (HTML etiketleri temizlenmiş düz metin, ilk ~20.000 karakter)
exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Yalnızca POST' }) };
  try {
    const { url } = JSON.parse(event.body || '{}');
    let u;
    try { u = new URL(url); } catch (e) { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Geçersiz URL' }) }; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Yalnızca http/https' }) };
    // SSRF koruması: özel/yerel adresleri reddet
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1)/i.test(u.hostname)) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Bu adres desteklenmiyor' }) };
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const r = await fetch(u.toString(), { signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (referans-okuyucu)' } });
    clearTimeout(t);
    if (!r.ok) return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'Kaynak HTTP ' + r.status }) };
    const ct = (r.headers.get('content-type') || '').toLowerCase();
    let text = await r.text();
    if (ct.includes('html')) {
      text = text
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/\s{2,}/g, ' ').trim();
    }
    return { statusCode: 200, headers: Object.assign({ 'content-type': 'application/json' }, cors), body: JSON.stringify({ text: text.slice(0, 20000) }) };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: String((e && e.message) || e) }) };
  }
};
