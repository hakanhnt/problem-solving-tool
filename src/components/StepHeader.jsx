// Adım başlığı özeti: bu adım ne için var, tamamlanmış sayılması için ne gerekir,
// kaç ölçüt eksik ve sonraki adıma geçmeye hazır mısınız.

import React from 'react';
import { useStore } from '../lib/store.jsx';
import { stepsFor } from '../lib/defaults.js';
import { stepChecklist, traceability } from '../lib/derive.js';
import { HButton } from '../ui/primitives.jsx';

export default function StepHeader({ openSignal }) {
  const { c, step, t, lang } = useStore();
  const STEPS = stepsFor(lang);
  const [open, setOpen] = React.useState(false);
  const boxRef = React.useRef(null);
  const ck = stepChecklist(c, step, lang);

  // Alt çubuktaki "Eksikleri göster" düğmesi bu paneli açıp odağı buraya taşır.
  React.useEffect(() => {
    if (!openSignal) return;
    setOpen(true);
    if (boxRef.current) {
      boxRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      boxRef.current.focus();
    }
  }, [openSignal]);
  const issues = step === 8 ? traceability(c, lang).issues : [];
  const ready = ck.missing === 0;

  return (
    <div data-noprint="1" style={{ margin: '0 0 20px' }}>
      <div style={{ font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '1px' }}>
        {t('ADIM ', 'STEP ')}{step} / 8 · {c.name || t('Çalışma', 'Case')}
      </div>
      <h1 style={{ font: '700 26px/1.25 Helvetica,Arial,sans-serif', margin: '8px 0 6px', color: 'var(--ink)' }}>{STEPS[step - 1].title}</h1>
      <p style={{ font: '14px/1.6 Helvetica,Arial,sans-serif', color: 'var(--ink-4)', margin: '0 0 12px', maxWidth: 640 }}>{STEPS[step - 1].desc}</p>

      <div
        ref={boxRef} tabIndex={-1}
        aria-label={t('Adım ' + step + ' tamamlanma durumu', 'Step ' + step + ' completion status')}
        style={{
          border: '1px solid ' + (ready ? 'var(--ok-border)' : 'var(--line-2)'),
          background: ready ? 'var(--ok-soft)' : 'var(--surface-2)',
          borderRadius: 10, padding: '10px 14px'
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220, font: '600 12.5px/1.5 Helvetica,Arial,sans-serif', color: ready ? 'var(--ok-ink)' : 'var(--ink-3)' }}>
            {ready
              ? t('✓ Bu adımın tamamlanma ölçütleri karşılandı — sonraki adıma geçebilirsiniz.', "✓ This step's completion criteria are met — you can move on to the next step.")
              : ck.missing + t(' ölçüt eksik. Adımı tamamlanmış saymak için neyin gerektiğini görün.', ' criteria missing. See what is needed to consider this step complete.')}
            {step === 8 && issues.length
              ? <span style={{ color: 'var(--warn-ink)' }}>{t(' · Çalışmada ' + issues.length + ' izlenebilirlik boşluğu var.', ' · The case has ' + issues.length + ' traceability gap(s).')}</span>
              : null}
          </div>
          <HButton
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            style={{ flex: 'none', padding: '6px 12px', border: '1px solid var(--field-border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--surface-4)' }}
          >{open ? t('Gizle', 'Hide') : t('Tamamlanma ölçütleri', 'Completion criteria')}</HButton>
        </div>

        {open ? (
          <ul style={{ margin: '10px 0 0', padding: '0 0 0 4px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {ck.items.map((it, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: it.ok ? 'var(--ok-ink)' : 'var(--warn-ink)' }}>
                <span aria-hidden="true" style={{ flex: 'none', width: 16, height: 16, borderRadius: '50%', textAlign: 'center', font: '700 10px/16px Helvetica,Arial,sans-serif', background: it.ok ? 'var(--ok-soft)' : 'var(--warn-soft)', border: '1px solid ' + (it.ok ? 'var(--ok-border)' : 'var(--warn-border)') }}>{it.ok ? '✓' : '!'}</span>
                <span>{it.label}<span style={{ color: 'var(--muted)' }}> — {it.ok ? t('tamam', 'met') : t('eksik', 'missing')}</span></span>
              </li>
            ))}
            {step === 8 && issues.length ? issues.map((is, i) => (
              <li key={'i' + i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)' }}>
                <span aria-hidden="true" style={{ flex: 'none', width: 16, height: 16, borderRadius: '50%', textAlign: 'center', font: '700 10px/16px Helvetica,Arial,sans-serif', background: 'var(--warn-soft)', border: '1px solid var(--warn-border)' }}>!</span>
                <span>{is.text}</span>
              </li>
            )) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
