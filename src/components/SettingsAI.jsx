// Ayarlar penceresinin YZ sekmeleri: "Rehber" (rehberin davranışı) ve
// "Yapay zekâ bağlantısı" (sağlayıcı, anahtar, model; teknik üretim ayarları
// katlanır "Gelişmiş" bölümünde).

import React from 'react';
import { useStore } from '../lib/store.jsx';

const PROVIDERS = t => [
  { key: 'auto', label: t('Otomatik', 'Automatic'), hint: t('Site sahibinin sunucudaki anahtarını kullanır (anahtar tarayıcıya inmez)', "Uses the site owner's server-side key (the key never reaches your browser)") },
  { key: 'minimax', label: 'MiniMax', hint: t('MiniMax hesabınızın API anahtarıyla', "With your MiniMax account's API key") },
  { key: 'openai', label: 'OpenAI', hint: t('OpenAI (veya uyumlu) API anahtarıyla', 'With an OpenAI (or compatible) API key') },
  { key: 'anthropic', label: 'Anthropic', hint: t('Claude API anahtarıyla', 'With a Claude API key') },
  { key: 'ozel', label: t('Özel / Yerel', 'Custom / Local'), hint: t('OpenAI uyumlu herhangi bir uç nokta: OpenRouter, kurumsal ağ geçidi, Ollama, LM Studio', 'Any OpenAI-compatible endpoint: OpenRouter, corporate gateway, Ollama, LM Studio') }
];

// "Özel" sağlayıcı için hazır profiller — alanları tek tıkla doldurur.
const CUSTOM_PRESETS = t => [
  {
    label: 'OpenRouter', hint: t('Tek hesapla Claude, GPT, Gemini ve açık modeller (kredi bazlı)', 'Claude, GPT, Gemini and open models with a single account (credit-based)'),
    fields: { baseUrl: 'https://openrouter.ai/api/v1/chat/completions', model: 'anthropic/claude-sonnet-4.5', headerName: 'Authorization', headerPrefix: 'Bearer ', extraHeaders: 'HTTP-Referer: ' + (typeof location !== 'undefined' ? location.origin : '') + '\nX-Title: Problem Cozme Akisi' }
  },
  {
    label: t('Ollama (yerel)', 'Ollama (local)'), hint: t('Bilgisayarınızda çalışan model — anahtar gerekmez', 'A model running on your computer — no key needed'),
    fields: { baseUrl: 'http://localhost:11434/v1/chat/completions', model: 'llama3.1', apiKey: '', headerName: '', headerPrefix: 'Bearer ', extraHeaders: '' }
  },
  {
    label: t('LM Studio (yerel)', 'LM Studio (local)'), hint: t('LM Studio yerel sunucusu (varsayılan port 1234)', 'LM Studio local server (default port 1234)'),
    fields: { baseUrl: 'http://localhost:1234/v1/chat/completions', model: '', apiKey: '', headerName: '', headerPrefix: 'Bearer ', extraHeaders: '' }
  },
  {
    label: 'Azure OpenAI', hint: t('api-key başlığı ile; adres dağıtımınıza özeldir', 'With the api-key header; the URL is specific to your deployment'),
    fields: { baseUrl: 'https://KAYNAK.openai.azure.com/openai/deployments/DAGITIM/chat/completions?api-version=2024-08-01-preview', model: '', headerName: 'api-key', headerPrefix: '', extraHeaders: '' }
  }
];

const LEVELS = t => [
  { key: 'ogreten', label: t('Öğreten', 'Teaching'), hint: t('Öneri yok; sadece doğru sorular', 'No suggestions; only the right questions') },
  { key: 'dengeli', label: t('Dengeli', 'Balanced'), hint: t('Hipotez önerir + doğrulama soruları', 'Suggests hypotheses + verification questions') },
  { key: 'hizli', label: t('Hızlandıran', 'Accelerating'), hint: t('Eksiksiz taslaklar üretir', 'Produces complete drafts') }
];

// Düşünme (reasoning) modu — MiniMax M3 ailesinin "thinking" parametresine karşılık gelir.
const THINKS = t => [
  { key: 'disabled', label: t('Kapalı', 'Off'), hint: t('En hızlı ve en ucuz; kısa görevler için', 'Fastest and cheapest; for short tasks') },
  { key: 'adaptive', label: t('Açık (uyarlanabilir)', 'On (adaptive)'), hint: t('Model gerektiğinde akıl yürütür', 'The model reasons when needed') }
];

// Bütçe göstergesinde kullanılan çarpanlar (store.jsx ile aynı).
const DEPTH_LABEL = { standart: 1, genis: 1.6, derin: 2.5 };
const THINK_LABEL = { disabled: 1, adaptive: 1.8 };

const DEPTHS = t => [
  { key: 'standart', label: t('Standart', 'Standard'), hint: t('Hızlı; şemadaki aday sayısı kadar', 'Fast; as many candidates as the schema allows') },
  { key: 'genis', label: t('Geniş', 'Broad'), hint: t('Aday sayısı üst sınırda + gerekçeli', 'Candidate count at the upper limit + with rationale') },
  { key: 'derin', label: t('Derin', 'Deep'), hint: t('Gerekçe, kanıt kaynağı, sınama soruları', 'Rationale, evidence sources, test questions') }
];

const TEMPS = t => [
  { v: 0.2, label: t('Tutarlı', 'Consistent'), hint: t('Aynı girdiye benzer, disiplinli çıktı', 'Similar, disciplined output for the same input') },
  { v: 0.6, label: t('Dengeli', 'Balanced'), hint: t('Önerilen varsayılan', 'Recommended default') },
  { v: 0.9, label: t('Yaratıcı', 'Creative'), hint: t('Daha çeşitli, sıra dışı alternatifler', 'More varied, unconventional alternatives') }
];

const STYLE_ROWS = t => [
  { label: t('Yanıt uzunluğu', 'Response length'), key: 'length', opts: [{ k: 'kisa', l: t('Kısa madde', 'Short bullets') }, { k: 'detayli', l: t('Detaylı açıklamalı', 'Detailed explanations') }] },
  { label: t('Ton', 'Tone'), key: 'tone', opts: [{ k: 'resmi', l: t('Resmi', 'Formal') }, { k: 'samimi', l: t('Samimi koç', 'Friendly coach') }] },
  { label: t('Eleştirellik', 'Criticality'), key: 'critic', opts: [{ k: 'nazik', l: t('Nazik geri bildirim', 'Gentle feedback') }, { k: 'sert', l: t('Sert denetçi', 'Tough auditor') }] }
];

/** Açıklamalı seçenek kartları (tek seçim). */
function Cards({ items, value, onPick, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="pcx-set-cards">
      {items.map(it => (
        <button key={it.key} type="button" role="radio" aria-checked={value === it.key} onClick={() => onPick(it.key)}>
          <b>{it.label}</b><span>{it.hint}</span>
        </button>
      ))}
    </div>
  );
}

/** Kısa etiketli bölümlü düğme (tek seçim). */
function Seg({ items, isOn, onPick, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="pcx-set-seg">
      {items.map(it => (
        <button key={it.k} type="button" role="radio" title={it.hint || ''} aria-checked={isOn(it)} onClick={() => onPick(it)}>{it.l}</button>
      ))}
    </div>
  );
}

function Field({ label, note, children }) {
  return (
    <label className="pcx-set-field">
      <span>{label}{note ? <em> {note}</em> : null}</span>
      {children}
    </label>
  );
}

export function CoachSettings() {
  const { state, upd, t } = useStore();
  const A = state.aiSettings;
  const set = (k, v) => upd(n => { n.aiSettings[k] = v; });
  const auto = A.auto !== false;
  return (
    <>
      <section className="pcx-set-sec">
        <h3>{t('Rehberlik seviyesi', 'Coaching level')}</h3>
        <p className="pcx-set-help">{t('Rehberin ne kadar yol göstereceğini seçin.', 'Choose how much the coach leads.')}</p>
        <Cards label={t('Rehberlik seviyesi', 'Coaching level')} items={LEVELS(t)} value={A.level || 'dengeli'} onPick={k => set('level', k)} />
      </section>

      <section className="pcx-set-sec pcx-set-inline">
        <div>
          <h3>{t('Adıma girince otomatik öneri', 'Automatic suggestions on entering a step')}</h3>
          <p className="pcx-set-help">{t('Boş bir adıma girdiğinizde rehber kendiliğinden öneri hazırlar.', 'When you enter an empty step, the coach prepares suggestions on its own.')}</p>
        </div>
        <button type="button" role="switch" aria-checked={auto} className="pcx-set-switch" onClick={() => set('auto', !auto)}>
          <span aria-hidden="true" />{auto ? t('Açık', 'On') : t('Kapalı', 'Off')}
        </button>
      </section>

      <section className="pcx-set-sec">
        <h3>{t('Alan / sektör bağlamı', 'Domain / industry context')}</h3>
        <p className="pcx-set-help">{t('Rehber ve asistan örneklerini bu bağlamdan verir.', 'The coach and assistant draw their examples from this context.')}</p>
        <input className="pcx-field pcx-set-input" value={A.context || ''} onChange={e => set('context', e.target.value)} placeholder={t('Örn. perakende lojistiği, SaaS ürün ekibi, banka çağrı merkezi', 'e.g. retail logistics, SaaS product team, bank call center')} />
      </section>

      <section className="pcx-set-sec">
        <h3>{t('Yanıt üslubu', 'Response style')}</h3>
        <div className="pcx-set-rows">
          {STYLE_ROWS(t).map(row => (
            <div key={row.key} className="pcx-set-row">
              <span>{row.label}</span>
              <Seg label={row.label} items={row.opts} isOn={o => (A[row.key] || row.opts[0].k) === o.k} onPick={o => set(row.key, o.k)} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function ConnectionSettings() {
  const { state, upd, t, lang } = useStore();
  const A = state.aiSettings;
  const set = (k, v) => upd(n => { n.aiSettings[k] = v; });
  const prov = A.provider || 'auto';
  const locale = lang === 'en' ? 'en-US' : 'tr-TR';
  const tokenBudget = Math.min(Math.round(2600 * (DEPTH_LABEL[A.depth || 'standart'] || 1) * (THINK_LABEL[A.thinking || 'adaptive'] || 1)), 60000).toLocaleString(locale);

  let warn = '';
  if (prov !== 'auto' && prov !== 'ozel' && !(A.apiKey || '').trim()) warn = t('Bu sağlayıcı kendi API anahtarınızla çalışır; anahtar girilmeden rehber ve asistan hata verir.', 'This provider works with your own API key; without a key the coach and assistant will fail.');
  else if (prov === 'ozel' && !(A.baseUrl || '').trim()) warn = t('Özel sağlayıcı için bir API adresi (OpenAI uyumlu sohbet uç noktası) girmeniz gerekir.', 'For the custom provider you must enter an API URL (an OpenAI-compatible chat endpoint).');

  return (
    <>
      <section className="pcx-set-sec">
        <h3>{t('Sağlayıcı', 'Provider')}</h3>
        <p className="pcx-set-help">{prov === 'auto' ? t('Otomatik modda hiçbir şey girmeniz gerekmez; uygulama hazır çalışır.', 'In Automatic mode you don’t need to enter anything; the app works out of the box.') : PROVIDERS(t).find(p => p.key === prov).hint}</p>
        <Seg label={t('Sağlayıcı', 'Provider')} items={PROVIDERS(t).map(p => ({ k: p.key, l: p.label, hint: p.hint }))} isOn={o => prov === o.k} onPick={o => set('provider', o.k)} />
        {warn ? (
          <div className="pcx-set-warn">
            <span>{warn}</span>
            <button type="button" className="pcx-set-btn" onClick={() => set('provider', 'auto')}>{t("Otomatik'e dön", 'Back to Automatic')}</button>
          </div>
        ) : null}
      </section>

      {prov !== 'auto' ? (
        <section className="pcx-set-sec">
          <div className="pcx-set-grid2">
            <Field label={t('API anahtarı', 'API key')}>
              <input className="pcx-field-sm pcx-set-input" type="password" value={A.apiKey || ''} onChange={e => set('apiKey', e.target.value)} placeholder="sk-…" />
            </Field>
            <Field label="Model" note={t('boşsa varsayılan', 'default if empty')}>
              <input className="pcx-field-sm pcx-set-input" value={A.model || ''} onChange={e => set('model', e.target.value)} placeholder={t('Örn. MiniMax-M3', 'e.g. MiniMax-M3')} />
            </Field>
          </div>
          <Field label={t('API adresi', 'API URL')} note={prov === 'ozel' ? t('zorunlu, OpenAI uyumlu sohbet uç noktası', 'required, OpenAI-compatible chat endpoint') : t('isteğe bağlı', 'optional')}>
            <input className="pcx-field-sm pcx-set-input" value={A.baseUrl || ''} onChange={e => set('baseUrl', e.target.value)} placeholder="https://…/v1/chat/completions" />
          </Field>
          {prov === 'ozel' ? (
            <div className="pcx-set-box">
              <span className="pcx-set-label">{t('Hazır profiller', 'Preset profiles')}</span>
              <div className="pcx-set-chips">
                {CUSTOM_PRESETS(t).map(p => (
                  <button key={p.label} type="button" title={p.hint} onClick={() => upd(n => { Object.assign(n.aiSettings, p.fields); })}>{p.label}</button>
                ))}
              </div>
              <div className="pcx-set-grid2">
                <Field label={t('Kimlik başlığı adı', 'Auth header name')}>
                  <input className="pcx-field-sm pcx-set-input" value={A.headerName || ''} onChange={e => set('headerName', e.target.value)} placeholder="Authorization" />
                </Field>
                <Field label={t('Ön ek', 'Prefix')} note={t("Azure'da boş", 'empty for Azure')}>
                  <input className="pcx-field-sm pcx-set-input" value={A.headerPrefix === undefined ? 'Bearer ' : A.headerPrefix} onChange={e => set('headerPrefix', e.target.value)} placeholder="Bearer " />
                </Field>
              </div>
              <Field label={t('Ek başlıklar', 'Extra headers')} note={t('her satıra "Ad: değer"', 'one "Name: value" per line')}>
                <textarea className="pcx-field-sm pcx-set-input" rows={2} value={A.extraHeaders || ''} onChange={e => set('extraHeaders', e.target.value)} placeholder={t('HTTP-Referer: https://siteniz\nX-Title: Problem Cozme Akisi', 'HTTP-Referer: https://your-site\nX-Title: Problem Cozme Akisi')} />
              </Field>
              <p className="pcx-set-help">
                {t('İstek tarayıcınızdan doğrudan bu adrese gider; uç noktanın CORS izni vermesi gerekir. Ollama için sunucuyu ', 'Requests go directly from your browser to this URL; the endpoint must allow CORS. For Ollama, start the server with ')}<code>OLLAMA_ORIGINS=*</code>{t(' ile başlatın. Abonelik hesapları (Claude Pro/Max, ChatGPT Plus) üçüncü taraf uygulamalara açılmaz.', '. Subscription accounts (Claude Pro/Max, ChatGPT Plus) are not open to third-party apps.')}
              </p>
            </div>
          ) : null}
          <p className="pcx-set-help">{t('Anahtarınız yalnızca bu tarayıcıda saklanır ve doğrudan seçtiğiniz sağlayıcıya gönderilir.', 'Your key is stored only in this browser and sent directly to the provider you choose.')}</p>
        </section>
      ) : null}

      <details className="pcx-set-adv">
        <summary>{t('Gelişmiş üretim ayarları', 'Advanced generation settings')}<span>{t('Düşünme, derinlik, yaratıcılık', 'Reasoning, depth, creativity')}</span></summary>
        <div className="pcx-set-adv-body">
          {prov === 'auto' ? (
            <Field label="Model" note={t('boşsa sunucu varsayılanı', 'server default if empty')}>
              <input className="pcx-field-sm pcx-set-input" value={A.model || ''} onChange={e => set('model', e.target.value)} placeholder={t('Örn. MiniMax-M3', 'e.g. MiniMax-M3')} />
            </Field>
          ) : null}
          <div>
            <span className="pcx-set-label">{t('Düşünme eforu', 'Reasoning effort')}</span>
            <Cards label={t('Düşünme eforu', 'Reasoning effort')} items={THINKS(t)} value={A.thinking || 'adaptive'} onPick={k => set('thinking', k)} />
            <p className="pcx-set-help">{t('Yalnızca düşünen modellerde etkilidir; düşünme tokenları da bütçeden harcanır.', 'Only effective on reasoning models; thinking tokens are also spent from the budget.')}</p>
          </div>
          <div>
            <span className="pcx-set-label">{t('Analiz derinliği', 'Analysis depth')}</span>
            <Cards label={t('Analiz derinliği', 'Analysis depth')} items={DEPTHS(t)} value={A.depth || 'standart'} onPick={k => set('depth', k)} />
            <p className="pcx-set-help">{t('Tipik bir rehber çağrısı için token bütçesi: ', 'Token budget for a typical coach call: ')}<strong>{tokenBudget}</strong>{t(' (üst sınır 60.000).', ' (cap 60,000).')}</p>
          </div>
          <div className="pcx-set-row">
            <span>{t('Yaratıcılık', 'Creativity')}</span>
            <Seg label={t('Yaratıcılık', 'Creativity')} items={TEMPS(t).map(x => ({ k: String(x.v), l: x.label, hint: x.hint, v: x.v }))} isOn={o => Math.abs((parseFloat(A.temperature) || 0) - o.v) < 0.06} onPick={o => set('temperature', o.v)} />
          </div>
          <div className="pcx-set-grid2">
            <Field label="temperature" note={t('boş bırakılabilir', 'can be left empty')}>
              <input className="pcx-field-sm pcx-set-input" type="number" step="0.05" min="0" max="2" value={A.temperature === '' || A.temperature === undefined ? '' : A.temperature} onChange={e => set('temperature', e.target.value)} />
            </Field>
            <Field label="top_p" note={t('boşsa sağlayıcı varsayılanı', 'provider default if empty')}>
              <input className="pcx-field-sm pcx-set-input" type="number" step="0.05" min="0.01" max="1" value={A.topP === '' || A.topP === undefined ? '' : A.topP} onChange={e => set('topP', e.target.value)} />
            </Field>
          </div>
          <p className="pcx-set-help">{t("Yapılandırılmış çıktı (rehber kartları, rapor) için 0,3–0,7 arası önerilir; 1'in üzerinde model şemadan sapabilir.", 'For structured output (coach cards, report), 0.3–0.7 is recommended; above 1 the model may deviate from the schema.')}</p>
        </div>
      </details>
    </>
  );
}
