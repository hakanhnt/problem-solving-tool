import React from 'react';
import { useStore } from '../lib/store.jsx';
import { defaultPrinciples } from '../lib/defaults.js';
import { HButton } from '../ui/primitives.jsx';

const PROVIDERS = [
  { key: 'auto', label: 'Otomatik', hint: 'Yerleşik YZ varsa onu, yoksa site sahibinin sunucudaki demo anahtarını kullanır (anahtar tarayıcıya inmez)' },
  { key: 'minimax', label: 'MiniMax', hint: 'MiniMax hesabınızın API anahtarıyla' },
  { key: 'openai', label: 'OpenAI', hint: 'OpenAI (veya uyumlu) API anahtarıyla' },
  { key: 'anthropic', label: 'Anthropic', hint: 'Claude API anahtarıyla' }
];

const LEVELS = [
  { key: 'ogreten', label: 'Öğreten', hint: 'Öneri yok; sadece doğru sorular' },
  { key: 'dengeli', label: 'Dengeli', hint: 'Hipotez önerir + doğrulama soruları' },
  { key: 'hizli', label: 'Hızlandıran', hint: 'Eksiksiz taslaklar üretir' }
];

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

  const exportData = () => {
    const data = JSON.stringify({ app: 'pcx', version: 1, exportedAt: new Date().toISOString(), principles: state.principles, cases: state.cases }, null, 2);
    const b = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'problem-cozme-calismalari.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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
        border: '1px solid ' + (active ? '#35506e' : '#d6d3ce'),
        background: active ? '#35506e' : '#fff',
        color: active ? '#fff' : '#57534b',
        cursor: 'pointer', textAlign: block ? 'left' : 'center',
        font: block ? undefined : '600 11.5px Helvetica,Arial,sans-serif'
      }}
    >
      {block ? (
        <>
          <div style={{ font: '700 12px Helvetica,Arial,sans-serif', color: active ? '#fff' : '#57534b' }}>{label}</div>
          <div style={{ font: '10.5px/1.35 Helvetica,Arial,sans-serif', color: active ? '#fff' : '#57534b', opacity: .75, marginTop: 2 }}>{hint}</div>
        </>
      ) : label}
    </button>
  );

  return (
    <div data-noprint="1" style={{ position: 'fixed', inset: 0, background: 'rgba(38,36,31,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 620, maxWidth: '94vw', maxHeight: '84vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 18px 50px rgba(38,36,31,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid #eceae5' }}>
          <div style={{ flex: 1 }}>
            <div style={{ font: '700 15px Helvetica,Arial,sans-serif', color: '#26241f' }}>Kurum Prensipleri</div>
            <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: '#8a857c', marginTop: 2 }}>Bu liste kök neden eşleştirmede, rehber önerilerinde ve raporda kullanılır. Kendi kurumunuzun prensiplerini/değerlerini yazabilirsiniz.</div>
          </div>
          <HButton
            onClick={close}
            style={{ flex: 'none', width: 28, height: 28, border: 'none', borderRadius: 6, background: 'transparent', color: '#a9a49b', font: '700 16px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: '#f1efeb', color: '#57534b' }}
          >×</HButton>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: '#8a857c', letterSpacing: '.8px' }}>YZ SAĞLAYICI</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PROVIDERS.map(p => {
              const act = (A.provider || 'auto') === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => upd(n => { n.aiSettings.provider = p.key; })}
                  title={p.hint}
                  style={{
                    flex: 1, minWidth: 110, padding: '8px 10px', borderRadius: 7,
                    border: '1px solid ' + (act ? '#35506e' : '#d6d3ce'),
                    background: act ? '#35506e' : '#fff',
                    cursor: 'pointer', textAlign: 'center',
                    font: '700 12px Helvetica,Arial,sans-serif', color: act ? '#fff' : '#57534b'
                  }}
                >{p.label}</button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 8 }}>
            <div>
              <label style={{ display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: '#57534b', margin: '0 0 4px' }}>API anahtarı <span style={{ fontWeight: 400, color: '#8a857c' }}>— Otomatik modda gerekmez</span></label>
              <input
                className="pcx-field-sm" type="password" value={A.apiKey || ''}
                onChange={e => upd(n => { n.aiSettings.apiKey = e.target.value; })}
                placeholder="sk-…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid #d6d3ce', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: '#26241f', background: '#fff', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: '#57534b', margin: '0 0 4px' }}>Model <span style={{ fontWeight: 400, color: '#8a857c' }}>— boşsa sunucu varsayılanı</span></label>
              <input
                className="pcx-field-sm" value={A.model || ''}
                onChange={e => upd(n => { n.aiSettings.model = e.target.value; })}
                placeholder="Örn. MiniMax-Text-01"
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid #d6d3ce', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: '#26241f', background: '#fff', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: '#57534b', margin: '0 0 4px' }}>API adresi <span style={{ fontWeight: 400, color: '#8a857c' }}>(isteğe bağlı — OpenAI uyumlu farklı bir uç nokta için)</span></label>
            <input
              className="pcx-field-sm" value={A.baseUrl || ''}
              onChange={e => upd(n => { n.aiSettings.baseUrl = e.target.value; })}
              placeholder="https://…/v1/chat/completions"
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid #d6d3ce', borderRadius: 6, font: '12.5px/1.4 Helvetica,Arial,sans-serif', color: '#26241f', background: '#fff', outline: 'none' }}
            />
          </div>
          <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: '#8a857c', margin: '0 0 4px' }}>Anahtarınız yalnızca bu tarayıcıda saklanır ve doğrudan seçtiğiniz sağlayıcıya gönderilir; hiçbir sunucuda tutulmaz. Model alanı "Otomatik" modda da geçerlidir: boş bırakırsanız sunucudaki varsayılan model kullanılır.</div>

          <div style={{ borderTop: '1px solid #eceae5', margin: '2px 0 4px' }} />
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: '#8a857c', letterSpacing: '.8px' }}>MODEL ÜRETİM AYARLARI</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 4px' }}>
            <label style={{ font: '600 12px Helvetica,Arial,sans-serif', color: '#57534b' }}>Analiz derinliği <span style={{ fontWeight: 400, color: '#8a857c' }}>— daha derin analiz daha uzun sürer</span></label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DEPTHS.map(d => seg((A.depth || 'standart') === d.key, d.label, d.hint, () => upd(n => { n.aiSettings.depth = d.key; }), true))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '0 0 4px' }}>
            <label style={{ flex: 1, font: '600 12px Helvetica,Arial,sans-serif', color: '#57534b' }}>Yaratıcılık <span style={{ fontWeight: 400, color: '#8a857c' }}>(temperature)</span></label>
            <div style={{ display: 'flex', gap: 6 }}>
              {TEMPS.map(t => seg(Math.abs((parseFloat(A.temperature) || 0) - t.v) < 0.06, t.label, t.hint, () => upd(n => { n.aiSettings.temperature = t.v; }), false))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '0 0 4px' }}>
            <label style={{ flex: 1, font: '600 12px Helvetica,Arial,sans-serif', color: '#57534b' }}>İnce ayar <span style={{ fontWeight: 400, color: '#8a857c' }}>— boş bırakılabilir</span></label>
            <input
              className="pcx-field-sm" type="number" step="0.05" min="0" max="2"
              value={A.temperature === '' || A.temperature === undefined ? '' : A.temperature}
              onChange={e => upd(n => { n.aiSettings.temperature = e.target.value; })}
              placeholder="temperature"
              title="Sıcaklık: 0 = en tutarlı, 1+ = en yaratıcı"
              style={{ flex: 'none', width: 116, boxSizing: 'border-box', padding: '7px 10px', border: '1px solid #d6d3ce', borderRadius: 6, font: '12.5px Helvetica,Arial,sans-serif', color: '#26241f', background: '#fff', outline: 'none' }}
            />
            <input
              className="pcx-field-sm" type="number" step="0.05" min="0.01" max="1"
              value={A.topP === '' || A.topP === undefined ? '' : A.topP}
              onChange={e => upd(n => { n.aiSettings.topP = e.target.value; })}
              placeholder="top_p"
              title="top_p: sözcük çeşitliliği. Boşsa sağlayıcı varsayılanı kullanılır."
              style={{ flex: 'none', width: 116, boxSizing: 'border-box', padding: '7px 10px', border: '1px solid #d6d3ce', borderRadius: 6, font: '12.5px Helvetica,Arial,sans-serif', color: '#26241f', background: '#fff', outline: 'none' }}
            />
          </div>
          <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: '#8a857c', margin: '0 0 4px' }}>Yapılandırılmış çıktı (rehber kartları, rapor) için 0,3–0,7 arası önerilir; 1'in üzerinde model şemadan sapabilir. Bu ayarlar hem "Otomatik" modda hem de kendi anahtarınızla geçerlidir.</div>

          <div style={{ borderTop: '1px solid #eceae5', margin: '2px 0 4px' }} />
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: '#8a857c', letterSpacing: '.8px' }}>YZ REHBER AYARLARI</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 4px' }}>
            <label style={{ font: '600 12px Helvetica,Arial,sans-serif', color: '#57534b' }}>Rehberlik seviyesi</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {LEVELS.map(l => seg((A.level || 'dengeli') === l.key, l.label, l.hint, () => upd(n => { n.aiSettings.level = l.key; }), true))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '0 0 4px' }}>
            <label style={{ flex: 1, font: '600 12px Helvetica,Arial,sans-serif', color: '#57534b' }}>Adıma girince otomatik öneri hazırla</label>
            <HButton
              onClick={() => upd(n => { n.aiSettings.auto = !(n.aiSettings.auto !== false); })}
              style={{ flex: 'none', padding: '7px 14px', border: '1px solid #35506e', borderRadius: 20, background: '#eef2f7', color: '#35506e', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={{ background: '#dfe7f0' }}
            >{A.auto !== false ? 'Açık' : 'Kapalı'}</HButton>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 6px' }}>
            <label style={{ font: '600 12px Helvetica,Arial,sans-serif', color: '#57534b' }}>Alan / sektör bağlamı <span style={{ fontWeight: 400, color: '#8a857c' }}>— tüm YZ yanıtları bu bağlama göre örnek verir</span></label>
            <input
              className="pcx-field" value={A.context || ''}
              onChange={e => upd(n => { n.aiSettings.context = e.target.value; })}
              placeholder="Örn. perakende lojistiği, SaaS ürün ekibi, banka çağrı merkezi…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid #d6d3ce', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: '#26241f', background: '#fff', outline: 'none' }}
            />
          </div>

          {STYLE_ROWS.map(row => (
            <div key={row.key} style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '0 0 2px' }}>
              <label style={{ flex: 1, font: '600 12px Helvetica,Arial,sans-serif', color: '#57534b' }}>{row.label}</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {row.opts.map(o => seg((A[row.key] || row.opts[0].k) === o.k, o.l, '', () => upd(n => { n.aiSettings[row.key] = o.k; }), false))}
              </div>
            </div>
          ))}

          <div style={{ borderTop: '1px solid #eceae5', margin: '2px 0 4px' }} />
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: '#8a857c', letterSpacing: '.8px' }}>KURUM PRENSİPLERİ</div>
          {principles.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 'none', width: 26, height: 26, borderRadius: '50%', background: '#e8e5df', color: '#6d6860', font: '700 11px/26px Helvetica,Arial,sans-serif', textAlign: 'center' }}>{i + 1}</div>
              <input
                className="pcx-field" value={p}
                onChange={e => upd(n => { n.principles[i] = e.target.value; })}
                placeholder="Prensip metni"
                style={{ flex: 1, boxSizing: 'border-box', padding: '8px 11px', border: '1px solid #d6d3ce', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: '#26241f', background: '#fff', outline: 'none' }}
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
                style={{ flex: 'none', width: 26, height: 26, border: 'none', borderRadius: 5, background: 'transparent', color: '#a9a49b', font: '700 14px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                hover={{ background: '#f6e9e5', color: '#b3432f' }}
              >×</HButton>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '12px 20px', borderTop: '1px solid #eceae5', background: '#fbfaf8' }}>
          <div style={{ flex: 1, minWidth: 220, font: '12px/1.5 Helvetica,Arial,sans-serif', color: '#8a857c' }}><strong style={{ color: '#57534b' }}>Veri yedekleme:</strong> tüm çalışmalarınızı JSON olarak indirin ya da bir yedeği / meslektaşınızın dosyasını içe aktarın.</div>
          <HButton onClick={exportData} style={{ flex: 'none', padding: '8px 13px', border: '1px solid #35506e', borderRadius: 7, background: '#fff', color: '#35506e', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: '#eef2f7' }}>↓ Dışa aktar</HButton>
          <HButton onClick={importData} style={{ flex: 'none', padding: '8px 13px', border: '1px solid #35506e', borderRadius: 7, background: '#fff', color: '#35506e', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: '#eef2f7' }}>↑ İçe aktar</HButton>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #eceae5' }}>
          <HButton
            onClick={() => upd(n => { n.principles.push(''); })}
            style={{ padding: '9px 14px', border: '1px dashed #b9b4ab', borderRadius: 8, background: 'transparent', color: '#57534b', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: '#f1efeb' }}
          >+ Prensip ekle</HButton>
          <HButton
            onClick={() => { if (confirm('Prensip listesi varsayılan 20 kurum prensibine döndürülecek. Emin misiniz?')) upd(n => { n.principles = defaultPrinciples(); }); }}
            style={{ padding: '9px 14px', border: '1px solid #d6d3ce', borderRadius: 8, background: '#fff', color: '#57534b', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: '#f1efeb' }}
          >Varsayılanlara dön</HButton>
          <HButton
            onClick={close}
            style={{ marginLeft: 'auto', padding: '9px 18px', border: '1px solid #35506e', borderRadius: 8, background: '#35506e', color: '#fff', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: '#2a4159' }}
          >Kapat</HButton>
        </div>
      </div>
    </div>
  );
}
