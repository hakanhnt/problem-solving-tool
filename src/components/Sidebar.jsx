import React from 'react';
import { useStore } from '../lib/store.jsx';
import { STEPS, blankCase, exampleCase, CASE_TEMPLATES } from '../lib/defaults.js';
import { stepChecklist, caseMaturity } from '../lib/derive.js';
import { HButton, HA } from '../ui/primitives.jsx';

/** Uygulama işareti: akışın daralarak karara inişini anlatan üç düğüm. */
function BrandMark() {
  return (
    <div style={{ flex: 'none', width: 38, height: 38, borderRadius: 10, background: 'var(--pri)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(53,80,110,.35)' }}>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 5h16M7 12h10M10.5 19h3" stroke="var(--on-pri)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="5" r="1.6" fill="var(--pri-bar)" />
        <circle cx="12" cy="12" r="1.6" fill="var(--pri-border-3)" />
        <circle cx="12" cy="19" r="1.9" fill="var(--on-pri)" />
      </svg>
    </div>
  );
}

/** Aktif çalışmanın hangi adımlarında içerik var — ilerleme göstergesi için. */
function stepDone(c, n) {
  if (n === 1) return !!(c.problem.statement || '').trim();
  if (n === 2) return c.drivers.some(d => (d.name || '').trim());
  if (n === 3) return c.driverAnalysis.length > 0 || c.sipoc.length > 0;
  if (n === 4) return c.findings.some(f => (f.text || '').trim());
  if (n === 5) return c.whys.some(w => (w || '').trim()) || c.rootCauses.length > 0;
  if (n === 6) return c.alternatives.length > 0 || !!(c.decision.choice || '').trim();
  if (n === 7) return (c.tracking || []).length > 0 || Object.values(c.retro || {}).some(v => (v || '').trim()) || (c.actions || []).some(a => a.status);
  // Rapor adımı: yönetici özeti üretildiyse ya da tutarlılık denetimi çalıştırıldıysa
  return !!((c.report && (c.report.text || '').trim()) || (c.audit && (c.audit.text || '').trim()));
}

export default function Sidebar({ onNavigate }) {
  const { state, eff, c, step, upd, goStep, ensureCoach, toggleTheme } = useStore();
  const doneSteps = [1, 2, 3, 4, 5, 6, 7, 8].filter(n => stepDone(c, n));
  const doneCount = doneSteps.length;
  const maturity = caseMaturity(c);

  const caseKeys = Object.keys(state.cases);
  caseKeys.sort((a, b) => (a === 'ornek' ? -1 : b === 'ornek' ? 1 : 0));

  const selectCase = k => { upd(n => { n.activeCase = k; }); setTimeout(() => ensureCoach(), 60); if (onNavigate) onNavigate(); };

  const renameCase = k => {
    const name = prompt('Çalışmanın yeni adı:', state.cases[k].name || '');
    if (name && name.trim()) upd(n => { n.cases[k].name = name.trim(); });
  };

  const deleteCase = k => {
    if (!confirm('"' + (state.cases[k].name || k) + '" çalışması silinecek. Silme sonrası "Geri al" ile kurtarabilirsiniz. Emin misiniz?')) return;
    upd(n => {
      n.trash = { key: k, data: n.cases[k], name: n.cases[k].name || k };
      delete n.cases[k];
      if (!Object.keys(n.cases).some(x => x !== 'ornek')) n.cases['c' + Date.now()] = blankCase();
      if (n.activeCase === k) { n.activeCase = Object.keys(n.cases).find(x => x !== 'ornek') || Object.keys(n.cases)[0]; n.step = 1; }
    });
  };

  const [tplOpen, setTplOpen] = React.useState(false);
  const [tplName, setTplName] = React.useState('');

  const createCase = tpl => {
    const id = 'c' + Date.now();
    upd(n => {
      const nc = blankCase((tplName || '').trim() || (tpl.key === 'bos' ? 'Yeni Çalışma' : tpl.ad));
      if (tpl.fill) {
        if (tpl.fill.problem) Object.assign(nc.problem, tpl.fill.problem);
        if (tpl.fill.drivers) nc.drivers = structuredClone(tpl.fill.drivers);
        if (tpl.fill.criteria) nc.criteria = structuredClone(tpl.fill.criteria);
      }
      n.cases[id] = nc;
      n.activeCase = id;
      n.step = 1;
    });
    setTplOpen(false);
    setTplName('');
  };

  return (
    <aside data-noprint="1" style={{ width: 288, flex: 'none', background: 'var(--surface)', borderRight: '1px solid var(--line-strong)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--line-3)', background: 'linear-gradient(180deg,var(--brand-grad) 0%,var(--surface) 100%)' }}>
        <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
          <BrandMark />
          <div style={{ minWidth: 0 }}>
            <div style={{ font: '700 16px/1.25 Helvetica,Arial,sans-serif', color: 'var(--ink)', letterSpacing: '-.2px' }}>Problem Çözme Akışı</div>
            <div style={{ font: '11.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', marginTop: 2 }}>Rehberli problem çözme ve karar verme</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 11 }}>
          {['8 adımlık akış', 'YZ destekli', 'Alan bağımsız'].map(t => (
            <span key={t} style={{ font: '600 10px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', background: 'var(--pri-soft)', border: '1px solid var(--pri-border-5)', borderRadius: 20, padding: '3px 8px' }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 6px' }}>
        <div style={{ flex: 1, font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px' }}>ÇALIŞMALAR</div>
        <HButton
          onClick={() => setTplOpen(true)}
          style={{ flex: 'none', padding: '5px 10px', border: '1px solid var(--pri)', borderRadius: 6, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
          hover={{ background: 'var(--pri-hover)' }}
        >+ Yeni</HButton>
      </div>

      <div style={{ padding: '2px 12px 8px', display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 190, overflow: 'auto', borderBottom: '1px solid var(--line-3)' }}>
        {caseKeys.map(k => {
          const act = eff === k;
          return (
            <div key={k} style={{ display: 'flex', gap: 4, alignItems: 'center', borderRadius: 7, background: act ? 'var(--pri-soft)' : 'transparent', padding: '7px 6px 7px 10px' }}>
              <div
                onClick={() => selectCase(k)}
                style={{ flex: 1, minWidth: 0, cursor: 'pointer', font: '600 12.5px/1.3 Helvetica,Arial,sans-serif', color: act ? 'var(--pri)' : 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >{state.cases[k].name || k}</div>
              {k !== 'ornek' ? (
                <>
                  <HButton
                    onClick={() => renameCase(k)} title="Yeniden adlandır"
                    style={{ flex: 'none', width: 22, height: 22, border: 'none', borderRadius: 5, background: 'transparent', color: 'var(--muted-2)', font: '12px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                    hover={{ background: 'var(--line-3)', color: 'var(--ink-3)' }}
                  >✎</HButton>
                  <HButton
                    onClick={() => deleteCase(k)} title="Çalışmayı sil"
                    style={{ flex: 'none', width: 22, height: 22, border: 'none', borderRadius: 5, background: 'transparent', color: 'var(--muted-2)', font: '700 13px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                    hover={{ background: 'var(--alert-soft)', color: 'var(--danger)' }}
                  >×</HButton>
                </>
              ) : null}
            </div>
          );
        })}
      </div>

      {state.trash ? (
        <div style={{ margin: '8px 12px 0', background: 'var(--warn-soft-2)', border: '1px solid var(--warn-border-2)', borderRadius: 8, padding: '9px 11px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0, font: '12px/1.4 Helvetica,Arial,sans-serif', color: 'var(--warn-ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{state.trash.name}" silindi</div>
          <HButton
            onClick={() => upd(n => { if (!n.trash) return; n.cases[n.trash.key] = n.trash.data; n.activeCase = n.trash.key; n.trash = null; })}
            style={{ flex: 'none', padding: '5px 10px', border: '1px solid var(--pri)', borderRadius: 6, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--pri-hover)' }}
          >Geri al</HButton>
          <HButton
            onClick={() => upd(n => { n.trash = null; })} title="Kalıcı olarak kaldır"
            style={{ flex: 'none', width: 20, height: 20, border: 'none', background: 'transparent', color: 'var(--muted-2)', font: '700 12px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ color: 'var(--ink-3)' }}
          >×</HButton>
        </div>
      ) : null}

      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '0 0 6px' }}>
          <div style={{ flex: 1, font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px' }}>ÇALIŞMA İLERLEMESİ</div>
          <div style={{ font: '700 11px Helvetica,Arial,sans-serif', color: doneCount === 8 ? 'var(--ok-ink)' : 'var(--pri)' }}>{doneCount}/8</div>
        </div>
        <div style={{ display: 'flex', gap: 3 }} role="img" aria-label={'8 adımdan ' + doneCount + ' adımda içerik var'}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => {
            const ck = stepChecklist(c, n);
            return (
              <div
                key={n}
                title={n + '. ' + STEPS[n - 1].title + ' — ' + (ck.missing === 0 ? 'tamamlanma ölçütleri karşılandı' : ck.missing + ' ölçüt eksik: ' + ck.items.filter(x => !x.ok).map(x => x.label).join(', '))}
                style={{ flex: 1, height: 4, borderRadius: 2, background: ck.missing === 0 ? 'var(--ok)' : (doneSteps.includes(n) ? 'var(--pri)' : 'var(--line)') }}
              />
            );
          })}
        </div>
        <div
          title="Alan doluluğu değil, metodolojik olgunluk: kanıt, doğrulama ve KPI ile teyit durumunu gösterir."
          style={{ marginTop: 8, display: 'inline-block', font: '600 10.5px Helvetica,Arial,sans-serif', letterSpacing: '.3px', borderRadius: 20, padding: '3px 9px', color: maturity.key === 'dogrulandi' ? 'var(--ok-ink)' : 'var(--pri-ink)', background: maturity.key === 'dogrulandi' ? 'var(--ok-soft)' : 'var(--pri-soft)', border: '1px solid ' + (maturity.key === 'dogrulandi' ? 'var(--ok-border)' : 'var(--pri-border-5)') }}
        >Olgunluk: {maturity.label}</div>
      </div>

      <nav aria-label="Çalışma adımları" style={{ padding: '2px 12px 8px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'auto' }}>
        {STEPS.map((s, i) => {
          const n = i + 1, active = step === n, done = doneSteps.includes(n);
          const ck = stepChecklist(c, n);
          return (
            <button
              key={n} type="button"
              aria-current={active ? 'step' : undefined}
              aria-label={n + '. adım: ' + s.title + ' — ' + (ck.missing === 0 ? 'tamamlandı' : ck.missing + ' ölçüt eksik')}
              onClick={() => { goStep(n); if (onNavigate) onNavigate(); }}
              style={{
                display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 8, cursor: 'pointer',
                background: active ? 'var(--pri-soft)' : 'transparent', border: 'none', textAlign: 'left', width: '100%', font: 'inherit'
              }}
            >
              <div aria-hidden="true" style={{
                width: 22, height: 22, flex: 'none', borderRadius: '50%',
                background: active ? 'var(--pri)' : (ck.missing === 0 ? 'var(--ok-soft-2)' : (done ? 'var(--pri-soft)' : 'var(--line-2)')),
                color: active ? 'var(--on-pri)' : (ck.missing === 0 ? 'var(--ok)' : (done ? 'var(--pri)' : 'var(--ink-4)')),
                font: '700 11px/22px Helvetica,Arial,sans-serif', textAlign: 'center'
              }}>{!active && ck.missing === 0 ? '✓' : n}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '600 13px/1.35 Helvetica,Arial,sans-serif', color: active ? 'var(--pri)' : 'var(--ink-2)' }}>{s.title}</div>
                <div style={{ font: '11px/1.4 Helvetica,Arial,sans-serif', color: active ? 'var(--pri-soft-ink)' : 'var(--muted-3)', marginTop: 1 }}>
                  {ck.missing > 0 && done ? ck.missing + ' ölçüt eksik' : s.sub}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {tplOpen ? (
        <div data-noprint="1" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 24 }} onClick={() => setTplOpen(false)}>
          <div style={{ background: 'var(--surface)', borderRadius: 12, width: 480, maxWidth: '94vw', maxHeight: '84vh', overflow: 'auto', padding: '18px 20px', boxShadow: '0 18px 50px rgba(0,0,0,.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ font: '700 15px Helvetica,Arial,sans-serif', color: 'var(--ink)', margin: '0 0 4px' }}>Yeni çalışma</div>
            <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 12px' }}>Şablonlar yalnızca KPI adı, aday driver'lar ve karar kriterlerini ön doldurur — hepsi düzenlenebilir. Problem ifadesini her durumda siz yazarsınız.</div>
            <input
              className="pcx-field" value={tplName} onChange={e => setTplName(e.target.value)}
              placeholder="Çalışma adı (boşsa şablon adı kullanılır)"
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none', margin: '0 0 12px' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CASE_TEMPLATES.map(t => (
                <HButton
                  key={t.key} onClick={() => createCase(t)}
                  style={{ textAlign: 'left', padding: '11px 13px', border: '1px solid ' + (t.key === 'bos' ? 'var(--field-border)' : 'var(--pri-border-2)'), borderRadius: 9, background: t.key === 'bos' ? 'var(--surface)' : 'var(--pri-soft-2)', cursor: 'pointer' }}
                  hover={{ background: 'var(--pri-soft)' }}
                >
                  <div style={{ font: '700 13px Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{t.ad}</div>
                  <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 2 }}>{t.desc}</div>
                </HButton>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <HButton
                onClick={() => setTplOpen(false)}
                style={{ padding: '8px 14px', border: '1px solid var(--field-border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                hover={{ background: 'var(--surface-4)' }}
              >Vazgeç</HButton>
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--line-3)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {eff === 'ornek' ? (
          <HButton
            onClick={() => { if (confirm('Örnek çalışma ilk haline döndürülecek. Emin misiniz?')) upd(n => { n.cases.ornek = exampleCase(); }); }}
            style={{ padding: '8px 10px', border: '1px solid var(--field-border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--surface-4)' }}
          >Örnek çalışmayı sıfırla</HButton>
        ) : null}
        <HA
          href={'/rehber.html' + (state.theme === 'dark' ? '?tema=koyu' : '')} target="_blank" rel="noreferrer"
          style={{ display: 'block', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--field-border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12px Helvetica,Arial,sans-serif', textDecoration: 'none', textAlign: 'left' }}
          hover={{ background: 'var(--surface-4)' }}
        >📖 Kullanım Rehberi</HA>
        <HButton
          onClick={toggleTheme}
          title={state.theme === 'dark' ? 'Aydınlık temaya geç' : 'Karanlık temaya geç'}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid var(--field-border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer', textAlign: 'left' }}
          hover={{ background: 'var(--surface-4)' }}
        >
          <span style={{ flex: 'none', font: '13px/1 Helvetica,Arial,sans-serif' }}>{state.theme === 'dark' ? '☀' : '☾'}</span>
          <span style={{ flex: 1 }}>{state.theme === 'dark' ? 'Aydınlık tema' : 'Karanlık tema'}</span>
          <span style={{ flex: 'none', display: 'flex', alignItems: 'center', width: 30, height: 16, borderRadius: 20, background: state.theme === 'dark' ? 'var(--pri)' : 'var(--line-strong)', padding: 2, boxSizing: 'border-box', transition: 'background .15s' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: state.theme === 'dark' ? 'var(--on-pri)' : 'var(--surface)', marginLeft: state.theme === 'dark' ? 14 : 0, transition: 'margin-left .15s' }} />
          </span>
        </HButton>
        <HButton
          onClick={() => { upd(n => { n.showSettings = true; }); if (onNavigate) onNavigate(); }}
          style={{ padding: '8px 10px', border: '1px solid var(--field-border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer', textAlign: 'left' }}
          hover={{ background: 'var(--surface-4)' }}
        >⚙ Ayarlar · Kurum prensipleri</HButton>
        <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted-2)' }}>Girdileriniz bu tarayıcıda otomatik kaydedilir; sayfayı kapatıp açtığınızda kaldığınız yerden devam edersiniz.</div>
      </div>
    </aside>
  );
}
