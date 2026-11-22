// Adım başlığı özeti: bu adım ne için var, tamamlanmış sayılması için ne gerekir,
// kaç ölçüt eksik ve sonraki adıma geçmeye hazır mısınız.

import React from 'react';
import { useStore } from '../lib/store.jsx';
import { stepsFor } from '../lib/defaults.js';
import { stepChecklist, traceability } from '../lib/derive.js';

export default function StepHeader({ openSignal }) {
  const { c, step, t, lang } = useStore();
  const STEPS = stepsFor(lang);
  const [open, setOpen] = React.useState(false);
  const boxRef = React.useRef(null);
  const ck = stepChecklist(c, step, lang);

  // Adım değişince ölçüt listesi kapanır.
  React.useEffect(() => { setOpen(false); }, [step]);

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

  const gaps = step === 8 ? issues.length : 0;
  const chipTone = ready && !gaps ? 'ok' : 'warn';
  const chipText = ready
    ? (gaps ? t(gaps + ' izlenebilirlik boşluğu', gaps + ' traceability gap(s)') : t('✓ Ölçütler tamam', '✓ Criteria met'))
    : t(ck.missing + ' ölçüt eksik', ck.missing + ' criteria missing');

  return (
    <div data-noprint="1" style={{ margin: '0 0 18px' }}>
      <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t('Adım ', 'Step ')}{step} / 8</div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', margin: '6px 0 6px' }}>
        <h1 className="pcx-display" style={{ margin: 0, fontSize: 30, lineHeight: 1.12, color: 'var(--ink)' }}>{STEPS[step - 1].title}</h1>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open} aria-controls="pcx-criteria"
          title={t('Tamamlanma ölçütlerini göster', 'Show completion criteria')}
          className={'pcx-status is-' + chipTone}
        >{chipText}<span aria-hidden="true" style={{ marginLeft: 6, fontSize: 10 }}>{open ? '▲' : '▼'}</span></button>
      </div>
      <p style={{ font: '14.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--ink-4)', margin: 0, maxWidth: 640 }}>{STEPS[step - 1].desc}</p>

      <div
        ref={boxRef} tabIndex={-1} id="pcx-criteria"
        aria-label={t('Adım ' + step + ' tamamlanma durumu', 'Step ' + step + ' completion status')}
        style={{ outline: 'none' }}
      >
        {open ? (
          <ul style={{ margin: '12px 0 0', padding: '12px 14px', border: '1px solid var(--line-2)', borderRadius: 10, background: 'var(--surface-2)', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
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
