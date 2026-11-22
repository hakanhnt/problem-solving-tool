// Zihin Kontrolü içeriği: bu adımda en sık düşülen yanılgılar, panzehirleri ve
// ekibe sorulacak sorular. Adım araç şeridinde (StepToolbar) açılır; Adım 1-7.
// Renkler tema token'larından gelir. Yazdırmada görünmez.

import React from 'react';
import { useStore } from '../lib/store.jsx';
import { mindCheckFor } from '../lib/mindcheck.js';
import { useNarrow } from '../ui/primitives.jsx';

export function hasMindCheck(step, lang) {
  return !!mindCheckFor(step, lang);
}

export default function MindCheck() {
  const { step, t, lang } = useStore();
  const narrow = useNarrow();
  const m = mindCheckFor(step, lang);
  if (!m) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1.25fr 1fr', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {m.yanilgilar.map((y, i) => (
          <div key={i} style={{ border: '1px solid var(--line-2)', borderRadius: 8, padding: '11px 13px', background: 'var(--surface)' }}>
            <div style={{ font: '700 13px Helvetica,Arial,sans-serif', color: 'var(--alert)', margin: '0 0 4px' }}>{y.ad}</div>
            <div style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink-4)' }}>{y.aciklama}</div>
            <div style={{ font: '600 12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ok-ink)', background: 'var(--ok-soft)', borderRadius: 6, padding: '7px 9px', marginTop: 8 }}>
              {t('Panzehir: ', 'Antidote: ')}{y.panzehir}
            </div>
          </div>
        ))}
      </div>
      <div style={{ alignSelf: 'start' }}>
        <div style={{ font: '700 13px Helvetica,Arial,sans-serif', color: 'var(--ink-2)', margin: '0 0 8px' }}>
          {t('Ekibe sorulacak sorular', 'Questions to ask the team')}
          <span style={{ fontWeight: 400, color: 'var(--muted)' }}> ({m.yontem})</span>
        </div>
        <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {m.sorular.map((q, i) => (
            <li key={i} style={{ font: '13px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{q}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
