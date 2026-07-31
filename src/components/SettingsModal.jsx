import React from 'react';
import { useStore } from '../lib/store.jsx';
import { defaultPrinciples } from '../lib/defaults.js';
import { HButton } from '../ui/primitives.jsx';

const PROVIDERS = [
  { key: 'auto', label: 'Otomatik', hint: 'Site sahibinin sunucudaki anahtarını kullanır (anahtar tarayıcıya inmez)' },
  { key: 'minimax', label: 'MiniMax', hint: 'MiniMax hesabınızın API anahtarıyla' },
  { key: 'openai', label: 'OpenAI', hint: 'OpenAI (veya uyumlu) API anahtarıyla' },
  { key: 'anthropic', label: 'Anthropic', hint: 'Claude API anahtarıyla' },
  { key: 'ozel', label: 'Özel / Yerel', hint: 'OpenAI uyumlu herhangi bir uç nokta: OpenRouter, kurumsal ağ geçidi, Ollama, LM Studio' }
];

// "Özel" sağlayıcı için hazır profiller — alanları tek tıkla doldurur.
const CUSTOM_PRESETS = [
  {
    label: 'OpenRouter', hint: 'Tek hesapla Claude, GPT, Gemini ve açık modeller (kredi bazlı)',
    fields: { baseUrl: 'https://openrouter.ai/api/v1/chat/completions', model: 'anthropic/claude-sonnet-4.5', headerName: 'Authorization', headerPrefix: 'Bearer ', extraHeaders: 'HTTP-Referer: ' + (typeof location !== 'undefined' ? location.origin : '') + '\nX-Title: Problem Cozme Akisi' }
  },
  {
    label: 'Ollama (yerel)', hint: 'Bilgisayarınızda çalışan model — anahtar gerekmez',
    fields: { baseUrl: 'http://localhost:11434/v1/chat/completions', model: 'llama3.1', apiKey: '', headerName: '', headerPrefix: 'Bearer ', extraHeaders: '' }
  },
  {
    label: 'LM Studio (yerel)', hint: 'LM Studio yerel sunucusu (varsayılan port 1234)',
    fields: { baseUrl: 'http://localhost:1234/v1/chat/completions', model: '', apiKey: '', headerName: '', headerPrefix: 'Bearer ', extraHeaders: '' }
  },
  {
    label: 'Azure OpenAI', hint: 'api-key başlığı ile; adres dağıtımınıza özeldir',
    fields: { baseUrl: 'https://KAYNAK.openai.azure.com/openai/deployments/DAGITIM/chat/completions?api-version=2024-08-01-preview', model: '', headerName: 'api-key', headerPrefix: '', extraHeaders: '' }
  }
];

const LEVELS = [
  { key: 'ogreten', label: 'Öğreten', hint: 'Öneri yok; sadece doğru sorular' },
  { key: 'dengeli', label: 'Dengeli', hint: 'Hipotez önerir + doğrulama soruları' },
  { key: 'hizli', label: 'Hızlandıran', hint: 'Eksiksiz taslaklar üretir' }
];

// Düşünme (reasoning) modu — MiniMax M3 ailesinin "thinking" parametresine karşılık gelir.
const THINKS = [
  { key: 'disabled', label: 'Kapalı', hint: 'En hızlı ve en ucuz; kısa görevler için' },
  { key: 'adaptive', label: 'Açık (uyarlanabilir)', hint: 'Model gerektiğinde akıl yürütür — M3\'ün desteklediği en yüksek kademe' }
];

// Bütçe göstergesinde kullanılan çarpanlar (store.jsx ile aynı).
const DEPTH_LABEL = { standart: 1, genis: 1.6, derin: 2.5 };
const THINK_LABEL = { disabled: 1, adaptive: 1.8 };

const DEPTHS = [
  { key: 'standart', label: 'Standart', hint: 'Hızlı; şemadaki aday sayısı kadar' },
  { key: 'genis', label: 'Geniş', hint: 'Aday sayısı üst sınırda + gerekçeli' },
  { key: 'derin', label: 'Derin', hint: 'En kapsamlı: gerekçe, kanıt kaynağı, sınama soruları' }
];

const TEMPS = [
  { v: 0.2, label: 'Tutarlı', hint: 'Aynı girdiye benzer, disiplinli çıktı' },
  { v: 0.6, label: 'Dengeli', hint: 'Önerilen varsayılan' },
  { v: 0.9, label: 'Yaratıcı', hint: 'Daha çeşitli, sıra dışı alternatifler' }
];

const STYLE_ROWS = [
  { label: 'Yanıt uzunluğu', key: 'length', opts: [{ k: 'kisa', l: 'Kısa madde' }, { k: 'detayli', l: 'Detaylı açıklamalı' }] },
  { label: 'Ton', key: 'tone', opts: [{ k: 'resmi', l: 'Resmi' }, { k: 'samimi', l: 'Samimi koç' }] },
  { label: 'Eleştirellik', key: 'critic', opts: [{ k: 'nazik', l: 'Nazik geri bildirim' }, { k: 'sert', l: 'Sert denetçi' }] }
];

export default function SettingsModal() {
  const { state, principles, upd } = useStore();
  if (!state.showSettings) return null;
  const A = state.aiSettings;
  const close = () => upd(n => { n.showSettings = false; });

  // Tipik bir rehber çağrısı (2.600 token) için etkin bütçe — kullanıcı maliyeti görsün.
  const tokenBudget = Math.min(
    Math.round(2600 * (DEPTH_LABEL[A.depth || 'standart'] || 1) * (THINK_LABEL[A.thinking || 'adaptive'] || 1)),
    60000
  ).toLocaleString('tr-TR');

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
            if (Array.isArray(j.principles) && j.principles.length && confirm('Dosyadaki prensip listesi de içe aktarılsın mı? (Mevcut prensip listenizin yerine geçer)')) n.principles = j.principles;
          });
          alert(imported.length ? 'İçe aktarılan çalışmalar: ' + imported.join(', ') : 'Dosyada içe aktarılacak çalışma bulunamadı.');
        } catch (e) {
          alert('Dosya okunamadı — geçerli bir yedek JSON dosyası değil.');
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
            <div style={{ font: '700 15px Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>Kurum Prensipleri</div>
            <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 2 }}>Bu liste kök neden eşleştirmede, rehber önerilerinde ve raporda kullanılır. Kendi kurumunuzun prensiplerini/değerlerini yazabilirsiniz.</div>
          </div>
          <HButton
            onClick={close}
            style={{ flex: 'none', width: 28, height: 28, border: 'none', borderRadius: 6, background: 'transparent', color: 'var(--muted-2)', font: '700 16px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--surface-4)', color: 'var(--ink-3)' }}
          >×</HButton>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px' }}>YZ SAĞLAYICI</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PROVIDERS.map(p => {
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
            if (prov !== 'auto' && prov !== 'ozel' && noKey) warn = 'Bu sağlayıcı kendi API anahtarınızla çalışır; anahtar girilmeden rehber ve asistan hata verir. Anahtarınız yoksa "Otomatik" moda dönün.';
            else if (prov === 'ozel' && noUrl) warn = 'Özel sağlayıcı için aşağıya bir API adresi (OpenAI uyumlu sohbet uç noktası) girmeniz gerekir.';
            if (!warn) return null;
            return (
              <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 8, padding: '9px 12px' }}>
                <div style={{ flex: 'none', width: 16, height: 16, borderRadius: '50%', background: 'var(--warn-ink)', color: 'var(--on-pri)', font: '700 11px/16px Helvetica,Arial,sans-serif', textAlign: 'center' }}>!</div>
                <div style={{ flex: 1, font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink-2)' }}>{warn}</div>
                <HButton
                  onClick={() => upd(n => { n.aiSettings.provider = 'auto'; })}
                  style={{ flex: 'none', padding: '5px 10px', border: '1px solid var(--pri)', borderRadius: 6, background: 'var(--surface)', color: 'var(--pri)', font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                  hover={{ background: 'var(--pri-soft)' }}
                >Otomatik'e dön</HButton>
              </div>
            );
          })()}

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 8 }}>
            <div>
              <label style={{ display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>API anahtarı <span style={{ fontWeight: 400, color: 'var(--muted)' }}>— Otomatik modda gerekmez</span></label>
              <input
                className="pcx-field-sm" type="password" value={A.apiKey || ''}
                onChange={e => upd(n => { n.aiSettings.apiKey = e.target.value; })}
                placeholder="sk-…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>Model <span style={{ fontWeight: 400, color: 'var(--muted)' }}>— boşsa sunucu varsayılanı</span></label>
              <input
                className="pcx-field-sm" value={A.model || ''}
                onChange={e => upd(n => { n.aiSettings.model = e.target.value; })}
                placeholder="Örn. MiniMax-M3"
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>API adresi <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{A.provider === 'ozel' ? '— zorunlu: OpenAI uyumlu sohbet uç noktası' : '(isteğe bağlı — OpenAI uyumlu farklı bir uç nokta için)'}</span></label>
            <input
              className="pcx-field-sm" value={A.baseUrl || ''}
              onChange={e => upd(n => { n.aiSettings.baseUrl = e.target.value; })}
              placeholder="https://…/v1/chat/completions"
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
            />
          </div>
          {A.provider === 'ozel' ? (
            <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 8, margin: '2px 0 4px' }}>
              <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px' }}>HAZIR PROFİLLER</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CUSTOM_PRESETS.map(p => (
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
                  <label style={{ display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>Kimlik başlığı adı</label>
                  <input
                    className="pcx-field-sm" value={A.headerName || ''}
                    onChange={e => upd(n => { n.aiSettings.headerName = e.target.value; })}
                    placeholder="Authorization"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>Ön ek <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(Azure'da boş)</span></label>
                  <input
                    className="pcx-field-sm" value={A.headerPrefix === undefined ? 'Bearer ' : A.headerPrefix}
                    onChange={e => upd(n => { n.aiSettings.headerPrefix = e.target.value; })}
                    placeholder="Bearer "
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>Ek başlıklar <span style={{ fontWeight: 400, color: 'var(--muted)' }}>— her satıra "Ad: değer"</span></label>
                <textarea
                  className="pcx-field-sm" value={A.extraHeaders || ''}
                  onChange={e => upd(n => { n.aiSettings.extraHeaders = e.target.value; })}
                  placeholder={'HTTP-Referer: https://siteniz\nX-Title: Problem Cozme Akisi'}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none', resize: 'vertical', minHeight: 52 }}
                />
              </div>

              <div style={{ font: '11px/1.55 Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)' }}>
                İstek tarayıcınızdan doğrudan bu adrese gider; uç noktanın <strong>CORS</strong> izni vermesi gerekir. Ollama için sunucuyu <code>OLLAMA_ORIGINS=*</code> ile başlatın. Abonelik hesapları (Claude Pro/Max, ChatGPT Plus) üçüncü taraf uygulamalara açılmaz — kredi/anahtar tabanlı bir servis ya da kurumunuzun ağ geçidini kullanın.
              </div>
            </div>
          ) : null}

          <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 4px' }}>Anahtarınız yalnızca bu tarayıcıda saklanır ve doğrudan seçtiğiniz sağlayıcıya gönderilir; hiçbir sunucuda tutulmaz. Model alanı "Otomatik" modda da geçerlidir: boş bırakırsanız sunucudaki varsayılan model kullanılır.</div>

          <div style={{ borderTop: '1px solid var(--line-3)', margin: '2px 0 4px' }} />
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px' }}>MODEL ÜRETİM AYARLARI</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 4px' }}>
            <label style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>Düşünme eforu <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(reasoning) — modelin cevaptan önce ne kadar akıl yürüteceği</span></label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {THINKS.map(d => seg((A.thinking || 'adaptive') === d.key, d.label, d.hint, () => upd(n => { n.aiSettings.thinking = d.key; }), true))}
            </div>
            <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
              Yalnızca düşünen modellerde (MiniMax M3 ve benzerleri) etkilidir; desteklemeyen modeller bu ayarı yok sayar.
              Düşünme tokenları da token bütçenizden harcanır — "Yüksek" seçimi maliyeti ve süreyi belirgin artırır.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 4px' }}>
            <label style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>Analiz derinliği <span style={{ fontWeight: 400, color: 'var(--muted)' }}>— çıktı uzunluğu bütçesi</span></label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DEPTHS.map(d => seg((A.depth || 'standart') === d.key, d.label, d.hint, () => upd(n => { n.aiSettings.depth = d.key; }), true))}
            </div>
            <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
              Etkin token bütçesi: <strong>{tokenBudget}</strong> (derinlik ×{DEPTH_LABEL[A.depth || 'standart']} · düşünme ×{THINK_LABEL[A.thinking || 'adaptive']}, üst sınır 60.000).
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '0 0 4px' }}>
            <label style={{ flex: 1, font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>Yaratıcılık <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(temperature)</span></label>
            <div style={{ display: 'flex', gap: 6 }}>
              {TEMPS.map(t => seg(Math.abs((parseFloat(A.temperature) || 0) - t.v) < 0.06, t.label, t.hint, () => upd(n => { n.aiSettings.temperature = t.v; }), false))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '0 0 4px' }}>
            <label style={{ flex: 1, font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>İnce ayar <span style={{ fontWeight: 400, color: 'var(--muted)' }}>— boş bırakılabilir</span></label>
            <input
              className="pcx-field-sm" type="number" step="0.05" min="0" max="2"
              value={A.temperature === '' || A.temperature === undefined ? '' : A.temperature}
              onChange={e => upd(n => { n.aiSettings.temperature = e.target.value; })}
              placeholder="temperature"
              title="Sıcaklık: 0 = en tutarlı, 1+ = en yaratıcı"
              style={{ flex: 'none', width: 116, boxSizing: 'border-box', padding: '7px 10px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
            />
            <input
              className="pcx-field-sm" type="number" step="0.05" min="0.01" max="1"
              value={A.topP === '' || A.topP === undefined ? '' : A.topP}
              onChange={e => upd(n => { n.aiSettings.topP = e.target.value; })}
              placeholder="top_p"
              title="top_p: sözcük çeşitliliği. Boşsa sağlayıcı varsayılanı kullanılır."
              style={{ flex: 'none', width: 116, boxSizing: 'border-box', padding: '7px 10px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
            />
          </div>
          <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 4px' }}>Yapılandırılmış çıktı (rehber kartları, rapor) için 0,3–0,7 arası önerilir; 1'in üzerinde model şemadan sapabilir. Bu ayarlar hem "Otomatik" modda hem de kendi anahtarınızla geçerlidir.</div>

          <div style={{ borderTop: '1px solid var(--line-3)', margin: '2px 0 4px' }} />
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px' }}>YZ REHBER AYARLARI</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 4px' }}>
            <label style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>Rehberlik seviyesi</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {LEVELS.map(l => seg((A.level || 'dengeli') === l.key, l.label, l.hint, () => upd(n => { n.aiSettings.level = l.key; }), true))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '0 0 4px' }}>
            <label style={{ flex: 1, font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>Adıma girince otomatik öneri hazırla</label>
            <HButton
              onClick={() => upd(n => { n.aiSettings.auto = !(n.aiSettings.auto !== false); })}
              style={{ flex: 'none', padding: '7px 14px', border: '1px solid var(--pri)', borderRadius: 20, background: 'var(--pri-soft)', color: 'var(--pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={{ background: 'var(--pri-soft-hover)' }}
            >{A.auto !== false ? 'Açık' : 'Kapalı'}</HButton>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 6px' }}>
            <label style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>Alan / sektör bağlamı <span style={{ fontWeight: 400, color: 'var(--muted)' }}>— tüm YZ yanıtları bu bağlama göre örnek verir</span></label>
            <input
              className="pcx-field" value={A.context || ''}
              onChange={e => upd(n => { n.aiSettings.context = e.target.value; })}
              placeholder="Örn. perakende lojistiği, SaaS ürün ekibi, banka çağrı merkezi…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
            />
          </div>

          {STYLE_ROWS.map(row => (
            <div key={row.key} style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '0 0 2px' }}>
              <label style={{ flex: 1, font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{row.label}</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {row.opts.map(o => seg((A[row.key] || row.opts[0].k) === o.k, o.l, '', () => upd(n => { n.aiSettings[row.key] = o.k; }), false))}
              </div>
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--line-3)', margin: '2px 0 4px' }} />
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px' }}>KURUM PRENSİPLERİ</div>
          {principles.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 'none', width: 26, height: 26, borderRadius: '50%', background: 'var(--line-2)', color: 'var(--ink-4)', font: '700 11px/26px Helvetica,Arial,sans-serif', textAlign: 'center' }}>{i + 1}</div>
              <input
                className="pcx-field" value={p}
                onChange={e => upd(n => { n.principles[i] = e.target.value; })}
                placeholder="Prensip metni"
                style={{ flex: 1, boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
              />
              <HButton
                title="Prensibi sil"
                onClick={() => {
                  if (!confirm((i + 1) + '. prensip silinecek; kök nedenlerdeki eşleştirmeler güncellenecek. Emin misiniz?')) return;
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
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px', margin: '0 0 8px' }}>VERİ VE YEDEKLEME</div>
          <div style={{ background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 8, padding: '10px 12px', font: '12px/1.6 Helvetica,Arial,sans-serif', color: 'var(--warn-ink-3)', margin: '0 0 10px' }}>
            <strong>Çalışmalarınız yalnızca bu tarayıcıda saklanır.</strong> Hiçbir sunucuya gönderilmez ve otomatik yedeği yoktur.
            Tarayıcı verilerini temizlerseniz, gizli sekme kullanırsanız ya da başka bir cihaza geçerseniz çalışmalarınıza erişemezsiniz — düzenli olarak JSON yedeği alın.
          </div>
          {state.saveError ? (
            <div role="alert" style={{ background: 'var(--alert-soft)', border: '1px solid var(--alert-border)', borderRadius: 8, padding: '10px 12px', font: '12px/1.6 Helvetica,Arial,sans-serif', color: 'var(--alert)', margin: '0 0 10px' }}>
              <strong>⚠ Kaydedilemedi:</strong> {state.saveError}
            </div>
          ) : null}
          {(() => {
            const fmt = iso => { try { return new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return '—'; } };
            const days = iso => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
            const stale = !state.lastBackup || days(state.lastBackup) >= 7;
            return (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '0 0 10px', font: '12px/1.6 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>
                <div><strong>Son kayıt:</strong> {state.lastSaved ? fmt(state.lastSaved) : 'henüz kaydedilmedi'}</div>
                <div style={{ color: stale ? 'var(--warn-ink)' : 'var(--ink-3)' }}>
                  <strong>Son yedek:</strong> {state.lastBackup ? fmt(state.lastBackup) : 'hiç alınmadı'}
                  {stale ? ' — yedek almanız önerilir' : ''}
                </div>
              </div>
            );
          })()}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '0 20px 12px', background: 'var(--surface-2)' }}>
          <div style={{ flex: 1, minWidth: 220, font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>Tüm çalışmalarınızı JSON olarak indirin ya da bir yedeği / meslektaşınızın dosyasını içe aktarın.</div>
          <HButton onClick={exportData} style={{ flex: 'none', padding: '8px 13px', border: '1px solid var(--pri)', borderRadius: 7, background: 'var(--surface)', color: 'var(--pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: 'var(--pri-soft)' }}>↓ Dışa aktar</HButton>
          <HButton onClick={importData} style={{ flex: 'none', padding: '8px 13px', border: '1px solid var(--pri)', borderRadius: 7, background: 'var(--surface)', color: 'var(--pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: 'var(--pri-soft)' }}>↑ İçe aktar</HButton>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--line-3)' }}>
          <HButton
            onClick={() => upd(n => { n.principles.push(''); })}
            style={{ padding: '9px 14px', border: '1px dashed var(--dash-border)', borderRadius: 8, background: 'transparent', color: 'var(--ink-3)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--surface-4)' }}
          >+ Prensip ekle</HButton>
          <HButton
            onClick={() => { if (confirm('Prensip listesi varsayılan 20 kurum prensibine döndürülecek. Emin misiniz?')) upd(n => { n.principles = defaultPrinciples(); }); }}
            style={{ padding: '9px 14px', border: '1px solid var(--field-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--surface-4)' }}
          >Varsayılanlara dön</HButton>
          <HButton
            onClick={close}
            style={{ marginLeft: 'auto', padding: '9px 18px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--pri-hover)' }}
          >Kapat</HButton>
        </div>
      </div>
    </div>
  );
}
