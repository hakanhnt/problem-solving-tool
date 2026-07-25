// Netlify Function: referans linki içeriği çekme köprüsü.
// POST {url} → {text} (HTML etiketleri temizlenmiş düz metin, ilk ~20.000 karakter)
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

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Yalnızca POST' });

  try {
    const { url } = JSON.parse(event.body || '{}');
    let u;
    try { u = new URL(url); } catch (e) { return json(400, { error: 'Geçersiz URL' }); }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return json(400, { error: 'Yalnızca http/https' });
    // SSRF koruması: özel/yerel adresleri reddet
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1)/i.test(u.hostname)) return json(400, { error: 'Bu adres desteklenmiyor' });

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    let r;
    try {
      r = await fetch(u.toString(), { signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (referans-okuyucu)' } });
    } finally {
      clearTimeout(t);
    }
    if (!r.ok) return json(502, { error: 'Kaynak HTTP ' + r.status });

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
    return json(200, { text: text.slice(0, 20000) });
  } catch (e) {
    if (e && e.name === 'AbortError') return json(504, { error: 'Kaynak 8 sn içinde yanıt vermedi' });
    return json(500, { error: String((e && e.message) || e) });
  }
};
