// Zihin Kontrolü paneli: adım başlığı ile Rehber paneli arasında, Adım 1-7'de.
// Renkler ürün spesifikasyonundan sabittir (tema değişkeni kullanılmaz);
// açık zemin + koyu metin iki temada da okunur. Yazdırmada görünmez.

import React from 'react';
import { useStore } from '../lib/store.jsx';
import { mindCheckFor } from '../lib/mindcheck.js';
import { HButton, useNarrow } from '../ui/primitives.jsx';

export default function MindCheck() {
  const { state, step, upd, t, lang } = useStore();
  const narrow = useNarrow();
  const m = mindCheckFor(step, lang);
  if (!m) return null;
  const open = !!state.mindOpen;

  return (
    <div data-noprint="1" style={{ background: '#fbf7f3', border: '1px solid #e5d9cd', borderRadius: 12, marginBottom: 18, overflow: 'hidden' }}>
      {/* Başlık şeridi */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#f5ece2', borderBottom: open ? '1px solid #e5d9cd' : 'none', padding: '11px 16px' }}>
        <div aria-hidden="true" style={{ flex: 'none', width: 22, height: 22, borderRadius: '50%', background: '#8c6a35', color: '#fff', font: '700 13px/22px Georgia,serif', textAlign: 'center' }}>!</div>
        <div style={{ flex: 1, minWidth: 0, font: '700 12.5px Helvetica,Arial,sans-serif', color: '#6d5527' }}>
          {t('Zihin Kontrolü · Bu adımda düşmeye en yatkın olduğunuz yanılgılar', "Mind Check · The biases you're most prone to at this step")}
        </div>
        <HButton
          onClick={() => upd(n => { n.mindOpen = !n.mindOpen; })}
          aria-expanded={open}
          aria-label={open ? t('Zihin Kontrolü panelini gizle', 'Hide the Mind Check panel') : t('Zihin Kontrolü panelini aç', 'Open the Mind Check panel')}
          style={{ flex: 'none', padding: '5px 12px', border: '1px solid #ddcdb8', borderRadius: 6, background: '#fff', color: '#8c6a35', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
          hover={{ background: '#f9f3ea' }}
        >{open ? t('Gizle', 'Hide') : t('Aç', 'Open')}</HButton>
      </div>

      {/* Gövde */}
      {open ? (
        <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1.25fr 1fr', gap: 16, padding: '14px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {m.yanilgilar.map((y, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #ecdfd0', borderRadius: 8, padding: '11px 13px' }}>
                <div style={{ font: '700 12.5px Helvetica,Arial,sans-serif', color: '#8c4a35', margin: '0 0 4px' }}>{y.ad}</div>
                <div style={{ font: '12px/1.55 Helvetica,Arial,sans-serif', color: '#6d6860' }}>{y.aciklama}</div>
                <div style={{ font: '600 12px/1.5 Helvetica,Arial,sans-serif', color: '#3d5a3d', background: '#eef4ee', borderRadius: 6, padding: '7px 9px', marginTop: 8 }}>
                  {t('Panzehir: ', 'Antidote: ')}{y.panzehir}
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', border: '1px solid #ecdfd0', borderRadius: 8, padding: '11px 13px', alignSelf: 'start' }}>
            <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: '#8a857c', letterSpacing: '.7px', margin: '0 0 8px' }}>
              {t('EKİBE SORULACAK SORULAR', 'QUESTIONS TO ASK THE TEAM')} · {m.yontem.toLocaleUpperCase(lang === 'en' ? 'en-US' : 'tr-TR')}
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {m.sorular.map((q, i) => (
                <li key={i} style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: '#4a453e' }}>{q}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
