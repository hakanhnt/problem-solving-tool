// YZ katmanı: tek giriş noktası complete({system, messages, max_tokens}) -> metin
// ve tüm sistem talimatı / görev şeması üreticileri.

import { AGENT_TITLES } from './defaults.js';

/**
 * Sağlayıcı katmanı.
 * - auto      : /.netlify/functions/ai köprüsü (anahtar sunucuda, tarayıcıya inmez)
 * - minimax   : OpenAI uyumlu chat/completions
 * - openai    : OpenAI (veya uyumlu) chat/completions
 * - anthropic : Anthropic Messages API (tarayıcıdan doğrudan erişim başlığıyla)
 */
const BRIDGE_HINT = ' — Ayarlar > YZ Sağlayıcı bölümünden kendi API anahtarınızı girebilirsiniz';

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
async function streamBridge(opts) {
  let r;
  try {
    r = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ system: opts.system, messages: opts.messages, max_tokens: opts.max_tokens || 2000 })
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
    const dp = ch.delta && ch.delta.content;
    if (dp) { sawDelta = true; deltaText += dp; return; }
    const mp = ch.message && ch.message.content;
    if (mp) wholeText = mp;
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).replace(/\r$/, '');
      buf = buf.slice(nl + 1);
      if (line.startsWith('data:')) consume(line.slice(5));
    }
  }
  if (buf.startsWith('data:')) consume(buf.slice(5));

  const text = sawDelta ? deltaText : wholeText;
  if (!text.trim()) throw new Error(providerError || ('Sağlayıcıdan boş yanıt geldi' + BRIDGE_HINT));
  return text;
}

/** Akışsız köprü (/.netlify/functions/ai) — edge ucu yoksa yedek yol. */
async function plainBridge(opts) {
  const r = await fetch('/.netlify/functions/ai', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ system: opts.system, messages: opts.messages, max_tokens: opts.max_tokens || 2000 })
  });
  let j = null;
  try { j = await r.json(); } catch (e) { /* gövde JSON değil */ }
  if (!r.ok || !j || !j.text) {
    throw new Error((j && j.error) || ('Demo YZ hizmetine ulaşılamadı (HTTP ' + r.status + ')' + BRIDGE_HINT));
  }
  return j.text;
}

export async function complete(settings, opts) {
  const S = settings || {};
  const prov = S.provider || 'auto';

  if (prov === 'auto') {
    try {
      return await streamBridge(opts);
    } catch (e) {
      if (!(e && e.bridgeMissing)) throw e;
      return await plainBridge(opts);
    }
  }

  const key = (S.apiKey || '').trim();
  if (!key) throw new Error('API anahtarı tanımlı değil — Ayarlar > YZ Sağlayıcı bölümünden anahtarınızı girin');

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
        messages: opts.messages
      })
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || ('HTTP ' + r.status));
    return (j.content || []).map(b => b.text || '').join('');
  }

  const base = (S.baseUrl || '').trim() || (prov === 'openai' ? 'https://api.openai.com/v1/chat/completions' : 'https://api.minimax.io/v1/text/chatcompletion_v2');
  const model = (S.model || '').trim() || (prov === 'openai' ? 'gpt-4o-mini' : 'MiniMax-Text-01');
  const r = await fetch(base, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
    body: JSON.stringify({
      model,
      max_tokens: opts.max_tokens || 2000,
      messages: [{ role: 'system', content: opts.system }].concat(opts.messages)
    })
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && (j.error.message || j.error.type)) || ('HTTP ' + r.status));
  const text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  if (!text) throw new Error((j.base_resp && j.base_resp.status_msg) || 'Sağlayıcıdan boş yanıt geldi');
  return text;
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
  const clean = String(reply).replace(/```(json)?/gi, '');
  const a = clean.indexOf('{'), b = clean.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('Yanıtta JSON bulunamadı');
  try {
    return JSON.parse(clean.slice(a, b + 1));
  } catch (e) {
    const first = firstBalancedObject(clean, a);
    if (first) return JSON.parse(first);
    throw e;
  }
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
    "5 Neden zincirinin mantıksal tutarlılığı, balık kılçığı kategorileri; kök nedenin dışarıda değil önce kullanıcının kendi yetkinliklerinde ve şu kurum prensiplerindeki gelişim alanlarında aranması: " + PR.map((p, i) => (i + 1) + '. ' + p).join(' | '),
    "Alternatiflerin farklı düşünme yöntemleriyle (ilk ilkeler, eleştirel, yanal, tasarım, sistem, algoritmik, ikinci düzey) üretilmesi; karar kriterlerinin kısıt ve riskleri yansıtması; matris puanlarının tutarlılığı; kararın ve gerekçenin kök nedeni gerçekten gidermesi.",
    "Aksiyonların ilerleme durumu, KPI trendinin hedefe kapanıp kapanmadığı, retrospektifin dürüstlüğü; işe yaramayan karşı önlemin erken tespiti ve işe yarayanın standartlaştırılması.",
    "Çalışmanın bütününün tutarlılığı; raporun ve yönetici özetinin kısa, veriye dayalı ve karar odaklı olması."
  ];
  const data = {
    problemTanimi: c.problem, driverlar: c.drivers, driverAnalizi: c.driverAnalysis, sipoc: c.sipoc,
    bulgular: c.findings, besNeden: c.whys, balikKilcigi: c.fishbone,
    kokNedenler: (c.rootCauses || []).map(r => ({ kokNeden: r.text, iliskiliPrensipler: (r.principles || []).map(pi => (pi + 1) + '. ' + (PR[pi] || '')), yetkinlikGelisimAlani: r.competency })),
    alternatifler: c.alternatives, kararKriterleri: c.criteria, matrisPuanlari: c.scores, karar: c.decision,
    aksiyonPlani: c.actions || [],
    izleme: { kpiOlcumleri: c.tracking || [], retrospektif: c.retro || {} }
  };
  const S = aiSettings || {};
  let extra = '';
  if ((S.context || '').trim()) extra += '\n\nKullanıcının alan/sektör bağlamı: ' + S.context.trim() + ' — örneklerini ve terminolojini bu bağlama uyarla.';
  if (S.level === 'ogreten') extra += '\n\nRehberlik seviyesi: ÖĞRETEN — hazır cevap, taslak ve çözüm VERME. Sokratik yöntemle doğru soruları sordurarak kullanıcının cevabı kendisinin bulmasını sağla; yalnızca yöntem açıkla ve soru sor.';
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

export const COACH_JSON_RULE = '\n\nŞimdi koçluk sohbeti DEĞİL, yapılandırılmış öneri üretiyorsun. SADECE geçerli tek bir JSON nesnesi döndür; öncesinde ve sonrasında başka hiçbir metin yazma. Tüm metinler Türkçe ve kullanıcının problem alanına özgü olsun; genel geçer kalıplar yazma. Öneriler kesin doğrular değil, kullanıcının işi yapanlarla ve veriyle DOĞRULAMASI gereken hipotezlerdir; bu dili kullan.\n\n';

export const COACH_TEACH_TASK = 'Görev (ÖĞRETEN modu): Bu adımda hazır öneri/taslak ÜRETME. Kullanıcının bu adımı kendisinin doğru doldurması için, problemine özgü 6-8 yönlendirici Sokratik soru yaz. JSON şeması: {"giris":"bu adımda nasıl düşünmesi gerektiğine dair 2-3 cümlelik yöntem açıklaması","sorular":["...", "..."]}';

export const COACH_FAST_SUFFIX = ' Ek kural (HIZLANDIRAN modu): önerileri olabildiğince eksiksiz, spesifik ve doğrudan forma eklenebilir yaz; aday sayısını üst sınırda tut.';

export const ACTION_COACH_TASK = '\n\nŞimdi koçluk sohbeti DEĞİL, uygulanabilir bir aksiyon planı üretiyorsun. Kullanıcının kararına, kök nedenlerine ve bulgularına dayanarak 4-7 somut aksiyon öner. Her aksiyon tek cümlelik, ölçülebilir çıktısı olan bir iş olsun; sorumlu için isim değil ROL öner; süre için kısa tahmin ver. Etki ve eforu 1-5 arası puanla (5 = en yüksek). SADECE geçerli tek bir JSON nesnesi döndür: {"aksiyonlar":[{"aksiyon":"...","sorumluRol":"...","sure":"örn. 2 hafta","etki":4,"efor":2,"gerekce":"hangi kök nedeni/bulguyu adresliyor (KN1, B2 gibi atıflarla)"}]}';

export const DECISION_COACH_TASK = '\n\nŞimdi koçluk sohbeti DEĞİL, karar önerisi üretiyorsun. Kullanıcının alternatiflerini, karar kriterlerini ve matris puanlarını değerlendirerek en doğru kararı öner. Gerekçe, kararın hangi kök nedeni nasıl giderdiğini ve kısıt/riskleri nasıl karşıladığını açıklamalı; alternatiflere (A1, A2…) atıf yap. Matris puanları varsa dikkate al ama körü körüne izleme; akıl yürüt. SADECE geçerli tek bir JSON nesnesi döndür: {"oneri":"önerilen karar","gerekce":"kök nedenle ilişkilendirilmiş gerekçe"}';

export const AUDIT_TASK = '\n\nŞimdi TUTARLILIK DENETÇİSİsin. Vakayı uçtan uca denetle ve zincir kopukluklarını raporla: (1) problem ifadesi ↔ driver\'lar ↔ bulgular ↔ kök nedenler ↔ karar ↔ aksiyonlar zinciri nerede kopuyor; (2) hiçbir kök nedene bağlanmayan bulgular, hiçbir bulguya dayanmayan kök nedenler; (3) 5 Neden zincirindeki mantık sıçramaları; (4) karar kök nedenleri gerçekten adresliyor mu, belirti tedavisi var mı; (5) aksiyonlar kararı ve kök nedenleri kapsıyor mu, sahipsiz kök neden kaldı mı. Atıflarla yaz (B1, KN2, A1...). Kısa, maddeli, düz metin Türkçe rapor; markdown yıldızı kullanma. Ciddi sorun yoksa bunu açıkça söyle. Sadece denetim raporunu döndür.';

export const REPORT_SUMMARY_TASK = '\n\nŞimdi koçluk sohbeti DEĞİL, rapor için yönetici özeti yazıyorsun. Kullanıcının tüm çalışma verisine dayanarak 4-6 cümlelik, düz metin (madde işareti ve başlık YOK) bir yönetici özeti yaz: problem ve KPI farkı, en kritik bulgular, kök neden(ler) ve alınan karar. Veriye dayalı, kısa ve karar odaklı ol; sadece özet metnini döndür, başka hiçbir şey yazma.';

export const REF_SUMMARY_SYSTEM = 'Kullanıcının problem çözme çalışmasında referans olarak kullanılacak içeriği özetliyorsun. Sayısal verileri, adları ve önemli tespitleri koruyarak 10-15 cümlelik Türkçe bir özet yaz; sadece özet metnini döndür.';
