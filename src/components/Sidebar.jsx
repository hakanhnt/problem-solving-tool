import React from 'react';
import { useStore } from '../lib/store.jsx';
import { STEPS, blankCase, exampleCase } from '../lib/defaults.js';
import { HButton, HA } from '../ui/primitives.jsx';

/** Uygulama işareti: akışın daralarak karara inişini anlatan üç düğüm. */
function BrandMark() {
  return (
    <div style={{ flex: 'none', width: 38, height: 38, borderRadius: 10, background: '#35506e', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(53,80,110,.35)' }}>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 5h16M7 12h10M10.5 19h3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="5" r="1.6" fill="#8fb0d4" />
        <circle cx="12" cy="12" r="1.6" fill="#c9d8e8" />
        <circle cx="12" cy="19" r="1.9" fill="#fff" />
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

export default function Sidebar() {
  const { state, eff, c, step, upd, goStep, ensureCoach } = useStore();
  const doneSteps = [1, 2, 3, 4, 5, 6, 7, 8].filter(n => stepDone(c, n));
  const doneCount = doneSteps.length;

  const caseKeys = Object.keys(state.cases);
  caseKeys.sort((a, b) => (a === 'ornek' ? -1 : b === 'ornek' ? 1 : 0));

  const selectCase = k => { upd(n => { n.activeCase = k; }); setTimeout(() => ensureCoach(), 60); };

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

  const addCase = () => {
    const name = prompt('Yeni çalışmanın adı:', 'Yeni Çalışma');
    if (name === null) return;
    const id = 'c' + Date.now();
    upd(n => { n.cases[id] = blankCase((name || '').trim() || 'Yeni Çalışma'); n.activeCase = id; n.step = 1; });
  };

  return (
    <aside data-noprint="1" style={{ width: 288, flex: 'none', background: '#fff', borderRight: '1px solid #e0ddd7', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid #eceae5', background: 'linear-gradient(180deg,#f7f9fc 0%,#fff 100%)' }}>
        <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
          <BrandMark />
          <div style={{ minWidth: 0 }}>
            <div style={{ font: '700 16px/1.25 Helvetica,Arial,sans-serif', color: '#26241f', letterSpacing: '-.2px' }}>Problem Çözme Akışı</div>
            <div style={{ font: '11.5px/1.4 Helvetica,Arial,sans-serif', color: '#5f7897', marginTop: 2 }}>Rehberli problem çözme ve karar verme</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 11 }}>
          {['8 adımlık akış', 'YZ destekli', 'Alan bağımsız'].map(t => (
            <span key={t} style={{ font: '600 10px Helvetica,Arial,sans-serif', color: '#5f7897', background: '#eef2f7', border: '1px solid #dbe4ef', borderRadius: 20, padding: '3px 8px' }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 6px' }}>
        <div style={{ flex: 1, font: '700 10.5px Helvetica,Arial,sans-serif', color: '#8a857c', letterSpacing: '.8px' }}>ÇALIŞMALAR</div>
        <HButton
          onClick={addCase}
          style={{ flex: 'none', padding: '5px 10px', border: '1px solid #35506e', borderRadius: 6, background: '#35506e', color: '#fff', font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
          hover={{ background: '#2a4159' }}
        >+ Yeni</HButton>
      </div>

      <div style={{ padding: '2px 12px 8px', display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 190, overflow: 'auto', borderBottom: '1px solid #eceae5' }}>
        {caseKeys.map(k => {
          const act = eff === k;
          return (
            <div key={k} style={{ display: 'flex', gap: 4, alignItems: 'center', borderRadius: 7, background: act ? '#eef2f7' : 'transparent', padding: '7px 6px 7px 10px' }}>
              <div
                onClick={() => selectCase(k)}
                style={{ flex: 1, minWidth: 0, cursor: 'pointer', font: '600 12.5px/1.3 Helvetica,Arial,sans-serif', color: act ? '#35506e' : '#57534b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >{state.cases[k].name || k}</div>
              {k !== 'ornek' ? (
                <>
                  <HButton
                    onClick={() => renameCase(k)} title="Yeniden adlandır"
                    style={{ flex: 'none', width: 22, height: 22, border: 'none', borderRadius: 5, background: 'transparent', color: '#a9a49b', font: '12px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                    hover={{ background: '#eceae5', color: '#57534b' }}
                  >✎</HButton>
                  <HButton
                    onClick={() => deleteCase(k)} title="Çalışmayı sil"
                    style={{ flex: 'none', width: 22, height: 22, border: 'none', borderRadius: 5, background: 'transparent', color: '#a9a49b', font: '700 13px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                    hover={{ background: '#f6e9e5', color: '#b3432f' }}
                  >×</HButton>
                </>
              ) : null}
            </div>
          );
        })}
      </div>

      {state.trash ? (
        <div style={{ margin: '8px 12px 0', background: '#f6f1e7', border: '1px solid #e8ddc7', borderRadius: 8, padding: '9px 11px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0, font: '12px/1.4 Helvetica,Arial,sans-serif', color: '#7a6f57', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{state.trash.name}" silindi</div>
          <HButton
            onClick={() => upd(n => { if (!n.trash) return; n.cases[n.trash.key] = n.trash.data; n.activeCase = n.trash.key; n.trash = null; })}
            style={{ flex: 'none', padding: '5px 10px', border: '1px solid #35506e', borderRadius: 6, background: '#35506e', color: '#fff', font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: '#2a4159' }}
          >Geri al</HButton>
          <HButton
            onClick={() => upd(n => { n.trash = null; })} title="Kalıcı olarak kaldır"
            style={{ flex: 'none', width: 20, height: 20, border: 'none', background: 'transparent', color: '#a9a49b', font: '700 12px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ color: '#57534b' }}
          >×</HButton>
        </div>
      ) : null}

      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '0 0 6px' }}>
          <div style={{ flex: 1, font: '700 10.5px Helvetica,Arial,sans-serif', color: '#8a857c', letterSpacing: '.8px' }}>ÇALIŞMA İLERLEMESİ</div>
          <div style={{ font: '700 11px Helvetica,Arial,sans-serif', color: doneCount === 8 ? '#3d5a3d' : '#35506e' }}>{doneCount}/8</div>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <div
              key={n}
              title={n + '. ' + STEPS[n - 1].title + (doneSteps.includes(n) ? ' — dolduruldu' : ' — boş')}
              style={{ flex: 1, height: 4, borderRadius: 2, background: doneSteps.includes(n) ? (doneCount === 8 ? '#4a6741' : '#35506e') : '#e3e0da' }}
            />
          ))}
        </div>
      </div>

      <nav style={{ padding: '2px 12px 8px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'auto' }}>
        {STEPS.map((s, i) => {
          const n = i + 1, active = step === n, done = doneSteps.includes(n);
          return (
            <div
              key={n}
              onClick={() => goStep(n)}
              style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 8, cursor: 'pointer', background: active ? '#eef2f7' : 'transparent' }}
            >
              <div style={{
                width: 22, height: 22, flex: 'none', borderRadius: '50%',
                background: active ? '#35506e' : (done ? '#e4ede4' : '#e8e5df'),
                color: active ? '#fff' : (done ? '#4a6741' : '#6d6860'),
                font: '700 11px/22px Helvetica,Arial,sans-serif', textAlign: 'center'
              }}>{!active && done ? '✓' : n}</div>
              <div>
                <div style={{ font: '600 13px/1.35 Helvetica,Arial,sans-serif', color: active ? '#35506e' : '#3d3a34' }}>{s.title}</div>
                <div style={{ font: '11px/1.4 Helvetica,Arial,sans-serif', color: active ? '#5f7897' : '#96918a', marginTop: 1 }}>{s.sub}</div>
              </div>
            </div>
          );
        })}
      </nav>

      <div style={{ padding: '14px 16px', borderTop: '1px solid #eceae5', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {eff === 'ornek' ? (
          <HButton
            onClick={() => { if (confirm('Örnek çalışma ilk haline döndürülecek. Emin misiniz?')) upd(n => { n.cases.ornek = exampleCase(); }); }}
            style={{ padding: '8px 10px', border: '1px solid #d6d3ce', borderRadius: 6, background: '#fff', color: '#57534b', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: '#f1efeb' }}
          >Örnek çalışmayı sıfırla</HButton>
        ) : null}
        <HA
          href="/rehber.html" target="_blank" rel="noreferrer"
          style={{ display: 'block', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #d6d3ce', borderRadius: 6, background: '#fff', color: '#57534b', font: '600 12px Helvetica,Arial,sans-serif', textDecoration: 'none', textAlign: 'left' }}
          hover={{ background: '#f1efeb' }}
        >📖 Kullanım Rehberi</HA>
        <HButton
          onClick={() => upd(n => { n.showSettings = true; })}
          style={{ padding: '8px 10px', border: '1px solid #d6d3ce', borderRadius: 6, background: '#fff', color: '#57534b', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer', textAlign: 'left' }}
          hover={{ background: '#f1efeb' }}
        >⚙ Ayarlar · Kurum prensipleri</HButton>
        <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: '#a9a49b' }}>Girdileriniz bu tarayıcıda otomatik kaydedilir; sayfayı kapatıp açtığınızda kaldığınız yerden devam edersiniz.</div>
      </div>
    </aside>
  );
}
