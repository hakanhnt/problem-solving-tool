// YZ katmanı: tek giriş noktası complete({system, messages, max_tokens}) -> metin
// ve tüm sistem talimatı / görev şeması üreticileri.

import { AGENT_TITLES } from './defaults.js';
import { BIASES, THINKING_METHOD_INFO } from './thinking.js';

/** Sistem talimatına eklenen yöntem ↔ yanılgı eşleşmesi (kurum dokümanı). */
// Uydurma sayı üretmeyi engeller: kullanıcının verisinde olmayan rakamlar açıkça yer tutucu sayılır.
const NUMBER_RULE = '\n\nSAYI KULLANIMI — KATI KURAL: Kullanıcının çalışma verisinde (ya da eklediği referanslarda) BULUNMAYAN hiçbir sayıyı gerçekmiş gibi yazma. Yüzde, gün, adet, tutar, oran uydurma; "%38 gecikme", "3 gün kayıp" gibi ölçümleri kendin türetme. Bir büyüklüğe atıfta bulunman gerekiyorsa ya kullanıcının kendi verisindeki sayıyı aynen kullan ya da "[ölçün: ...]" biçiminde boş bırak. Bir örnek vermek zorundaysan sayının hemen yanına "(örnek değer)" yaz. Kullanıcı sayı sorarsa "bu değeri sizin verinizden ölçmelisiniz" de.\n\nDAYANAK BELİRTME: Her önerinin neye dayandığı anlaşılmalı — kullanıcının kendi verisinden mi türedi, eklediği referanstan mı geldi, yoksa genel metodolojiden gelen doğrulanmamış bir varsayım mı? Genel metodolojiden geliyorsa bunu açıkça yaz ("bu bir varsayım, verinizle doğrulayın").';

const BIAS_RULE ='\n\nDÜŞÜNME YANILGILARI FARKINDALIĞI — kurum dokümanına göre her sağlıklı düşünme yöntemi belirli bir bilişsel yanılgıya karşı denge mekanizmasıdır: '
  + Object.keys(THINKING_METHOD_INFO).map(k => k + ' → ' + THINKING_METHOD_INFO[k].bias).join('; ')
  + '. Kullanıcının girdilerinde bu yanılgıların izini görürsen (tek nedene indirgeme, ilk fikre çapalanma, yalnız kendini doğrulayan veri, "bu kadar yatırım yaptık" savunması, saha yerine varsayım, sonuca bakıp kararı doğru sayma) bunu nazikçe ama açıkça adıyla söyle ve panzehir yöntemin sorusunu sor. Yanılgıyı kişisel bir zayıflık gibi değil, herkeste çalışan sistematik bir zihin eğilimi olarak anlat.';

/**
 * Sağlayıcı katmanı.
 * - auto      : /.netlify/functions/ai köprüsü (anahtar sunucuda, tarayıcıya inmez)
 * - minimax   : OpenAI uyumlu chat/completions
 * - openai    : OpenAI (veya uyumlu) chat/completions
 * - anthropic : Anthropic Messages API (tarayıcıdan doğrudan erişim başlığıyla)
 */
const BRIDGE_HINT = ' — Ayarlar > YZ Sağlayıcı bölümünden kendi API anahtarınızı girebilirsiniz';

/** Anahtar eksikken gösterilecek, hangi sağlayıcının seçili olduğunu söyleyen mesajlar. */
const PROVIDER_LABELS = {
  minimax: 'Ayarlar\'da "MiniMax" sağlayıcısı seçili ama API anahtarı girilmemiş — anahtarı girin ya da "Otomatik" moda dönün',
  openai: 'Ayarlar\'da "OpenAI" sağlayıcısı seçili ama API anahtarı girilmemiş — anahtarı girin ya da "Otomatik" moda dönün',
  anthropic: 'Ayarlar\'da "Anthropic" sağlayıcısı seçili ama API anahtarı girilmemiş — anahtarı girin ya da "Otomatik" moda dönün'
};

/**
 * Geçerli düşünme (reasoning) modları — MiniMax M3 yalnızca bu ikisini kabul eder
 * (thinking.type: adaptive | disabled; "enabled" sağlayıcıda 2013 hatası verir).
 */
export const THINK_MODES = ['disabled', 'adaptive'];

/** Ayarlardaki üretim parametrelerini (sıcaklık / top_p / düşünme) istek gövdesine çevirir. */
function genParams(S) {
  const o = {};
  const t = parseFloat(S.temperature);
  const p = parseFloat(S.topP);
  if (isFinite(t)) o.temperature = Math.max(0, Math.min(2, t));
  if (isFinite(p)) o.top_p = Math.max(0.01, Math.min(1, p));
  // Eski kayıtlarda kalmış 'enabled' değeri sağlayıcıyı kızdırmasın: adaptive sayılır.
  const th = S.thinking === 'enabled' ? 'adaptive' : S.thinking;
  if (THINK_MODES.includes(th)) o.thinking = th;
  return o;
}

/**
 * Düşünen modellerin yanıt gövdesine sızabilen düşünce bloklarını temizler.
 * reasoning_split=true istendiğinde düşünce ayrı alanda gelir; yine de sağlayıcı
 * ya da ara katman bunu yok sayarsa <think>…</think> içeriği metne karışır ve
 * JSON ayrıştırması bozulur. Kapanmamış blok da (kesilen yanıt) temizlenir.
 */
export function stripThinking(text) {
  let s = String(text == null ? '' : text);
  s = s.replace(/<think(?:ing)?\b[^>]*>[\s\S]*?<\/think(?:ing)?>/gi, '');
  s = s.replace(/<think(?:ing)?\b[^>]*>[\s\S]*$/i, '');
  return s.replace(/^\s*<\/think(?:ing)?>/i, '').trim();
}

/** "Ad: değer" satırlarını başlık nesnesine çevirir (özel sağlayıcı ek başlıkları). */
function parseHeaderLines(raw) {
  const out = {};
  String(raw || '').split('\n').forEach(line => {
    const i = line.indexOf(':');
    if (i <= 0) return;
    const name = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    if (name && value) out[name] = value;
  });
  return out;
}

/**
 * Farklı uyumluluk katmanlarının yanıt biçimlerinden metni çıkarır.
 * Düşünen modellerin reasoning_content alanı bilerek alınmaz; content içine
 * sızmış <think> blokları da temizlenir.
 */
function pickText(j) {
  if (!j) return '';
  const ch = j.choices && j.choices[0];
  if (ch) {
    if (ch.message && ch.message.content) return stripThinking(ch.message.content);   // OpenAI uyumlu
    if (ch.text) return stripThinking(ch.text);                                       // eski completions
  }
  if (j.message && j.message.content) return stripThinking(j.message.content);        // Ollama yerel biçim
  if (Array.isArray(j.content)) return stripThinking(j.content.filter(b => b && b.type !== 'thinking').map(b => b.text || '').join('')); // Anthropic biçimi
  if (typeof j.response === 'string') return stripThinking(j.response);               // Ollama /api/generate
  return '';
}

/** Yanıt gövdesindeki hata mesajını bulur (sağlayıcılar farklı alanlar kullanıyor). */
function pickError(j) {
  if (!j) return '';
  if (typeof j.error === 'string') return j.error;
  if (j.error && (j.error.message || j.error.type)) return j.error.message || j.error.type;
  if (j.base_resp && j.base_resp.status_msg) return j.base_resp.status_msg;
  if (typeof j.detail === 'string') return j.detail;
  if (typeof j.message === 'string') return j.message;
  return '';
}

/** Köprülere gönderilen ortak gövde: mesajlar + model/üretim tercihleri. */
function bridgeBody(S, opts) {
  return JSON.stringify({
    system: opts.system,
    messages: opts.messages,
    max_tokens: opts.max_tokens || 2000,
    model: (S.model || '').trim() || undefined,
    ...genParams(S)
  });
}

/** Köprü uçları yoksa (yerel `vite dev`, eski deploy) bu işaretle fallback tetiklenir. */
function missing(msg) {
  const e = new Error(msg);
  e.bridgeMissing = true;
  return e;
}

/**
 * Akışlı köprü (/api/ai — Netlify Edge Function).
 * Serverless fonksiyonların 10 sn'lik senkron sınırına takılmamak için yanıt SSE olarak
 * akar; burada delta'lar birleştirilip tam metin döndürülür.
 */
async function streamBridge(S, opts) {
  let r;
  try {
    r = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: bridgeBody(S, opts)
    });
  } catch (e) {
    throw missing('Akışlı köprüye ulaşılamadı');
  }

  const ct = (r.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('text/event-stream') || !r.body) {
    if (r.ok) throw missing('Akışlı köprü bu ortamda yok');
    let j = null;
    try { j = await r.json(); } catch (e) { /* gövde JSON değil */ }
    if (r.status === 404 || r.status === 405) throw missing('Akışlı köprü bulunamadı');
    throw new Error((j && j.error) || ('Demo YZ hizmetine ulaşılamadı (HTTP ' + r.status + ')' + BRIDGE_HINT));
  }

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let deltaText = '';   // delta.content parçalarının birleşimi
  let wholeText = '';   // message.content ile gelen tam metin (son paket kazanır)
  let sawDelta = false;
  let sawThinking = false;   // model düşündü mü (arayüzde "düşünüyor" bilgisi için)
  let providerError = '';

  // MiniMax delta'ların ardından son pakette tüm metni message.content olarak tekrar
  // gönderir; ikisini toplarsak metin çiftlenir (JSON ayrıştırma patlar). Delta gördüysek
  // yalnız delta'ları, hiç görmediysek tam metni kullanırız.
  const consume = chunk => {
    const payload = chunk.trim();
    if (!payload || payload === '[DONE]') return;
    let j;
    try { j = JSON.parse(payload); } catch (e) { return; }
    if (j.base_resp && j.base_resp.status_code) providerError = j.base_resp.status_msg || ('Sağlayıcı hata kodu ' + j.base_resp.status_code);
    if (j.error && (j.error.message || j.error.type)) providerError = j.error.message || j.error.type;
    const ch = (j.choices && j.choices[0]) || null;
    if (!ch) return;
    // Düşünce parçaları (reasoning_content / reasoning_details) BİLEREK yok sayılır:
    // yanıt metnine karışırsa JSON ayrıştırması bozulur. Yalnız content birleştirilir.
    const dp = ch.delta && ch.delta.content;
    if (dp) { sawDelta = true; deltaText += dp; notify(); return; }
    if (ch.delta && (ch.delta.reasoning_content || ch.delta.reasoning_details)) { sawThinking = true; return; }
    const mp = ch.message && ch.message.content;
    if (mp) { wholeText = mp; notify(); }
  };

  // onDelta: o ana kadarki tam metinle çağrılır; arayüz kendisi throttle eder.
  const notify = () => {
    if (typeof opts.onDelta === 'function') {
      try { opts.onDelta(sawDelta ? deltaText : wholeText, { thinking: sawThinking }); } catch (e) { /* arayüz hatası akışı durdurmasın */ }
    }
  };

  let raw = '';          // hiç "data:" satırı gelmezse gövdeyi teşhis için saklarız
  let sawDataLine = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    buf += chunk;
    if (raw.length < 4000) raw += chunk;
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).replace(/\r$/, '');
      buf = buf.slice(nl + 1);
      if (line.startsWith('data:')) { sawDataLine = true; consume(line.slice(5)); }
    }
  }
  if (buf.startsWith('data:')) { sawDataLine = true; consume(buf.slice(5)); }

  // Gövde SSE değil düz JSON'sa (sağlayıcı hatası ya da akışsız yanıt) buradan çöz.
  if (!sawDataLine && raw.trim()) {
    try {
      const j = JSON.parse(raw);
      const t = pickText(j);
      if (t) { wholeText = t; }
      else providerError = providerError || pickError(j);
    } catch (e) { /* gövde JSON da değil — genel mesaja düşülür */ }
  }

  const text = stripThinking(sawDelta ? deltaText : wholeText);
  if (!text.trim()) {
    if (sawThinking) throw new Error('Model düşündü ama yanıt üretmeden bütçe doldu — Ayarlar\'dan analiz derinliğini artırın ya da düşünme modunu "Kapalı"ya alın.');
    throw new Error(providerError || ('Sağlayıcıdan boş yanıt geldi' + BRIDGE_HINT));
  }
  return text;
}

/** Akışsız köprü (/.netlify/functions/ai) — edge ucu yoksa yedek yol. */
async function plainBridge(S, opts) {
  const r = await fetch('/.netlify/functions/ai', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: bridgeBody(S, opts)
  });
  let j = null;
  try { j = await r.json(); } catch (e) { /* gövde JSON değil */ }
  if (!r.ok || !j || !j.text) {
    throw new Error((j && j.error) || ('Demo YZ hizmetine ulaşılamadı (HTTP ' + r.status + ')' + BRIDGE_HINT));
  }
  return stripThinking(j.text);
}

export async function complete(settings, opts) {
  const S = settings || {};
  const prov = S.provider || 'auto';

  if (prov === 'auto') {
    try {
      return await streamBridge(S, opts);
    } catch (e) {
      if (!(e && e.bridgeMissing)) throw e;
      return await plainBridge(S, opts);
    }
  }

  // Özel (OpenAI uyumlu) uç nokta: OpenRouter, kurumsal ağ geçitleri, LiteLLM,
  // Ollama / LM Studio gibi yerel sunucular. Kimlik doğrulama başlığı serbesttir:
  // anahtarsız (yerel), Bearer (çoğu servis) ya da özel başlık (örn. Azure: api-key).
  if (prov === 'ozel') {
    const base = (S.baseUrl || '').trim();
    if (!base) throw new Error('Özel sağlayıcı için API adresi gerekli — Ayarlar > YZ Sağlayıcı bölümüne uç nokta adresini girin');
    const headers = { 'content-type': 'application/json', ...parseHeaderLines(S.extraHeaders) };
    const k = (S.apiKey || '').trim();
    if (k) {
      const name = (S.headerName || '').trim() || 'Authorization';
      const prefix = S.headerPrefix === undefined || S.headerPrefix === null ? 'Bearer ' : String(S.headerPrefix);
      headers[name] = prefix + k;
    }
    const body = {
      max_tokens: opts.max_tokens || 2000,
      messages: [{ role: 'system', content: opts.system }].concat(opts.messages),
      ...genParams(S)
    };
    const m = (S.model || '').trim();
    if (m) body.model = m;

    let r;
    try {
      r = await fetch(base, { method: 'POST', headers, body: JSON.stringify(body) });
    } catch (e) {
      throw new Error('Uç noktaya ulaşılamadı (' + base + '). Adresi ve sunucunun tarayıcıdan erişime izin verdiğini (CORS) kontrol edin.');
    }
    let j = null;
    try { j = await r.json(); } catch (e) { /* gövde JSON değil */ }
    if (!r.ok) throw new Error(pickError(j) || ('Uç nokta hatası HTTP ' + r.status));
    const text = pickText(j);
    if (!text) throw new Error(pickError(j) || 'Uç noktadan boş yanıt geldi');
    return text;
  }

  const key = (S.apiKey || '').trim();
  if (!key) throw new Error(PROVIDER_LABELS[prov] || prov + ' seçili, ama API anahtarı girilmemiş — Ayarlar > YZ Sağlayıcı bölümünden anahtarınızı girin ya da "Otomatik" moda dönün');

  if (prov === 'anthropic') {
    const r = await fetch((S.baseUrl || '').trim() || 'https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: (S.model || '').trim() || 'claude-sonnet-4-5',
        max_tokens: opts.max_tokens || 2000,
        system: opts.system,
        messages: opts.messages,
        ...genParams(S)
      })
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || ('HTTP ' + r.status));
    return (j.content || []).map(b => b.text || '').join('');
  }

  const base = (S.baseUrl || '').trim() || (prov === 'openai' ? 'https://api.openai.com/v1/chat/completions' : 'https://api.minimax.io/v1/chat/completions');
  const model = (S.model || '').trim() || (prov === 'openai' ? 'gpt-4o-mini' : 'MiniMax-M3');
  const r = await fetch(base, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
    body: JSON.stringify({
      model,
      max_tokens: opts.max_tokens || 2000,
      messages: [{ role: 'system', content: opts.system }].concat(opts.messages),
      ...genParams(S)
    })
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && (j.error.message || j.error.type)) || ('HTTP ' + r.status));
  const text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  if (!text) throw new Error((j.base_resp && j.base_resp.status_msg) || 'Sağlayıcıdan boş yanıt geldi');
  return text;
}

/**
 * LLM JSON'larındaki en yaygın üç bozukluğu onarır:
 * 1) Değer İÇİNDEKİ kaçışsız çift tırnak — dizgeyi erken kapatır ve
 *    "Expected ',' or '}' after property value" hatasına yol açar. Kapanış
 *    tırnağı sayılması için tırnaktan sonraki ilk anlamlı karakterin yapısal
 *    (, } ] :) olması gerekir; değilse içerik tırnağıdır, \" ile kaçırılır.
 * 2) Dizge içindeki çıplak satır sonu → \n.
 * 3) Sondaki virgül (",}" / ",]") ve iki dizge arasında unutulan virgül.
 */
export function repairJson(s) {
  let out = '';
  let inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (!inStr) {
      if (ch === '"') inStr = true;
      out += ch;
      continue;
    }
    if (esc) { out += ch; esc = false; continue; }
    if (ch === '\\') { out += ch; esc = true; continue; }
    if (ch === '\n') { out += '\\n'; continue; }
    if (ch === '\r') continue;
    if (ch === '"') {
      let j = i + 1;
      while (j < s.length && /\s/.test(s[j])) j++;
      const nx = s[j];
      if (nx === ',' || nx === '}' || nx === ']' || nx === ':' || j >= s.length) { inStr = false; out += ch; }
      else if (nx === '"') { inStr = false; out += ch + ','; }   // "a":"x" "b":… — virgül unutulmuş
      else out += '\\"';                                          // içerik tırnağı
      continue;
    }
    out += ch;
  }
  return out.replace(/,\s*([}\]])/g, '$1');
}

/** Metindeki ilk dengeli { … } bloğunu bulur (dizge içindeki süslü parantezleri sayma). */
function firstBalancedObject(s, from) {
  let depth = 0, inStr = false, esc = false;
  for (let i = from; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return s.slice(from, i + 1);
  }
  return null;
}

/**
 * YZ yanıtından tek bir JSON nesnesi ayıklar (kod bloğu işaretlerini temizler).
 * Model JSON'un ardına açıklama eklerse ya da metni tekrarlarsa ilk dengeli nesneye düşer.
 */
export function parseJsonReply(reply) {
  const clean = stripThinking(reply).replace(/```(json)?/gi, '');
  const a = clean.indexOf('{'), b = clean.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('Yanıtta JSON bulunamadı');
  const cand = clean.slice(a, b + 1);
  let firstErr = null;
  // Sırayla: ham aday → ilk dengeli nesne → onarılmış aday → onarılmışın ilk dengeli nesnesi.
  const attempts = [cand, firstBalancedObject(clean, a), repairJson(cand)];
  const repaired = repairJson(clean);
  attempts.push(firstBalancedObject(repaired, repaired.indexOf('{')));
  for (const s of attempts) {
    if (!s) continue;
    try { return JSON.parse(s); } catch (e) { if (!firstErr) firstErr = e; }
  }
  throw firstErr || new Error('Yanıttaki JSON ayrıştırılamadı');
}

/**
 * Kesilmiş/bozuk bir yanıttan, verilen anahtarı içeren TAMAMLANMIŞ iç nesneleri kurtarır.
 * Kullanım: uzun liste üreten görevlerde (pre-mortem senaryoları gibi) yanıt token
 * bütçesine sığmayıp yarıda kesilirse dış JSON ayrıştırılamaz; ama ilk birkaç öğe
 * bütün hâldedir — hepsini kaybetmek yerine onları kullanırız.
 */
export function extractObjects(reply, requiredKey) {
  const s = stripThinking(reply).replace(/```(json)?/gi, '');
  const out = [];
  let i = 0;
  while ((i = s.indexOf('{', i)) >= 0) {
    const block = firstBalancedObject(s, i);
    // Dış nesne kesik olsa da İÇİNDEKİ nesneler bütün olabilir — bir sonraki '{' denenir.
    if (!block) { i += 1; continue; }
    try {
      let j;
      try { j = JSON.parse(block); } catch (e) { j = JSON.parse(repairJson(block)); }
      if (j && typeof j === 'object' && !Array.isArray(j) && (!requiredKey || j[requiredKey] !== undefined)) {
        out.push(j);
        i += block.length;                 // bulunanın içine tekrar girme
        continue;
      }
    } catch (e) { /* bu blok bozuk — bir sonraki '{' denenir */ }
    i += 1;
  }
  return out;
}

/** Vakanın referanslarını ~8.000 karakterlik bütçeyle sistem talimatına ekler. */
export function buildRefBlock(c) {
  const refs = c.references || [];
  if (!refs.length) return '';
  let budget = 8000;
  const lines = [];
  refs.forEach((r, i) => {
    let body = (r.summary || r.text || '').trim();
    if (!body) body = r.url ? 'İçerik alınamadı — kullanıcıya gerekirse sorun. URL: ' + r.url : '(boş)';
    if (body.length > budget) body = body.slice(0, Math.max(0, budget)) + '… [kırpıldı]';
    budget = Math.max(0, budget - body.length);
    lines.push('R' + (i + 1) + ' · ' + (r.title || r.url || 'Referans') + ' (' + (r.type || 'not') + ')' + (r.url ? ' [' + r.url + ']' : '') + ':\n' + body);
  });
  return '\n\nKULLANICI REFERANSLARI — öneri ve değerlendirmelerinde ilgili referanslara R1, R2 biçiminde atıf yap; referanslardaki verilerle çelişen kullanıcı girdilerini açıkça belirt:\n' + lines.join('\n---\n');
}

/** Adım odaklı sistem talimatı — tüm YZ akışları (rehber, sohbet, karar, rapor) bunu paylaşır. */
export function buildSystem(step, c, aiSettings, principles) {
  const PR = principles || [];
  const FOCUS = [
    "Problem ifadesinin çözüm ya da neden içermemesi, ölçülebilir olması; kapsam boyutlarının (coğrafya/cluster, dönem, marka/kategori) ve KPI farkının netliği.",
    "Sonucu sürükleyen ana driver'ların eksiksizliği (MECE), hangi süreçlerle ilişkili oldukları; işi yapanlara sorma ve yerinde gözlem planı.",
    "Etkisi en büyük driver'ların alt bileşenleri; SIPOC'a göre girdi kalitesi ve süreç metriklerindeki bozukluklar.",
    "Her bulgunun ölçülmüş, veriyle kanıtlanmış spesifik bir sapma olması; varsayım kalan yerlerin işaretlenmesi. Bu adımda çözüm önerilmez.",
    "5 Neden zincirinin mantıksal tutarlılığı, balık kılçığı kategorileri; kök nedenin dışarıda değil önce kullanıcının kendi yetkinliklerinde ve şu kurum prensiplerindeki gelişim alanlarında aranması. VAR/YOK belirtimi doluysa her kök neden adayını şu testten geçir: bu neden hem VAR tarafını hem YOK tarafını açıklıyor mu — açıklamıyorsa bunu söyle ve adayı sorgula; 'değişiklik' alanı doluysa nedeni önce o değişiklikle ilişkilendir. Bulgularda sapmaya katkı değerleri girildiyse analizi en büyük katkılı bulgudan başlat. Prensipler: " + PR.map((p, i) => (i + 1) + '. ' + p).join(' | '),
    "Geçici önlem (containment) ile kalıcı çözüm ayrımının korunması — geçici önlem müşteriyi bugün korur ama kök nedeni çözmez, karar asla geçici önlemin kendisi olamaz. Alternatiflerin farklı düşünme yöntemleriyle (ilk ilkeler, eleştirel, yanal, tasarım, sistem, algoritmik, ikinci düzey) üretilmesi; karar kriterlerinin kısıt ve riskleri yansıtması; matris puanlarının tutarlılığı; kararın ve gerekçenin kök nedeni gerçekten gidermesi.",
    "Aksiyonların ilerleme durumu, KPI trendinin hedefe kapanıp kapanmadığı, retrospektifin dürüstlüğü; işe yaramayan karşı önlemin erken tespiti ve işe yarayanın standartlaştırılması.",
    "Çalışmanın bütününün tutarlılığı; raporun ve yönetici özetinin kısa, veriye dayalı ve karar odaklı olması."
  ];
  const data = {
    problemTanimi: c.problem, driverlar: c.drivers, driverAnalizi: c.driverAnalysis, sipoc: c.sipoc,
    bulgular: c.findings, besNeden: c.whys, balikKilcigi: c.fishbone,
    kokNedenler: (c.rootCauses || []).map(r => ({ kokNeden: r.text, iliskiliPrensipler: (r.principles || []).map(pi => (pi + 1) + '. ' + (PR[pi] || '')), yetkinlikGelisimAlani: r.competency })),
    kararOncesiDusunmeKontrolu: c.thinking || {},
    varYokBelirtimi: c.spec || {},
    geciciOnlem: c.containment || {},
    alternatifler: c.alternatives, kararKriterleri: c.criteria, matrisPuanlari: c.scores, karar: c.decision,
    aksiyonPlani: c.actions || [],
    izleme: { kpiOlcumleri: c.tracking || [], retrospektif: c.retro || {} }
  };
  const S = aiSettings || {};
  let extra = '';
  if ((S.context || '').trim()) extra += '\n\nKullanıcının alan/sektör bağlamı: ' + S.context.trim() + ' — örneklerini ve terminolojini bu bağlama uyarla.';
  if (S.level === 'ogreten') extra += '\n\nRehberlik seviyesi: ÖĞRETEN — hazır cevap, taslak ve çözüm VERME; kullanıcı ısrar etse bile verme, bunun bir öğrenme aracı olduğunu nazikçe hatırlat. Sokratik yöntemle çalış: (1) Kullanıcının son cevabını önce DEĞERLENDİR — yüzeysel mi, belirti düzeyinde mi, veriye mi dayanıyor? (2) Yüzeyselse kabul etme; hangi açıdan eksik olduğunu tek cümleyle söyle ve bir seviye derine indirecek TEK bir soru sor (soru bombardımanı yapma). (3) Cevap sağlamsa bunu açıkça teslim et ve bir sonraki düşünme hamlesine geçir. (4) Her 3-4 turda bir kullanıcının nereden nereye geldiğini bir cümleyle özetle ki ilerlemeyi görsün. Amaç cevabı vermek değil, kullanıcının kendi zincirini kurması.';
  if (S.level === 'hizli') extra += '\n\nRehberlik seviyesi: HIZLANDIRAN — kullanıcı hız istiyor; eksiksiz, doğrudan kullanılabilir, spesifik taslaklar üret; kısa gerekçe ekle.';
  extra += S.length === 'detayli'
    ? '\nYanıt uzunluğu: DETAYLI — açıklamalarını gerekçeleriyle, örnekli yaz.'
    : '\nYanıt uzunluğu: KISA — olabildiğince az kelime, madde işaretli, dolgu cümlesi yok.';
  extra += S.tone === 'samimi'
    ? '\nÜslup: samimi bir koç gibi — "sen" diye hitap et, cesaretlendir.'
    : '\nÜslup: resmi ve profesyonel — "siz" diye hitap et.';
  extra += S.critic === 'sert'
    ? '\nEleştirellik: SERT DENETÇİ — zayıf, ölçüsüz veya varsayıma dayalı girdileri açıkça reddet ve nedenini söyle; nezaket için yumuşatma.'
    : '\nEleştirellik: yapıcı ve nazik — eksikleri belirt ama cesaret kırma.';
  if (S.depth === 'genis') extra += '\nAnaliz derinliği: GENİŞ — aday sayısını üst sınırda tut, her maddeye kısa bir gerekçe ekle, gözden kaçan alanları da tara.';
  if (S.depth === 'derin') extra += '\nAnaliz derinliği: DERİN — mümkün olan en kapsamlı analizi yap: her madde için gerekçe, hangi veriyle doğrulanacağı ve sınama sorusu ver; birbiriyle yarışan alternatif yorumları belirt; zayıf halkaları ve riskleri açıkça işaretle. Uzunluktan çekinme, ama dolgu cümlesi yazma — her cümle bilgi taşısın.';
  extra += NUMBER_RULE;
  extra += BIAS_RULE;
  return 'Sen "' + AGENT_TITLES[step - 1] + '" rolünde, kabul görmüş problem çözme ve karar verme metodolojisinde uzman bir koçsun. Metodoloji alan bağımsızdır: kullanıcının problemi lojistik, tedarik, pazarlama, satış, e-ticaret, teknoloji/BT, operasyon, mağazacılık, İK, finans veya başka herhangi bir alanda olabilir — örneklerini ve sorularını kullanıcının kendi alanına uyarla, ürün/ithalat varsayımı yapma. Kullanıcı 6 adımlı akışta (1 Problem Tanımı, 2 Business Driver Haritalama, 3 Driver Analizi, 4 Problem Bulguları, 5 Kök Neden Analizi, 6 Karşı Önlemler ve Karar) kendi iş problemini çalışıyor; şu anda Adım ' + step + ' üzerinde.\n\nKurallar:\n- Türkçe, kısa, net ve madde işaretli yaz; başlık ve numaralı maddeler kullanabilirsin ama markdown yıldızı yerine sade metin tercih et.\n- Problem, problem bulgusu ve kök neden farklı şeylerdir; karışıklık görürsen açıkça düzelt.\n- 1-4. adımlarda çözüm önerme; doğru soruları sordurarak koçluk et.\n- Kök neden adımında nedeni dışarıda (paydaşta, üreticide) değil, önce kullanıcının kendi yetkinliklerinde ve kurum prensiplerindeki gelişim alanlarında aramasına yardım et.\n- Somut ol: kullanıcının verisindeki ifadelere atıf yap; eksik, zayıf veya çelişkili yerleri açıkça belirt.\n- Cevabının sonunda kullanıcının kendine veya paydaşlarına sorması gereken 2-3 doğru soruyu öner.\n\nBu adımın odağı: ' + FOCUS[step - 1] + '\n\nKullanıcının mevcut çalışma verisi (JSON):\n' + JSON.stringify(data) + extra + buildRefBlock(c);
}

/** Adım başına rehberin isteyeceği katı JSON şeması. */
export function buildCoachTask(step, principles) {
  const P = principles || [];
  const T = {
    1: 'Görev: Kullanıcının mevcut problem tanımını metodolojiye uygun şekilde netleştir. İfadeyi yeniden yaz: çözüm, neden ve suçlama içermesin; hedef ile gerçekleşen arasındaki ölçülebilir farkı belirtsin; spesifik olsun. Boyutları (yer/birim, dönem, kırılım) ve KPI alanlarını kullanıcının anlattıklarından çıkarabildiğin kadar doldur; bilinmeyenler için köşeli parantezle [doldurun: ...] yaz. JSON şeması: {"giris":"1-2 cümlelik yönlendirme","ifade":"netleştirilmiş problem ifadesi","boyutlar":{"yer":"...","zaman":"...","kirilim":"..."},"kpi":{"ad":"...","hedef":"...","gerceklesen":"..."},"sorular":["ifadeyi netleştirmek için kullanıcının cevaplaması gereken 3-4 soru"]}',
    2: 'Görev: Kullanıcının problem tanımına göre, sonucu sürükleyebilecek 4-6 aday ana driver (iş sürücüsü) öner. Driver\'lar MECE olmalı ve kullanıcının problem alanına özgü olmalı. JSON şeması: {"giris":"kullanıcıya 1-2 cümlelik yönlendirme: bu önerilerle ne yapmalı","driverlar":[{"ad":"driver adı","not":"hangi süreçleri kapsar, kimlerle yürür, neden şüphelenilmeli"}],"sorular":["doğrulamak için işi yapanlara/paydaşlara sorulacak 3-4 soru"]}',
    3: 'Görev: Kullanıcının driver haritasına (boşsa problem tanımına) göre, sorun çıkma olasılığı en yüksek driver\'lar için 3-5 alt bileşen analizi satırı ve sorunlu süreç adımları için 2-3 SIPOC satırı öner. Tespitleri "doğrulanması gereken şüphe" diliyle yaz. Her metni 1-2 kısa cümleyle sınırla; JSON\'un kesilmeden tamamlanması kritik. JSON şeması: {"giris":"...","altBilesenler":[{"driver":"...","altBilesen":"...","tespit":"..."}],"sipoc":[{"s":"tedarikçi","i":"girdi","p":"süreç","o":"çıktı","c":"müşteri"}],"sorular":["..."]}',
    4: 'Görev: Önceki adımlardaki analize göre, kullanıcının VERİYLE DOĞRULAMASI gereken 3-5 bulgu hipotezi öner. Her hipotez ölçülebilir bir sapma cümlesi taslağı olsun (kullanıcı gerçek sayıları kendisi ölçecek) ve hangi veri kaynağından doğrulanacağını belirt. JSON şeması: {"giris":"...","bulgular":[{"bulgu":"ölçülebilir sapma taslağı","kanitKaynagi":"hangi veri/rapor/sistemden doğrulanır"}],"sorular":["..."]}',
    5: 'Görev: Kullanıcının bulgularına göre taslak bir 5 Neden zinciri (tam 5 öğe), balık kılçığı kategorileri için kısa notlar ve 2-3 aday kök neden öner. Kök nedenleri dış paydaşta değil, önce kullanıcının kendi süreç, ölçüm, sahiplik ve yetkinlik gelişim alanlarında ara. Kurum prensipleri (numarayla atıf yap): ' + P.map((p, i) => (i + 1) + '. ' + p).join(' | ') + '. JSON şeması: {"giris":"...","besNeden":["1. neden","2. neden","3. neden","4. neden","5. neden"],"balikKilcigi":{"insan":"...","metot":"...","sistem":"...","girdi":"...","olcum":"...","cevre":"..."},"kokNedenler":[{"kokNeden":"...","prensipler":[16,12],"yetkinlik":"yetkinlik gelişim alanı"}],"sorular":["..."]}',
    6: 'Görev: Kullanıcının kök nedenlerine göre FARKLI düşünme yöntemleriyle 3-4 alternatif çözüm öner; her biri kök nedeni gidermeli, belirtiyi değil. Yöntem şu listeden birebir seçilmeli: İlk ilkeler düşüncesi, Eleştirel düşünce, Yanal düşünce, Tasarım odaklı düşünce, Sistem düşüncesi, Algoritmik düşünce, İkinci düzey düşünce, Best practice adaptasyonu. Probleme özgü ek karar kriteri gerekiyorsa öner. Ayrıca önerdiğin alternatiflere dayanarak taslak bir karar ve gerekçe yaz: gerekçe kararın kök nedeni nasıl giderdiğini ve kısıt/riskleri nasıl karşıladığını açıklamalı. JSON şeması: {"giris":"...","alternatifler":[{"ad":"...","yontem":"listeden","not":"nasıl uygulanır, kısıt/risk"}],"kriterler":[{"ad":"...","agirlik":"20"}],"karar":{"oneri":"taslak karar","gerekce":"kök nedenle ilişkilendirilmiş gerekçe"},"sorular":["..."]}'
  };
  return T[step];
}

/** Rehber JSON yanıtını "Forma ekle" kartlarına çevirir. */
export function coachItems(step, j, principles) {
  const items = [];
  const arr = x => (Array.isArray(x) ? x : []);
  const PR = principles || [];
  if (step === 1) {
    if (j.ifade) items.push({ kind: 'statement', tag: 'PROBLEM İFADESİ', title: 'Netleştirilmiş ifade önerisi', sub: String(j.ifade), payload: String(j.ifade), btn: 'İfadeyi kullan', added: false });
    const B = j.boyutlar || {};
    if (B.yer) items.push({ kind: 'dim', tag: 'BOYUT', title: 'Yer / Birim', sub: String(B.yer), payload: { key: 'geo', value: String(B.yer) }, added: false });
    if (B.zaman) items.push({ kind: 'dim', tag: 'BOYUT', title: 'Zaman aralığı / Dönem', sub: String(B.zaman), payload: { key: 'time', value: String(B.zaman) }, added: false });
    if (B.kirilim) items.push({ kind: 'dim', tag: 'BOYUT', title: 'Segment / Kırılım', sub: String(B.kirilim), payload: { key: 'brand', value: String(B.kirilim) }, added: false });
    if (j.kpi && (j.kpi.ad || j.kpi.hedef || j.kpi.gerceklesen)) items.push({ kind: 'kpi', tag: 'KPI', title: String(j.kpi.ad || 'KPI önerisi'), sub: 'Hedef: ' + (j.kpi.hedef || '—') + ' · Gerçekleşen: ' + (j.kpi.gerceklesen || '—'), payload: { kpiName: String(j.kpi.ad || ''), target: String(j.kpi.hedef || ''), actual: String(j.kpi.gerceklesen || '') }, added: false });
  }
  if (step === 2) arr(j.driverlar).forEach(d => items.push({ kind: 'driver', tag: 'DRIVER', title: d.ad || '', sub: d.not || '', payload: { name: d.ad || '', note: d.not || '' }, added: false }));
  if (step === 3) {
    arr(j.altBilesenler).forEach(d => items.push({ kind: 'da', tag: 'ALT BİLEŞEN', title: (d.driver ? d.driver + ' → ' : '') + (d.altBilesen || ''), sub: d.tespit || '', payload: { driver: d.driver || '', component: d.altBilesen || '', issue: d.tespit || '' }, added: false }));
    arr(j.sipoc).forEach(r => items.push({ kind: 'sipoc', tag: 'SIPOC', title: r.p || 'Süreç adımı', sub: [r.s, r.i, r.o, r.c].filter(Boolean).join(' · '), payload: { s: r.s || '', i: r.i || '', p: r.p || '', o: r.o || '', c: r.c || '' }, added: false }));
  }
  if (step === 4) arr(j.bulgular).forEach(d => items.push({ kind: 'finding', tag: 'BULGU HİPOTEZİ', title: d.bulgu || '', sub: 'Doğrulama kaynağı: ' + (d.kanitKaynagi || '—'), payload: { text: d.bulgu || '', evidence: d.kanitKaynagi || '' }, added: false }));
  if (step === 5) {
    if (Array.isArray(j.besNeden) && j.besNeden.length) items.push({ kind: 'whys', tag: '5 NEDEN', title: '5 Neden zinciri taslağı (boş alanları doldurur)', sub: j.besNeden.map((w, i) => (i + 1) + ') ' + w).join('  '), payload: j.besNeden.slice(0, 5).map(String), added: false });
    if (j.balikKilcigi && typeof j.balikKilcigi === 'object') items.push({ kind: 'fishbone', tag: 'KILÇIK', title: 'Balık kılçığı taslağı (boş kategorileri doldurur)', sub: Object.values(j.balikKilcigi).filter(Boolean).slice(0, 3).join(' · '), payload: j.balikKilcigi, added: false });
    arr(j.kokNedenler).forEach(d => items.push({ kind: 'rootcause', tag: 'KÖK NEDEN ADAYI', title: d.kokNeden || '', sub: d.yetkinlik ? 'Yetkinlik gelişim alanı: ' + d.yetkinlik : '', payload: { text: d.kokNeden || '', principles: arr(d.prensipler).map(x => (parseInt(x, 10) || 0) - 1).filter(x => x >= 0 && x < PR.length), competency: d.yetkinlik || '' }, added: false }));
  }
  if (step === 6) {
    arr(j.alternatifler).forEach(d => items.push({ kind: 'alt', tag: 'ALTERNATİF', title: d.ad || '', sub: (d.yontem ? d.yontem + ' · ' : '') + (d.not || ''), payload: { name: d.ad || '', method: d.yontem || '', note: d.not || '' }, added: false }));
    arr(j.kriterler).forEach(d => items.push({ kind: 'criterion', tag: 'KRİTER', title: (d.ad || '') + ' (%' + (d.agirlik || '?') + ')', sub: '', payload: { name: d.ad || '', weight: String(d.agirlik || '') }, added: false }));
    if (j.karar && (j.karar.oneri || j.karar.gerekce)) items.push({ kind: 'decision', tag: 'KARAR TASLAĞI', title: j.karar.oneri || '', sub: j.karar.gerekce ? 'Gerekçe: ' + j.karar.gerekce : '', payload: { choice: j.karar.oneri || '', rationale: j.karar.gerekce || '' }, added: false });
  }
  return items;
}

export const COACH_JSON_RULE = '\n\nŞimdi koçluk sohbeti DEĞİL, yapılandırılmış öneri üretiyorsun. SADECE geçerli tek bir JSON nesnesi döndür; öncesinde ve sonrasında başka hiçbir metin yazma. JSON dizgelerinin İÇİNDE çift tırnak kullanma (vurgu gerekiyorsa tek tırnak kullan); dizge içinde satır sonu yerine \\n yaz. Tüm metinler Türkçe ve kullanıcının problem alanına özgü olsun; genel geçer kalıplar yazma. Öneriler kesin doğrular değil, kullanıcının işi yapanlarla ve veriyle DOĞRULAMASI gereken hipotezlerdir; bu dili kullan.\n\n';

export const COACH_TEACH_TASK = 'Görev (ÖĞRETEN modu): Bu adımda hazır öneri/taslak ÜRETME. Kullanıcının bu adımı kendisinin doğru doldurması için, problemine özgü 6-8 yönlendirici Sokratik soru yaz. JSON şeması: {"giris":"bu adımda nasıl düşünmesi gerektiğine dair 2-3 cümlelik yöntem açıklaması","sorular":["...", "..."]}';

export const COACH_FAST_SUFFIX = ' Ek kural (HIZLANDIRAN modu): önerileri olabildiğince eksiksiz, spesifik ve doğrudan forma eklenebilir yaz; aday sayısını üst sınırda tut.';

/** Analiz derinliği ayarının rehber görevine eklediği kural. */
export const COACH_DEPTH_SUFFIX = {
  genis: ' Ek kural (GENİŞ derinlik): şemadaki aday sayısını üst sınırında üret ve her adayın "not"/gerekçe alanını boş bırakma.',
  derin: ' Ek kural (DERİN derinlik): şemadaki aday sayısını üst sınırının üzerine çıkarabilirsin (en fazla 8 madde). Her adayın gerekçesinde hangi veriyle doğrulanacağını da yaz ve "sorular" alanında en az 5 sınama sorusu üret. Şemayı yine de birebir koru.'
};

export const ACTION_COACH_TASK = '\n\nŞimdi koçluk sohbeti DEĞİL, uygulanabilir bir aksiyon planı üretiyorsun. Kullanıcının kararına, kök nedenlerine ve bulgularına dayanarak 4-7 somut aksiyon öner. Her aksiyon tek cümlelik, ölçülebilir çıktısı olan bir iş olsun; sorumlu için isim değil ROL öner; süre için kısa tahmin ver. Etki ve eforu 1-5 arası puanla (5 = en yüksek). SADECE geçerli tek bir JSON nesnesi döndür: {"aksiyonlar":[{"aksiyon":"...","sorumluRol":"...","sure":"örn. 2 hafta","etki":4,"efor":2,"gerekce":"hangi kök nedeni/bulguyu adresliyor (KN1, B2 gibi atıflarla)"}]}';

export const DECISION_COACH_TASK = '\n\nŞimdi koçluk sohbeti DEĞİL, karar önerisi üretiyorsun. Kullanıcının alternatiflerini, karar kriterlerini ve matris puanlarını değerlendirerek en doğru kararı öner. Gerekçe, kararın hangi kök nedeni nasıl giderdiğini ve kısıt/riskleri nasıl karşıladığını açıklamalı; alternatiflere (A1, A2…) atıf yap. Matris puanları varsa dikkate al ama körü körüne izleme; akıl yürüt. SADECE geçerli tek bir JSON nesnesi döndür: {"oneri":"önerilen karar","gerekce":"kök nedenle ilişkilendirilmiş gerekçe"}';

export const PREMORTEM_TASK = '\n\nŞimdi koçluk sohbeti DEĞİL, PRE-MORTEM çalıştırıyorsun (Gary Klein yöntemi). Zaman: kararın uygulanmasından 6 ay sonrası. Varsayım kesin: karar UYGULANDI ve BAŞARISIZ OLDU — bunu tartışma, geriye bakıp nedenini anlat. Kullanıcının kararına, aksiyon planına, kök nedenlerine ve geçici önlemine dayanarak 4-5 BİRBİRİNDEN FARKLI başarısızlık senaryosu üret: en az biri insan/benimseme kaynaklı, en az biri sistem/süreç kaynaklı, en az biri dış etken kaynaklı olsun; bariz olanı değil, planlamada konuşulmayanı yakala. Her senaryo için: kısa başlık, geçmiş zaman kipinde 2-3 cümlelik somut hikâye (sanki olmuş gibi), bu gidişatı aylar önce ele verecek ölçülebilir erken uyarı sinyali ve bugünden alınabilecek tek bir önleyici tedbir (rol + iş olarak yazılmış, aksiyon planına eklenebilir netlikte). SADECE geçerli tek bir JSON nesnesi döndür: {"giris":"1-2 cümlelik çerçeve","senaryolar":[{"baslik":"...","hikaye":"geçmiş zaman anlatısı","erkenSinyal":"ölçülebilir sinyal","onleyiciTedbir":"tek somut tedbir"}]}';

export const AUDIT_TASK = '\n\nŞimdi TUTARLILIK DENETÇİSİsin. Vakayı uçtan uca denetle ve zincir kopukluklarını raporla: (1) problem ifadesi ↔ driver\'lar ↔ bulgular ↔ kök nedenler ↔ karar ↔ aksiyonlar zinciri nerede kopuyor; (2) hiçbir kök nedene bağlanmayan bulgular, hiçbir bulguya dayanmayan kök nedenler; (3) 5 Neden zincirindeki mantık sıçramaları; (4) karar kök nedenleri gerçekten adresliyor mu, belirti tedavisi var mı; (5) aksiyonlar kararı ve kök nedenleri kapsıyor mu, sahipsiz kök neden kaldı mı. Atıflarla yaz (B1, KN2, A1...). Kısa, maddeli, düz metin Türkçe rapor; markdown yıldızı kullanma. Ciddi sorun yoksa bunu açıkça söyle. Sadece denetim raporunu döndür.';

export const BIAS_SCAN_TASK = '\n\nŞimdi koçluk sohbeti DEĞİL, DÜŞÜNME YANILGISI TARAMASI yapıyorsun. Kullanıcının tüm çalışma verisini (problem ifadesi, driver\'lar, bulgular, 5 Neden zinciri, kök nedenler, alternatifler, karar gerekçesi, karar öncesi düşünme kontrolü) okuyup hangi bilişsel yanılgıların izini taşıdığını tespit et. Katalog: '
  + BIASES.map(b => b.ad + ' (' + b.belirti + ' · panzehir: ' + b.panzehir + ')').join(' | ')
  + '.\n\nKurallar: (1) Her tespiti kullanıcının KENDİ metninden kısa bir alıntıya dayandır — genel geçer uyarı yazma. (2) Kanıt bulamadığın yanılgıyı listeleme; hiç bulamazsan boş dizi döndür ve özet alanında bunu söyle. (3) Her tespit için panzehir yöntemi ve kullanıcının kendine sorması gereken tek bir keskin soru ver. (4) En fazla 5 tespit, en ciddiden başlayarak. SADECE geçerli tek bir JSON nesnesi döndür: {"ozet":"1-2 cümle genel değerlendirme","yanilgilar":[{"yanilgi":"katalogdaki ad","kanit":"kullanıcının metninden alıntı ya da hangi girdide görüldüğü","risk":"bu yanılgı bu vakada neye mal olur","yontem":"panzehir düşünme yöntemi","soru":"tek keskin soru","ciddiyet":"yüksek|orta|düşük"}]}';

export const REPORT_SUMMARY_TASK = '\n\nŞimdi koçluk sohbeti DEĞİL, rapor için yönetici özeti yazıyorsun. Kullanıcının tüm çalışma verisine dayanarak 4-6 cümlelik, düz metin (madde işareti ve başlık YOK) bir yönetici özeti yaz: problem ve KPI farkı, en kritik bulgular, kök neden(ler) ve alınan karar. Veriye dayalı, kısa ve karar odaklı ol; sadece özet metnini döndür, başka hiçbir şey yazma.';

/**
 * Serbest sohbet (Yöntem Danışmanı) sistem talimatı — vaka verisine bağlı değildir.
 * Adım asistanından farkı: kullanıcının girdilerini değerlendirmez; metodolojiyi,
 * yöntemleri ve uygulamanın nasıl kullanılacağını ÖĞRETİR.
 */
export function buildHelpSystem(step, stepTitles) {
  const titles = (stepTitles || []).map((t, i) => (i + 1) + '. ' + t).join(' · ');
  return 'Sen ProblemLab uygulamasının Yöntem Danışmanısın. ProblemLab, bir iş problemini 8 adımlı bir metodolojiyle uçtan uca çözdüren bir çalışma aracıdır. Adımlar: ' + titles + '.\n\n'
    + 'Görevin: kullanıcının problem çözme metodolojisi, yöntemler ve uygulamanın kullanımı hakkındaki serbest sorularını cevaplamak. Tipik sorular: "İş sürücüsü haritalama nedir, nasıl yapılır?", "Bulgu ile kök neden farkı nedir?", "Karar matrisini nasıl puanlarım?", "VAR/YOK belirtimi ne işe yarar?".\n\n'
    + 'Bildiğin yöntemler ve uygulamadaki yerleri:\n'
    + '- İş sürücüsü haritalama (business driver mapping, Adım 2): KPI\'ı oluşturan ana etkenleri MECE (birbirini dışlayan, bütünü kapsayan) şekilde listelemek; işi yapanlarla ve Gemba\'da (işin yapıldığı yerde) doğrulamak.\n'
    + '- İş sürücüsü analizi (Adım 3): etkisi en büyük sürücüyü alt bileşenlerine ayırıp hangi bileşende sapma olduğunu süreç metrikleriyle bulmak; SIPOC (tedarikçi-girdi-süreç-çıktı-müşteri) ile girdi kalitesini kontrol etmek.\n'
    + '- Bulgu doğrulama (Adım 4): ölçülmüş, kanıtlı sapmalar; Pareto ile katkıların KPI sapmasına oranı, açıklanamayan pay ayrı kategori.\n'
    + '- Kök neden analizi (Adım 5): 5 Neden (dallanabilir), balık kılçığı (Ishikawa), VAR/YOK (Kepner-Tregoe) testi; kök neden doğrulama durumları (hipotez → veriyle destekleniyor → test edildi → doğrulandı). Kök neden önce kendi süreç/ölçüm/yetkinlik boşluklarında aranır.\n'
    + '- Karar (Adım 6): farklı düşünme yöntemleriyle alternatif üretme; ağırlıklı karar matrisi (ağırlıklar toplam %100, kriter yönü ve 1/3/5 puan tanımları), hassasiyet kontrolü; geçici önlem (containment) ile kalıcı çözüm ayrımı; pre-mortem (Klein).\n'
    + '- İzleme (Adım 7): aksiyonların gerçek tarihlerle takibi, KPI trendinin hedefe kapanması, retrospektif (PDCA).\n'
    + '- Rapor (Adım 8): yönetici özeti, izlenebilirlik tablosu (bulgu→kök neden→aksiyon→KPI), analiz güven seviyesi.\n\n'
    + 'Uygulama bilgisi: veriler yalnızca kullanıcının tarayıcısında saklanır; Ayarlar\'dan JSON yedeği alınır; rehber (YZ) önerileri "doğrulanmadı" rozetiyle gelir ve kullanıcı doğrulamalıdır; paylaşım linki veriyi linkin içinde taşır.\n\n'
    + 'Kullanıcı şu anda Adım ' + step + ' üzerinde — cevabını gerekiyorsa bu adıma bağla ama her soruya cevap ver.\n\n'
    + 'Kurallar: Türkçe, net ve öğretici yaz; kavramı önce 1-2 cümleyle tanımla, sonra nasıl yapılacağını adım adım anlat, kısa bir örnekle bitir. Kullanıcının kendi çalışma verisini GÖRMÜYORSUN — "girdilerinizi şuradan değerlendirebilirim" deme; girdi değerlendirmesi için adım sayfasındaki YZ Asistan\'a yönlendir. Sayı uydurma; örnek verirsen "(örnek)" diye işaretle.';
}

/** Karar matrisi puan önerisi görevi — Adım 6'daki matris için. */
export const MATRIX_COACH_TASK = '\n\nŞimdi koçluk sohbeti DEĞİL, KARAR MATRİSİ PUAN ÖNERİSİ üretiyorsun. Kullanıcının alternatiflerini (alternatifler) ve karar kriterlerini (kararKriterleri) kullanarak HER alternatif × HER kriter hücresi için 1-5 arası TAM SAYI puan öner. Kurallar: (1) Puan 5 her zaman EN İYİ seçeneğe verilir — kriterin yönü \'dusuk\' ise (maliyet, risk gibi) en düşük maliyetli/riskli alternatif 5 alır. (2) Kriterin d1/d3/d5 puan tanımları varsa puanı BU tanımlara göre ver. (3) Gerekçeyi kullanıcının kendi verisine (bulgular, kök nedenler, alternatif notları) dayandır; veri yoksa gerekçede \'varsayım — doğrulayın\' de. Sayı uydurma. (4) Her hücre için 1 kısa cümlelik gerekçe yaz. (5) Aynı kriterde iki alternatif gerçekten eşitse aynı puanı vermekten çekinme. Dizgelerin içinde çift tırnak kullanma (vurgu gerekiyorsa tek tırnak). SADECE geçerli tek bir JSON nesnesi döndür (alternatif ve kriter numaraları 1\'den başlar): {"giris":"1-2 cümlelik özet: hangi alternatif neden öne çıkıyor","puanlar":[{"alternatif":1,"kriter":1,"puan":4,"gerekce":"kısa gerekçe"}],"sorular":["puanları doğrulamak için sorulacak 2-3 soru"]}';

/** Geçici önlem (containment, 8D-D3) önerisi görevi — Adım 6'daki kart için. */
export const CONTAINMENT_COACH_TASK = '\n\nŞimdi koçluk sohbeti DEĞİL, GEÇİCİ ÖNLEM (containment, 8D metodolojisinin D3 disiplini) adayları üretiyorsun. Kullanıcının problemi, bulguları ve varsa kök neden adaylarına bakarak, kalıcı çözüm gelene kadar müşteriyi/süreci BUGÜN koruyacak 2-3 FARKLI geçici önlem öner. Kurallar: her önlem 24-48 saat içinde devreye alınabilir olmalı; kök nedeni çözme iddiası taşımamalı (bu kararın işi); geri alınabilir olmalı ve net bir kaldırma koşuluna bağlanmalı; önlemin kimin sırtına yük bindirdiğini (maliyetini) dürüstçe söyle. Farklı türlerde düşün: müşteriyi koruyan, riskli girdiyi karantinaya alan, ek kontrol/manuel doğrulama ekleyen. Kullanıcının verisinde olmayan sayı/yer uydurma; bilinmeyeni "[doldurun: …]" ile bırak. Dizgelerin içinde çift tırnak kullanma (vurgu gerekiyorsa tek tırnak). SADECE geçerli tek bir JSON nesnesi döndür: {"giris":"1-2 cümlelik yönlendirme","onlemler":[{"onlem":"somut geçici önlem","sorumluRol":"rol","kaldirmaKosulu":"hangi koşulda kaldırılır","dikkat":"bedeli kim öder / riski ne"}],"sorular":["önlemi seçmeden önce cevaplanması gereken 2-3 soru"]}';

/** VAR/YOK (Kepner-Tregoe) belirtim taslağı görevi — Adım 1'deki kart için. */
export const SPEC_COACH_TASK = '\n\nŞimdi koçluk sohbeti DEĞİL, VAR/YOK BELİRTİMİ (Kepner-Tregoe IS / IS-NOT) taslağı üretiyorsun. Kullanıcının problem ifadesi, boyutları (yer/zaman/kırılım), KPI verisi ve varsa bulgularından yola çıkarak dört boyutta belirtim doldur: Nerede, Ne zaman, Kırılımda, Büyüklük. Her boyutta VAR tarafı problemin GÖRÜLDÜĞÜ yeri/zamanı/kırılımı/büyüklüğü; YOK tarafı ise görülebileceği hâlde GÖRÜLMEDİĞİ karşılaştırma noktasını yazar — YOK tarafı kök neden adaylarını test eden en değerli bilgidir. Kullanıcının verisinde karşılığı OLMAYAN yer, tarih ya da sayı uydurma: bilinmeyenleri "[doldurun: hangi bölgede görülmüyor?]" biçiminde yer tutucuyla bırak. Ayrıca "değişiklik" alanına, sapmanın başladığı dönemde ne değişmiş olabileceğine dair kullanıcının verisine dayanan (yoksa yer tutuculu) bir taslak yaz. Dizgelerin içinde çift tırnak kullanma (vurgu gerekiyorsa tek tırnak). SADECE geçerli tek bir JSON nesnesi döndür: {"giris":"1-2 cümlelik yönlendirme","belirtim":{"nerede":{"v":"...","y":"..."},"zaman":{"v":"...","y":"..."},"kirilim":{"v":"...","y":"..."},"buyukluk":{"v":"...","y":"..."}},"degisiklik":"...","sorular":["YOK tarafını doğrulamak için kullanıcının paydaşlarına sorması gereken 3-4 soru"]}';

export const REF_SUMMARY_SYSTEM ='Kullanıcının problem çözme çalışmasında referans olarak kullanılacak içeriği özetliyorsun. Sayısal verileri, adları ve önemli tespitleri koruyarak 10-15 cümlelik Türkçe bir özet yaz; sadece özet metnini döndür.';
