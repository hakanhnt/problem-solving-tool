import React, { useState, useEffect } from 'react';
import { useStore } from './lib/store.jsx';
import { parseShareHash } from './lib/share.js';
import SharedView from './components/SharedView.jsx';
import { STEPS } from './lib/defaults.js';
import Sidebar from './components/Sidebar.jsx';
import CoachPanel from './components/CoachPanel.jsx';
import AssistantChat from './components/AssistantChat.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import Step1Problem from './steps/Step1Problem.jsx';
import Step2Drivers from './steps/Step2Drivers.jsx';
import Step3Analysis from './steps/Step3Analysis.jsx';
import Step4Findings from './steps/Step4Findings.jsx';
import Step5RootCause from './steps/Step5RootCause.jsx';
import Step6Countermeasures from './steps/Step6Countermeasures.jsx';
import Step7Tracking from './steps/Step7Tracking.jsx';
import Step8Report from './steps/Step8Report.jsx';
import { HButton, useNarrow } from './ui/primitives.jsx';

const STEP_VIEWS = [Step1Problem, Step2Drivers, Step3Analysis, Step4Findings, Step5RootCause, Step6Countermeasures, Step7Tracking, Step8Report];

export default function App() {
  const { state, c, step, mainRef, goStep, undoLast } = useStore();
  const [shared, setShared] = useState(() => parseShareHash(location.hash));
  const narrow = useNarrow();
  const [drawer, setDrawer] = useState(false);

  // Klavye kısayolları: Ctrl/Cmd+Z geri al, Ctrl/Cmd+←/→ adım gezinme.
  // Yazı alanlarında tarayıcının kendi geri alması bozulmaz.
  useEffect(() => {
    const onKey = e => {
      const t = e.target;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === 'z' && !typing && !e.shiftKey) { e.preventDefault(); undoLast(); }
      if (e.key === 'ArrowRight' && !typing) { e.preventDefault(); goStep(Math.min(8, stepRef.current + 1)); }
      if (e.key === 'ArrowLeft' && !typing) { e.preventDefault(); goStep(Math.max(1, stepRef.current - 1)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const stepRef = React.useRef(step);
  stepRef.current = step;
  const StepView = STEP_VIEWS[step - 1];
  const aiReady = (c.problem.statement || '').trim().length > 0;

  if (shared) {
    return (
      <SharedView
        payload={shared}
        onExit={() => { history.replaceState(null, '', location.pathname); setShared(null); }}
      />
    );
  }

  const onNext = () => {
    if (step === 1 && !aiReady) {
      alert('Devam etmeden önce problem ifadenizi yazın — rehber sonraki adımlarda sizi bu tanıma göre yönlendirecek.');
      return;
    }
    const lists = { 2: c.drivers, 3: c.driverAnalysis, 4: c.findings, 5: c.rootCauses };
    const unv = (lists[step] || []).filter(x => x && x.src === 'yz' && !x.verified).length;
    if (unv > 0 && !confirm(unv + ' YZ önerisi henüz doğrulanmadı (turuncu rozetli kayıtlar). Önerileri işi yapanlarla ve veriyle doğrulamadan ilerlemek metodolojiye aykırıdır.\n\nYine de devam edilsin mi?')) return;
    goStep(step + 1);
  };

  return (
    <div data-app-root="1" style={{ display: 'flex', flexDirection: narrow ? 'column' : 'row', height: '100vh', overflow: 'hidden' }}>
      {narrow ? (
        <div data-noprint="1" style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--line-strong)' }}>
          <HButton
            onClick={() => setDrawer(true)}
            aria-label="Menüyü aç"
            style={{ flex: 'none', width: 38, height: 38, border: '1px solid var(--field-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-3)', font: '18px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--surface-4)' }}
          >☰</HButton>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: '700 13.5px/1.3 Helvetica,Arial,sans-serif', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{STEPS[step - 1].title}</div>
            <div style={{ font: '10.5px/1.3 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>Adım {step}/8 · {c.name || 'Çalışma'}</div>
          </div>
        </div>
      ) : null}

      {narrow ? (
        drawer ? (
          <div data-noprint="1" style={{ position: 'fixed', inset: 0, zIndex: 55 }}>
            <div onClick={() => setDrawer(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, boxShadow: '4px 0 24px rgba(0,0,0,.25)', display: 'flex' }}>
              <Sidebar onNavigate={() => setDrawer(false)} />
            </div>
          </div>
        ) : null
      ) : (
        <Sidebar />
      )}

      <main ref={mainRef} data-main="1" style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', padding: narrow ? '20px 16px 90px' : '34px 44px 90px' }}>
          <div data-noprint="1" style={{ font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '1px' }}>
            ADIM {step} / 8 · {c.name || 'Çalışma'}
          </div>
          <h1 data-noprint="1" style={{ font: '700 26px/1.25 Helvetica,Arial,sans-serif', margin: '8px 0 6px', color: 'var(--ink)' }}>{STEPS[step - 1].title}</h1>
          <p data-noprint="1" style={{ font: '14px/1.6 Helvetica,Arial,sans-serif', color: 'var(--ink-4)', margin: '0 0 22px', maxWidth: 640 }}>{STEPS[step - 1].desc}</p>

          <CoachPanel />
          <StepView />
          <AssistantChat />

          <div data-noprint="1" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 26 }}>
            {step > 1 ? (
              <HButton
                onClick={() => goStep(step - 1)}
                style={{ padding: '11px 18px', border: '1px solid var(--field-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                hover={{ background: 'var(--surface-4)' }}
              >← {STEPS[step - 2].title}</HButton>
            ) : null}
            {step < 8 ? (
              <HButton
                onClick={onNext}
                style={{ padding: '11px 18px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                hover={{ background: 'var(--pri-hover)' }}
              >{STEPS[step].title} →</HButton>
            ) : null}
          </div>
        </div>
      </main>

      {state.undoToast ? (
        <div data-noprint="1" style={{ position: 'fixed', left: '50%', bottom: 22, transform: 'translateX(-50%)', zIndex: 70, display: 'flex', gap: 10, alignItems: 'center', background: 'var(--ink)', color: 'var(--bg)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 26px rgba(0,0,0,.3)' }}>
          <span style={{ font: '600 12.5px Helvetica,Arial,sans-serif' }}>Silindi: {state.undoToast.label}</span>
          <HButton
            onClick={undoLast}
            style={{ flex: 'none', padding: '6px 12px', border: 'none', borderRadius: 7, background: 'var(--pri-bar)', color: 'var(--ink)', font: '700 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--pri-border)' }}
          >Geri al (Ctrl+Z)</HButton>
        </div>
      ) : null}

      <SettingsModal />
    </div>
  );
}
