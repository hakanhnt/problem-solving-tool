import React, { useState, useEffect } from 'react';
import { useStore } from './lib/store.jsx';
import { parseShareHash } from './lib/share.js';
import SharedView from './components/SharedView.jsx';
import { stepsFor } from './lib/defaults.js';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import CoachPanel from './components/CoachPanel.jsx';
import StepHeader from './components/StepHeader.jsx';
import MindCheck from './components/MindCheck.jsx';
import AssistantChat from './components/AssistantChat.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import HelpChat from './components/HelpChat.jsx';
import Step1Problem from './steps/Step1Problem.jsx';
import Step2Drivers from './steps/Step2Drivers.jsx';
import Step3Analysis from './steps/Step3Analysis.jsx';
import Step4Findings from './steps/Step4Findings.jsx';
import Step5RootCause from './steps/Step5RootCause.jsx';
import Step6Countermeasures from './steps/Step6Countermeasures.jsx';
import Step7Tracking from './steps/Step7Tracking.jsx';
import Step8Report from './steps/Step8Report.jsx';
import { stepChecklist } from './lib/derive.js';
import { HButton, useNarrow } from './ui/primitives.jsx';
import { LogoMark, Wordmark } from './ui/Logo.jsx';

const STEP_VIEWS = [Step1Problem, Step2Drivers, Step3Analysis, Step4Findings, Step5RootCause, Step6Countermeasures, Step7Tracking, Step8Report];

export default function App() {
  const { state, c, step, mainRef, goStep, undoLast, t, lang } = useStore();
  const STEPS = stepsFor(lang);
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
  const missing = stepChecklist(c, step).missing;
  // Sayaç artınca StepHeader eksik listesini açar ve odağı oraya taşır.
  const [showMissing, setShowMissing] = useState(0);

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
      alert(t('Devam etmeden önce problem ifadenizi yazın — rehber sonraki adımlarda sizi bu tanıma göre yönlendirecek.', 'Write your problem statement before continuing — the coach will guide you by this definition in the next steps.'));
      return;
    }
    const lists = { 2: c.drivers, 3: c.driverAnalysis, 4: c.findings, 5: c.rootCauses };
    const unv = (lists[step] || []).filter(x => x && x.src === 'yz' && !x.verified).length;
    if (unv > 0 && !confirm(t(unv + ' YZ önerisi henüz doğrulanmadı (turuncu rozetli kayıtlar). Önerileri işi yapanlarla ve veriyle doğrulamadan ilerlemek metodolojiye aykırıdır.\n\nYine de devam edilsin mi?', unv + ' AI suggestion(s) not yet verified (orange-badged records). Moving on without verifying suggestions with the people doing the work and with data goes against the methodology.\n\nContinue anyway?'))) return;
    goStep(step + 1);
  };

  return (
    <div data-app-root="1" style={{ display: 'flex', flexDirection: narrow ? 'column' : 'row', height: '100vh', overflow: 'hidden' }}>
      {narrow ? (
        <div data-noprint="1" style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--line-strong)' }}>
          <HButton
            onClick={() => setDrawer(true)}
            aria-label={t('Menüyü aç', 'Open menu')}
            style={{ flex: 'none', width: 38, height: 38, border: '1px solid var(--field-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-3)', font: '18px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--surface-4)' }}
          >☰</HButton>
          <LogoMark size={30} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', minWidth: 0 }}>
              <Wordmark size={13.5} />
              <span style={{ font: '13px/1.3 Helvetica,Arial,sans-serif', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {STEPS[step - 1].title}</span>
            </div>
            <div style={{ font: '10.5px/1.3 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t('Adım ', 'Step ')}{step}/8 · {c.name || t('Çalışma', 'Case')}</div>
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

      {state.dashOpen ? (
        <main data-main="1" style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
          <Dashboard />
        </main>
      ) : (
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <main ref={mainRef} data-main="1" style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', padding: narrow ? '20px 16px 90px' : '34px 44px 90px' }}>
          {/* Adım değişimi ve kayıt durumu ekran okuyucuya duyurulur */}
          <div className="pcx-sr-only" role="status" aria-live="polite">
            {t('Adım ', 'Step ') + step + ' / 8: ' + STEPS[step - 1].title + '. '}
            {missing > 0 ? missing + t(' tamamlanma ölçütü eksik.', ' completion criteria missing.') : t('Bu adımın ölçütleri tamam.', "This step's criteria are met.")}
            {state.saveError ? t(' Uyarı: değişiklikler kaydedilemedi.', ' Warning: changes could not be saved.') : ''}
          </div>

          <StepHeader openSignal={showMissing} />

          <MindCheck />
          <CoachPanel />
          <StepView />
          <AssistantChat />
        </div>
      </main>

      {/* Alt eylem çubuğu — uzun formlarda gezinme ve kaydetme durumu her zaman erişilebilir */}
      <div data-noprint="1" style={{
        flex: 'none', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        padding: narrow ? '10px 14px' : '10px 24px',
        borderTop: '1px solid var(--line-strong)', background: 'var(--surface)'
      }}>
        {step > 1 ? (
          <HButton
            onClick={() => goStep(step - 1)}
            aria-label={t('Önceki adım: ', 'Previous step: ') + STEPS[step - 2].title}
            style={{ flex: 'none', padding: '9px 14px', border: '1px solid var(--field-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--surface-4)' }}
          >← {narrow ? t('Önceki', 'Previous') : STEPS[step - 2].title}</HButton>
        ) : null}

        <div style={{ flex: 1, minWidth: 120, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ font: '11.5px/1.4 Helvetica,Arial,sans-serif', color: state.saveError ? 'var(--alert)' : 'var(--muted)' }}>
            {state.saveError
              ? t('⚠ Kaydedilemedi', '⚠ Not saved')
              : (missing > 0 ? missing + t(' ölçüt eksik · otomatik kaydedildi', ' criteria missing · autosaved') : t('Bu adım tamam · otomatik kaydedildi', 'This step is complete · autosaved'))}
          </span>
          {missing > 0 ? (
            <HButton
              onClick={() => setShowMissing(n => n + 1)}
              style={{ flex: 'none', padding: '6px 11px', border: '1px solid var(--warn-border)', borderRadius: 7, background: 'var(--warn-soft)', color: 'var(--warn-ink)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={{ background: 'var(--warn-soft-2)' }}
            >{t('Eksikleri göster', 'Show missing')}</HButton>
          ) : null}
        </div>

        {step < 8 ? (
          <HButton
            onClick={onNext}
            aria-label={t('Sonraki adım: ', 'Next step: ') + STEPS[step].title}
            style={{ flex: 'none', padding: '9px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--pri-hover)' }}
          >{narrow ? t('Sonraki', 'Next') : STEPS[step].title} →</HButton>
        ) : null}
      </div>
      </div>
      )}

      {state.undoToast ? (
        <div data-noprint="1" style={{ position: 'fixed', left: '50%', bottom: 22, transform: 'translateX(-50%)', zIndex: 70, display: 'flex', gap: 10, alignItems: 'center', background: 'var(--ink)', color: 'var(--bg)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 26px rgba(0,0,0,.3)' }}>
          <span style={{ font: '600 12.5px Helvetica,Arial,sans-serif' }}>{t('Silindi: ', 'Deleted: ')}{state.undoToast.label}</span>
          <HButton
            onClick={undoLast}
            style={{ flex: 'none', padding: '6px 12px', border: 'none', borderRadius: 7, background: 'var(--pri-bar)', color: 'var(--ink)', font: '700 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--pri-border)' }}
          >{t('Geri al (Ctrl+Z)', 'Undo (Ctrl+Z)')}</HButton>
        </div>
      ) : null}

      <HelpChat />
      <SettingsModal />
    </div>
  );
}
