import React from 'react';
import { useStore } from '../lib/store.jsx';
import { defaultPrinciples } from '../lib/defaults.js';
import { HButton } from '../ui/primitives.jsx';

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
  { key: 'adaptive', label: t('Açık (uyarlanabilir)', 'On (adaptive)'), hint: t('Model gerektiğinde akıl yürütür — M3\'ün desteklediği en yüksek kademe', 'The model reasons when needed — the highest tier M3 supports') }
];

// Bütçe göstergesinde kullanılan çarpanlar (store.jsx ile aynı).
const DEPTH_LABEL = { standart: 1, genis: 1.6, derin: 2.5 };
const THINK_LABEL = { disabled: 1, adaptive: 1.8 };

const DEPTHS = t => [
  { key: 'standart', label: t('Standart', 'Standard'), hint: t('Hızlı; şemadaki aday sayısı kadar', 'Fast; as many candidates as the schema allows') },
  { key: 'genis', label: t('Geniş', 'Broad'), hint: t('Aday sayısı üst sınırda + gerekçeli', 'Candidate count at the upper limit + with rationale') },
  { key: 'derin', label: t('Derin', 'Deep'), hint: t('En kapsamlı: gerekçe, kanıt kaynağı, sınama soruları', 'Most comprehensive: rationale, evidence sources, test questions') }
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

export default function SettingsModal() {
  const { state, principles, upd, t, lang } = useStore();
  if (!state.showSettings) return null;
  const A = state.aiSettings;
  const close = () => upd(n => { n.showSettings = false; });
  const locale = lang === 'en' ? 'en-US' : 'tr-TR';

  // Tipik bir rehber çağrısı (2.600 token) için etkin bütçe — kullanıcı maliyeti görsün.
  const tokenBudget = Math.min(
    Math.round(2600 * (DEPTH_LABEL[A.depth || 'standart'] || 1) * (THINK_LABEL[A.thinking || 'adaptive'] || 1)),
    60000
  ).toLocaleString(locale);

  const exportData = () => {
    const now = new Date();
    const data = JSON.stringify({ app: 'pcx', version: 1, exportedAt: now.toISOString(), principles: state.principles, cases: state.cases }, null, 2);
    const b = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'problem-cozme-calismalari-' + now.toISOString().slice(0, 10) + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    upd(n => { n.lastBackup = now.toISOString(); });
  };

  const importData = () => {
    const el = document.createElement('input');
    el.type = 'file'; el.accept = '.json,application/json';
    el.onchange = () => {
      const f = el.files && el.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const j = JSON.parse(r.result);
          if (!j || !j.cases || typeof j.cases !== 'object') throw new Error('bad');
          const imported = [];
          upd(n => {
            Object.keys(j.cases).forEach(k => {
              if (k === 'ornek') return;
              const cc = j.cases[k];
              if (!cc || !cc.problem) return;
              const key = n.cases[k] ? 'c' + Date.now() + '_' + Math.floor(Math.random() * 1e4) : k;
              if (n.cases[k]) cc.name = (cc.name || 'Çalışma') + ' (içe aktarılan)';
              n.cases[key] = cc;
              imported.push(cc.name || key);
            });
            if (Array.isArray(j.principles) && j.principles.length && confirm(t('Dosyadaki prensip listesi de içe aktarılsın mı? (Mevcut prensip listenizin yerine geçer)', 'Import the principle list from the file too? (It will replace your current principle list)'))) n.principles = j.principles;
          });
          alert(imported.length ? t('İçe aktarılan çalışmalar: ', 'Imported cases: ') + imported.join(', ') : t('Dosyada içe aktarılacak çalışma bulunamadı.', 'No cases to import were found in the file.'));
        } catch (e) {
          alert(t('Dosya okunamadı — geçerli bir yedek JSON dosyası değil.', 'Could not read the file — it is not a valid backup JSON file.'));
        }
      };
      r.readAsText(f);
    };
    el.click();
  };

  const seg = (active, label, hint, onClick, block) => (
    <button
      key={label}
      onClick={onClick}
      title={hint}
      style={{
        flex: block ? 1 : 'none', minWidth: block ? 130 : undefined,
        padding: block ? '8px 10px' : '7px 12px',
        borderRadius: block ? 7 : 20,
        border: '1px solid ' + (active ? 'var(--pri)' : 'var(--field-border)'),
        background: active ? 'var(--pri)' : 'var(--surface)',
        color: active ? 'var(--on-pri)' : 'var(--ink-3)',
        cursor: 'pointer', textAlign: block ? 'left' : 'center',
        font: block ? undefined : '600 11.5px Helvetica,Arial,sans-serif'
      }}
    >
      {block ? (
        <>
          <div style={{ font: '700 12px Helvetica,Arial,sans-serif', color: active ? 'var(--on-pri)' : 'var(--ink-3)' }}>{label}</div>
          <div style={{ font: '10.5px/1.35 Helvetica,Arial,sans-serif', color: active ? 'var(--on-pri)' : 'var(--ink-3)', opacity: .75, marginTop: 2 }}>{hint}</div>
        </>
      ) : label}
    </button>
  );

  return (
    <div data-noprint="1" style={{ position: 'fixed', inset: 0, background: 'rgba(38,36,31,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 12, width: 620, maxWidth: '94vw', maxHeight: '84vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 18px 50px rgba(38,36,31,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--line-3)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ font: '700 15px Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{t('Kurum Prensipleri', 'Organization Principles')}</div>
            <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 2 }}>{t('Bu liste kök neden eşleştirmede, rehber önerilerinde ve raporda kullanılır. Kendi kurumunuzun prensiplerini/değerlerini yazabilirsiniz.', "This list is used in root cause mapping, coach suggestions and the report. You can write your own organization's principles/values.")}</div>
          </div>
          <HButton
            onClick={close}
            style={{ flex: 'none', width: 28, height: 28, border: 'none', borderRadius: 6, background: 'transparent', color: 'var(--muted-2)', font: '700 16px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--surface-4)', color: 'var(--ink-3)' }}
          >×</HButton>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px' }}>{t('YZ SAĞLAYICI', 'AI PROVIDER')}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PROVIDERS(t).map(p => {
              const act = (A.provider || 'auto') === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => upd(n => { n.aiSettings.provider = p.key; })}
                  title={p.hint}
                  style={{
                    flex: 1, minWidth: 96, padding: '8px 10px', borderRadius: 7,
                    border: '1px solid ' + (act ? 'var(--pri)' : 'var(--field-border)'),
                    background: act ? 'var(--pri)' : 'var(--surface)',
                    cursor: 'pointer', textAlign: 'center',
                    font: '700 12px Helvetica,Arial,sans-serif', color: act ? 'var(--on-pri)' : 'var(--ink-3)'
                  }}
                >{p.label}</button>
              );
            })}
          </div>

          {(() => {
            const prov = A.provider || 'auto';
            const noKey = !(A.apiKey || '').trim();
            const noUrl = !(A.baseUrl || '').trim();
            let warn = '';
            if (prov !== 'auto' && prov !== 'ozel' && noKey) warn = t('Bu sağlayıcı kendi API anahtarınızla çalışır; anahtar girilmeden rehber ve asistan hata verir. Anahtarınız yoksa "Otomatik" moda dönün.', 'This provider works with your own API key; without a key the coach and assistant will fail. If you don\'t have a key, switch back to "Automatic" mode.');
            else if (prov === 'ozel' && noUrl) warn = t('Özel sağlayıcı için aşağıya bir API adresi (OpenAI uyumlu sohbet uç noktası) girmeniz gerekir.', 'For the custom provider you must enter an API URL below (an OpenAI-compatible chat endpoint).');
            if (!warn) return null;
            return (
              <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 8, padding: '9px 12px' }}>
                <div style={{ flex: 'none', width: 16, height: 16, borderRadius: '50%', background: 'var(--warn-ink)', color: 'var(--on-pri)', font: '700 11px/16px Helvetica,Arial,sans-serif', textAlign: 'center' }}>!</div>
                <div style={{ flex: 1, font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink-2)' }}>{warn}</div>
                <HButton
                  onClick={() => upd(n => { n.aiSettings.provider = 'auto'; })}
                  style={{ flex: 'none', padding: '5px 10px', border: '1px solid var(--pri)', borderRadius: 6, background: 'var(--surface)', color: 'var(--pri)', font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                  hover={{ background: 'var(--pri-soft)' }}
                >{t("Otomatik'e dön", 'Back to Automatic')}</HButton>
              </div>
            );
          })()}

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 8 }}>
            <div>
              <label style={{ display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>{t('API anahtarı', 'API key')} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{t('— Otomatik modda gerekmez', '— not needed in Automatic mode')}</span></label>
              <input
                className="pcx-field-sm" type="password" value={A.apiKey || ''}
                onChange={e => upd(n => { n.aiSettings.apiKey = e.target.value; })}
                placeholder="sk-…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>Model <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{t('— boşsa sunucu varsayılanı', '— server default if empty')}</span></label>
              <input
                className="pcx-field-sm" value={A.model || ''}
                onChange={e => upd(n => { n.aiSettings.model = e.target.value; })}
                placeholder={t('Örn. MiniMax-M3', 'e.g. MiniMax-M3')}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>{t('API adresi', 'API URL')} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{A.provider === 'ozel' ? t('— zorunlu: OpenAI uyumlu sohbet uç noktası', '— required: OpenAI-compatible chat endpoint') : t('(isteğe bağlı — OpenAI uyumlu farklı bir uç nokta için)', '(optional — for a different OpenAI-compatible endpoint)')}</span></label>
            <input
              className="pcx-field-sm" value={A.baseUrl || ''}
              onChange={e => upd(n => { n.aiSettings.baseUrl = e.target.value; })}
              placeholder="https://…/v1/chat/completions"
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
            />
          </div>
          {A.provider === 'ozel' ? (
            <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 8, margin: '2px 0 4px' }}>
              <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px' }}>{t('HAZIR PROFİLLER', 'PRESET PROFILES')}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CUSTOM_PRESETS(t).map(p => (
                  <HButton
                    key={p.label} title={p.hint}
                    onClick={() => upd(n => { Object.assign(n.aiSettings, p.fields); })}
                    style={{ padding: '7px 12px', border: '1px solid var(--pri-border)', borderRadius: 20, background: 'var(--surface)', color: 'var(--pri)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                    hover={{ background: 'var(--pri-soft-3)' }}
                  >{p.label}</HButton>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>{t('Kimlik başlığı adı', 'Auth header name')}</label>
                  <input
                    className="pcx-field-sm" value={A.headerName || ''}
                    onChange={e => upd(n => { n.aiSettings.headerName = e.target.value; })}
                    placeholder="Authorization"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>{t('Ön ek', 'Prefix')} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{t("(Azure'da boş)", '(empty for Azure)')}</span></label>
                  <input
                    className="pcx-field-sm" value={A.headerPrefix === undefined ? 'Bearer ' : A.headerPrefix}
                    onChange={e => upd(n => { n.aiSettings.headerPrefix = e.target.value; })}
                    placeholder="Bearer "
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>{t('Ek başlıklar', 'Extra headers')} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{t('— her satıra "Ad: değer"', '— one "Name: value" per line')}</span></label>
                <textarea
                  className="pcx-field-sm" value={A.extraHeaders || ''}
                  onChange={e => upd(n => { n.aiSettings.extraHeaders = e.target.value; })}
                  placeholder={t('HTTP-Referer: https://siteniz\nX-Title: Problem Cozme Akisi', 'HTTP-Referer: https://your-site\nX-Title: Problem Cozme Akisi')}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none', resize: 'vertical', minHeight: 52 }}
                />
              </div>

              <div style={{ font: '11px/1.55 Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)' }}>
                {t('İstek tarayıcınızdan doğrudan bu adrese gider; uç noktanın ', 'Requests go directly from your browser to this URL; the endpoint must allow ')}<strong>CORS</strong>{t(' izni vermesi gerekir. Ollama için sunucuyu ', '. For Ollama, start the server with ')}<code>OLLAMA_ORIGINS=*</code>{t(' ile başlatın. Abonelik hesapları (Claude Pro/Max, ChatGPT Plus) üçüncü taraf uygulamalara açılmaz — kredi/anahtar tabanlı bir servis ya da kurumunuzun ağ geçidini kullanın.', ". Subscription accounts (Claude Pro/Max, ChatGPT Plus) are not open to third-party apps — use a credit/key-based service or your organization's gateway.")}
              </div>
            </div>
          ) : null}

          <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 4px' }}>{t('Anahtarınız yalnızca bu tarayıcıda saklanır ve doğrudan seçtiğiniz sağlayıcıya gönderilir; hiçbir sunucuda tutulmaz. Model alanı "Otomatik" modda da geçerlidir: boş bırakırsanız sunucudaki varsayılan model kullanılır.', 'Your key is stored only in this browser and sent directly to the provider you choose; it is never kept on any server. The Model field also applies in "Automatic" mode: if left empty, the default model on the server is used.')}</div>

          <div style={{ borderTop: '1px solid var(--line-3)', margin: '2px 0 4px' }} />
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px' }}>{t('MODEL ÜRETİM AYARLARI', 'MODEL GENERATION SETTINGS')}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 4px' }}>
            <label style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{t('Düşünme eforu', 'Reasoning effort')} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{t('(reasoning) — modelin cevaptan önce ne kadar akıl yürüteceği', '— how much the model reasons before answering')}</span></label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {THINKS(t).map(d => seg((A.thinking || 'adaptive') === d.key, d.label, d.hint, () => upd(n => { n.aiSettings.thinking = d.key; }), true))}
            </div>
            <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
              {t('Yalnızca düşünen modellerde (MiniMax M3 ve benzerleri) etkilidir; desteklemeyen modeller bu ayarı yok sayar. Düşünme tokenları da token bütçenizden harcanır — "Yüksek" seçimi maliyeti ve süreyi belirgin artırır.', 'Only effective on reasoning models (MiniMax M3 and similar); models that don\'t support it ignore this setting. Thinking tokens are also spent from your token budget — a "High" selection noticeably increases cost and time.')}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 4px' }}>
            <label style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{t('Analiz derinliği', 'Analysis depth')} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{t('— çıktı uzunluğu bütçesi', '— output length budget')}</span></label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DEPTHS(t).map(d => seg((A.depth || 'standart') === d.key, d.label, d.hint, () => upd(n => { n.aiSettings.depth = d.key; }), true))}
            </div>
            <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
              {t('Etkin token bütçesi: ', 'Effective token budget: ')}<strong>{tokenBudget}</strong>{t(' (derinlik ×', ' (depth ×')}{DEPTH_LABEL[A.depth || 'standart']}{t(' · düşünme ×', ' · thinking ×')}{THINK_LABEL[A.thinking || 'adaptive']}{t(', üst sınır 60.000).', ', cap 60,000).')}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '0 0 4px' }}>
            <label style={{ flex: 1, font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{t('Yaratıcılık', 'Creativity')} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(temperature)</span></label>
            <div style={{ display: 'flex', gap: 6 }}>
              {TEMPS(t).map(tp => seg(Math.abs((parseFloat(A.temperature) || 0) - tp.v) < 0.06, tp.label, tp.hint, () => upd(n => { n.aiSettings.temperature = tp.v; }), false))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '0 0 4px' }}>
            <label style={{ flex: 1, font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{t('İnce ayar', 'Fine-tuning')} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{t('— boş bırakılabilir', '— can be left empty')}</span></label>
            <input
              className="pcx-field-sm" type="number" step="0.05" min="0" max="2"
              value={A.temperature === '' || A.temperature === undefined ? '' : A.temperature}
              onChange={e => upd(n => { n.aiSettings.temperature = e.target.value; })}
              placeholder="temperature"
              title={t('Sıcaklık: 0 = en tutarlı, 1+ = en yaratıcı', 'Temperature: 0 = most consistent, 1+ = most creative')}
              style={{ flex: 'none', width: 116, boxSizing: 'border-box', padding: '7px 10px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
            />
            <input
              className="pcx-field-sm" type="number" step="0.05" min="0.01" max="1"
              value={A.topP === '' || A.topP === undefined ? '' : A.topP}
              onChange={e => upd(n => { n.aiSettings.topP = e.target.value; })}
              placeholder="top_p"
              title={t('top_p: sözcük çeşitliliği. Boşsa sağlayıcı varsayılanı kullanılır.', 'top_p: word diversity. If empty, the provider default is used.')}
              style={{ flex: 'none', width: 116, boxSizing: 'border-box', padding: '7px 10px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
            />
          </div>
          <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 4px' }}>{t("Yapılandırılmış çıktı (rehber kartları, rapor) için 0,3–0,7 arası önerilir; 1'in üzerinde model şemadan sapabilir. Bu ayarlar hem \"Otomatik\" modda hem de kendi anahtarınızla geçerlidir.", 'For structured output (coach cards, report), 0.3–0.7 is recommended; above 1 the model may deviate from the schema. These settings apply both in "Automatic" mode and with your own key.')}</div>

          <div style={{ borderTop: '1px solid var(--line-3)', margin: '2px 0 4px' }} />
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px' }}>{t('YZ REHBER AYARLARI', 'AI COACH SETTINGS')}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 4px' }}>
            <label style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{t('Rehberlik seviyesi', 'Coaching level')}</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {LEVELS(t).map(l => seg((A.level || 'dengeli') === l.key, l.label, l.hint, () => upd(n => { n.aiSettings.level = l.key; }), true))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '0 0 4px' }}>
            <label style={{ flex: 1, font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{t('Adıma girince otomatik öneri hazırla', 'Prepare suggestions automatically on entering a step')}</label>
            <HButton
              onClick={() => upd(n => { n.aiSettings.auto = !(n.aiSettings.auto !== false); })}
              style={{ flex: 'none', padding: '7px 14px', border: '1px solid var(--pri)', borderRadius: 20, background: 'var(--pri-soft)', color: 'var(--pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={{ background: 'var(--pri-soft-hover)' }}
            >{A.auto !== false ? t('Açık', 'On') : t('Kapalı', 'Off')}</HButton>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 6px' }}>
            <label style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{t('Alan / sektör bağlamı', 'Domain / industry context')} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{t('— tüm YZ yanıtları bu bağlama göre örnek verir', '— all AI responses use examples from this context')}</span></label>
            <input
              className="pcx-field" value={A.context || ''}
              onChange={e => upd(n => { n.aiSettings.context = e.target.value; })}
              placeholder={t('Örn. perakende lojistiği, SaaS ürün ekibi, banka çağrı merkezi…', 'e.g. retail logistics, SaaS product team, bank call center…')}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
            />
          </div>

          {STYLE_ROWS(t).map(row => (
            <div key={row.key} style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '0 0 2px' }}>
              <label style={{ flex: 1, font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{row.label}</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {row.opts.map(o => seg((A[row.key] || row.opts[0].k) === o.k, o.l, '', () => upd(n => { n.aiSettings[row.key] = o.k; }), false))}
              </div>
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--line-3)', margin: '2px 0 4px' }} />
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px' }}>{t('KURUM PRENSİPLERİ', 'ORGANIZATION PRINCIPLES')}</div>
          {principles.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 'none', width: 26, height: 26, borderRadius: '50%', background: 'var(--line-2)', color: 'var(--ink-4)', font: '700 11px/26px Helvetica,Arial,sans-serif', textAlign: 'center' }}>{i + 1}</div>
              <input
                className="pcx-field" value={p}
                onChange={e => upd(n => { n.principles[i] = e.target.value; })}
                placeholder={t('Prensip metni', 'Principle text')}
                style={{ flex: 1, boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
              />
              <HButton
                title={t('Prensibi sil', 'Delete principle')}
                onClick={() => {
                  if (!confirm(t((i + 1) + '. prensip silinecek; kök nedenlerdeki eşleştirmeler güncellenecek. Emin misiniz?', 'Principle ' + (i + 1) + ' will be deleted; mappings in root causes will be updated. Are you sure?'))) return;
                  upd(n => {
                    n.principles.splice(i, 1);
                    Object.values(n.cases).forEach(cc => (cc.rootCauses || []).forEach(rc => {
                      rc.principles = (rc.principles || []).filter(pi => pi !== i).map(pi => (pi > i ? pi - 1 : pi));
                    }));
                  });
                }}
                style={{ flex: 'none', width: 26, height: 26, border: 'none', borderRadius: 5, background: 'transparent', color: 'var(--muted-2)', font: '700 14px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                hover={{ background: 'var(--alert-soft)', color: 'var(--danger)' }}
              >×</HButton>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line-3)', background: 'var(--surface-2)' }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px', margin: '0 0 8px' }}>{t('VERİ VE YEDEKLEME', 'DATA AND BACKUP')}</div>
          <div style={{ background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 8, padding: '10px 12px', font: '12px/1.6 Helvetica,Arial,sans-serif', color: 'var(--warn-ink-3)', margin: '0 0 10px' }}>
            <strong>{t('Çalışmalarınız yalnızca bu tarayıcıda saklanır.', 'Your cases are stored only in this browser.')}</strong>{' '}
            {t('Hiçbir sunucuya gönderilmez ve otomatik yedeği yoktur. Tarayıcı verilerini temizlerseniz, gizli sekme kullanırsanız ya da başka bir cihaza geçerseniz çalışmalarınıza erişemezsiniz — düzenli olarak JSON yedeği alın.', 'Nothing is sent to any server and there is no automatic backup. If you clear browser data, use a private tab or switch to another device, you will lose access to your cases — take a JSON backup regularly.')}
          </div>
          {state.saveError ? (
            <div role="alert" style={{ background: 'var(--alert-soft)', border: '1px solid var(--alert-border)', borderRadius: 8, padding: '10px 12px', font: '12px/1.6 Helvetica,Arial,sans-serif', color: 'var(--alert)', margin: '0 0 10px' }}>
              <strong>{t('⚠ Kaydedilemedi:', '⚠ Could not save:')}</strong> {state.saveError}
            </div>
          ) : null}
          {(() => {
            const fmt = iso => { try { return new Date(iso).toLocaleString(locale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return '—'; } };
            const days = iso => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
            const stale = !state.lastBackup || days(state.lastBackup) >= 7;
            return (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '0 0 10px', font: '12px/1.6 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>
                <div><strong>{t('Son kayıt:', 'Last saved:')}</strong> {state.lastSaved ? fmt(state.lastSaved) : t('henüz kaydedilmedi', 'not saved yet')}</div>
                <div style={{ color: stale ? 'var(--warn-ink)' : 'var(--ink-3)' }}>
                  <strong>{t('Son yedek:', 'Last backup:')}</strong> {state.lastBackup ? fmt(state.lastBackup) : t('hiç alınmadı', 'never taken')}
                  {stale ? t(' — yedek almanız önerilir', ' — taking a backup is recommended') : ''}
                </div>
              </div>
            );
          })()}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '0 20px 12px', background: 'var(--surface-2)' }}>
          <div style={{ flex: 1, minWidth: 220, font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t('Tüm çalışmalarınızı JSON olarak indirin ya da bir yedeği / meslektaşınızın dosyasını içe aktarın.', "Download all your cases as JSON, or import a backup / a colleague's file.")}</div>
          <HButton onClick={exportData} style={{ flex: 'none', padding: '8px 13px', border: '1px solid var(--pri)', borderRadius: 7, background: 'var(--surface)', color: 'var(--pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: 'var(--pri-soft)' }}>{t('↓ Dışa aktar', '↓ Export')}</HButton>
          <HButton onClick={importData} style={{ flex: 'none', padding: '8px 13px', border: '1px solid var(--pri)', borderRadius: 7, background: 'var(--surface)', color: 'var(--pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: 'var(--pri-soft)' }}>{t('↑ İçe aktar', '↑ Import')}</HButton>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--line-3)' }}>
          <HButton
            onClick={() => upd(n => { n.principles.push(''); })}
            style={{ padding: '9px 14px', border: '1px dashed var(--dash-border)', borderRadius: 8, background: 'transparent', color: 'var(--ink-3)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--surface-4)' }}
          >{t('+ Prensip ekle', '+ Add principle')}</HButton>
          <HButton
            onClick={() => { if (confirm(t('Prensip listesi varsayılan 20 kurum prensibine döndürülecek. Emin misiniz?', 'The principle list will be reset to the default 20 organization principles. Are you sure?'))) upd(n => { n.principles = defaultPrinciples(); }); }}
            style={{ padding: '9px 14px', border: '1px solid var(--field-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--surface-4)' }}
          >{t('Varsayılanlara dön', 'Reset to defaults')}</HButton>
          <HButton
            onClick={close}
            style={{ marginLeft: 'auto', padding: '9px 18px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--pri-hover)' }}
          >{t('Kapat', 'Close')}</HButton>
        </div>
      </div>
    </div>
  );
}
