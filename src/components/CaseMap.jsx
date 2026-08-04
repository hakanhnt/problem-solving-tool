// Vaka Haritası görünümü: buildCaseMap çıktısını çizer. Düğümler HTML (metin
// sarma + erişilebilirlik için), kenarlar altta SVG bezier eğrileri.
// onNavigate verilirse düğüme tıklamak ilgili adıma götürür (paylaşımda kapalı).

import React from 'react';
import { buildCaseMap, MAP_COL_W, MAP_ROW_H, MAP_NODE_W } from '../lib/casemap.js';
import { mkT } from '../lib/i18n.js';

const TONES = {
  pri: { border: 'var(--pri-border-2)', bg: 'var(--surface)', ink: 'var(--ink)' },
  ok: { border: 'var(--ok-border)', bg: 'var(--ok-soft)', ink: 'var(--ok-ink)' },
  warn: { border: 'var(--warn-border)', bg: 'var(--warn-soft)', ink: 'var(--warn-ink)' },
  alert: { border: 'var(--alert-border)', bg: 'var(--alert-soft)', ink: 'var(--alert)' },
  muted: { border: 'var(--line-strong)', bg: 'var(--surface-4)', ink: 'var(--muted)' }
};

export default function CaseMap({ c, lang = 'tr', onNavigate }) {
  const t = mkT(lang);
  const m = buildCaseMap(c, lang);
  const byId = Object.fromEntries(m.nodes.map(n => [n.id, n]));
  const NODE_H = 56;

  const headers = [
    t('KPI', 'KPI'), t('İŞ SÜRÜCÜLERİ', 'BUSINESS DRIVERS'), t('BULGULAR', 'FINDINGS'),
    t('KÖK NEDENLER', 'ROOT CAUSES'), t('KARAR', 'DECISION'), t('AKSİYONLAR', 'ACTIONS'), t('İZLEME', 'TRACKING')
  ];

  const path = e => {
    const a = byId[e.from], b = byId[e.to];
    if (!a || !b) return null;
    const x1 = a.x + MAP_NODE_W, y1 = a.y + NODE_H / 2 + 26;
    const x2 = b.x, y2 = b.y + NODE_H / 2 + 26;
    const mx = (x1 + x2) / 2;
    return 'M ' + x1 + ' ' + y1 + ' C ' + mx + ' ' + y1 + ', ' + mx + ' ' + y2 + ', ' + x2 + ' ' + y2;
  };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', margin: '0 0 4px' }}>
        <div style={{ font: '700 15px Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{t('🕸 Vaka Haritası', '🕸 Case Map')}</div>
        <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
          {t('Girdiğiniz verilerden türetilir — ayrı bir çizim değildir. Kesik kenarlar yapısal, düz kenarlar sizin kurduğunuz bağlardır.', 'Derived from the data you entered — not a separate drawing. Dashed edges are structural; solid edges are links you created.')}
        </div>
      </div>
      <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: m.orphanCount ? 'var(--alert)' : 'var(--ok-ink)', margin: '0 0 10px' }}>
        {m.orphanCount
          ? t('⚠ ' + m.orphanCount + ' kopuk düğüm var (kırmızı çerçeveli) — zincire bağlayın ya da nedenini raporda açıklayın.', '⚠ ' + m.orphanCount + ' disconnected node(s) (red border) — link them into the chain or explain why in the report.')
          : t('✓ Zincirde kopukluk yok — her düğüm bağlantılı.', '✓ No breaks in the chain — every node is linked.')}
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: 6 }}>
        {/* Yazdırmada harita kâğıt genişliğine sığacak şekilde ölçeklenir (index.css @media print) */}
        <div data-casemap-fit="1" style={{ position: 'relative', width: m.w, minHeight: m.h + 30, '--pz': Math.min(1, 660 / m.w) }}>
          {/* Sütun başlıkları */}
          {headers.map((h, i) => (
            <div key={i} style={{ position: 'absolute', left: i * MAP_COL_W + 14, top: 0, width: MAP_NODE_W, font: '700 9.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.7px' }}>{h}</div>
          ))}
          {/* Kenarlar */}
          <svg width={m.w} height={m.h + 30} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }} aria-hidden="true">
            {m.edges.map((e, i) => {
              const d = path(e);
              return d ? (
                <path key={i} d={d} fill="none"
                  stroke={e.kind === 'main' ? 'var(--pri-border)' : 'var(--line-strong)'}
                  strokeWidth={e.kind === 'main' ? 1.8 : 1.2}
                  strokeDasharray={e.kind === 'main' ? 'none' : '4 4'} />
              ) : null;
            })}
          </svg>
          {/* Düğümler */}
          {m.nodes.map(n => {
            const tone = TONES[n.tone] || TONES.pri;
            const style = {
              position: 'absolute', left: n.x, top: n.y + 26, width: MAP_NODE_W, minHeight: NODE_H, boxSizing: 'border-box',
              background: tone.bg, border: (n.orphan ? '2px solid var(--alert)' : '1px solid ' + tone.border),
              borderRadius: 8, padding: '7px 9px', textAlign: 'left', font: 'inherit',
              cursor: onNavigate ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center'
            };
            const inner = (
              <>
                <span style={{ font: '600 10.5px/1.35 Helvetica,Arial,sans-serif', color: tone.ink, display: 'block' }}>{n.label}</span>
                {n.sub ? <span style={{ font: '10px/1.3 Helvetica,Arial,sans-serif', color: 'var(--muted)', display: 'block' }}>{n.sub}</span> : null}
                {n.orphan ? <span style={{ font: '700 9px Helvetica,Arial,sans-serif', color: 'var(--alert)', display: 'block' }}>{t('⚠ bağlantısız', '⚠ unlinked')}</span> : null}
              </>
            );
            return onNavigate ? (
              <button key={n.id} type="button" onClick={() => onNavigate(n.step)} style={style}
                title={t(n.ref + ' — ilgili adıma gitmek için tıklayın', n.ref + ' — click to open the related step')}>{inner}</button>
            ) : (
              <div key={n.id} style={style}>{inner}</div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, font: '10.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', verticalAlign: 'middle', marginRight: 4 }} />{t('doğrulanmış / tamam', 'verified / done')}</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', verticalAlign: 'middle', marginRight: 4 }} />{t('hipotez', 'hypothesis')}</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--surface)', border: '2px solid var(--alert)', verticalAlign: 'middle', marginRight: 4 }} />{t('bağlantısız (izlenebilirlik boşluğu)', 'unlinked (traceability gap)')}</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'var(--surface-4)', border: '1px solid var(--line-strong)', verticalAlign: 'middle', marginRight: 4 }} />{t('elendi / katkısız', 'eliminated / no contribution')}</span>
      </div>
    </div>
  );
}
