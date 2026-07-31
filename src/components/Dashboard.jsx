// Vaka panosu: tüm çalışmaların durumu tek ekranda — olgunluk, güven,
// KPI farkı, aksiyon ilerlemesi ve geciken işler. Karta tıklayınca çalışma açılır.

import React from 'react';
import { useStore } from '../lib/store.jsx';
import { STEPS } from '../lib/defaults.js';
import { gapInfo, caseMaturity, confidenceScore, stepChecklist, isOverdue, trackingGapText } from '../lib/derive.js';
import { HButton } from '../ui/primitives.jsx';

const VERIFIED_RC = ['dogrulandi', 'test-edildi', 'destekleniyor'];

const MATURITY_STYLE = {
  dogrulandi: { ink: 'var(--ok-ink)', bg: 'var(--ok-soft)', border: 'var(--ok-border)' },
  izleme: { ink: 'var(--pri-ink)', bg: 'var(--pri-soft)', border: 'var(--pri-border-5)' },
  uygulama: { ink: 'var(--pri-ink)', bg: 'var(--pri-soft)', border: 'var(--pri-border-5)' },
  analiz: { ink: 'var(--pri-ink)', bg: 'var(--pri-soft)', border: 'var(--pri-border-5)' },
  kanit: { ink: 'var(--warn-ink)', bg: 'var(--warn-soft)', border: 'var(--warn-border)' },
  taslak: { ink: 'var(--muted)', bg: 'var(--surface-4)', border: 'var(--line-strong)' },
  bos: { ink: 'var(--muted)', bg: 'var(--surface-4)', border: 'var(--line-strong)' }
};

/** Kart ve pano özetleri için bir çalışmanın türetilmiş durumu. */
function casePack(cc) {
  const g = gapInfo(cc.problem || {});
  const actions = (cc.actions || []).filter(a => (a.text || '').trim());
  const overdue = actions.filter(a => isOverdue(a));
  const rcs = (cc.rootCauses || []).filter(r => (r.text || '').trim());
  return {
    g,
    maturity: caseMaturity(cc),
    conf: confidenceScore(cc),
    okSteps: [1, 2, 3, 4, 5, 6, 7, 8].filter(n => stepChecklist(cc, n).missing === 0),
    actions,
    overdue,
    doneActions: actions.filter(a => a.status === 'tamam'),
    rcs,
    verifiedRcs: rcs.filter(r => VERIFIED_RC.includes(r.status || 'hipotez')),
    decisionSet: !!(((cc.decision || {}).choice) || '').trim(),
    trackText: (cc.tracking || []).length ? trackingGapText(cc) : ''
  };
}

function Tile({ label, value, ink }) {
  return (
    <div style={{ flex: '1 1 130px', minWidth: 130, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ font: '700 24px/1.1 Helvetica,Arial,sans-serif', color: ink || 'var(--ink)' }}>{value}</div>
      <div style={{ font: '600 11px/1.4 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 3 }}>{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { state, upd, ensureCoach } = useStore();

  const caseKeys = Object.keys(state.cases);
  caseKeys.sort((a, b) => (a === 'ornek' ? -1 : b === 'ornek' ? 1 : 0));
  const packs = caseKeys.map(k => ({ key: k, c: state.cases[k], p: casePack(state.cases[k]) }));

  const totOverdue = packs.reduce((n, x) => n + x.p.overdue.length, 0);
  const totVerified = packs.filter(x => x.p.maturity.key === 'dogrulandi').length;
  const totActive = packs.filter(x => ['uygulama', 'izleme'].includes(x.p.maturity.key)).length;

  const openCase = (k, step) => {
    upd(n => {
      n.activeCase = k;
      if (step) n.step = step;
      n.dashOpen = false;
    });
    setTimeout(() => ensureCoach(), 60);
  };

  return (
    <div data-dash="1" style={{ maxWidth: 1080, margin: '0 auto', padding: '30px 32px 70px' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 6px' }}>
        <h1 style={{ flex: 1, minWidth: 220, margin: 0, font: '700 24px/1.2 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>📊 Vaka Panosu</h1>
        <HButton
          onClick={() => upd(n => { n.dashOpen = false; })}
          style={{ flex: 'none', padding: '9px 14px', border: '1px solid var(--field-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
          hover={{ background: 'var(--surface-4)' }}
        >← Çalışmaya dön</HButton>
      </div>
      <div style={{ font: '13px/1.6 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 18px' }}>
        Tüm çalışmalarınızın metodolojik durumu tek ekranda. Bir karta tıklayarak o çalışmayı açabilirsiniz.
      </div>

      {/* Özet kutucukları */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '0 0 16px' }}>
        <Tile label="Toplam çalışma" value={packs.length} />
        <Tile label="Uygulama / izlemede" value={totActive} ink="var(--pri)" />
        <Tile label="KPI ile doğrulanan" value={totVerified} ink={totVerified ? 'var(--ok-ink)' : 'var(--ink)'} />
        <Tile label="Geciken aksiyon" value={totOverdue} ink={totOverdue ? 'var(--alert)' : 'var(--ok-ink)'} />
      </div>

      {/* Geciken aksiyonlar — vakalar arası tek liste */}
      {totOverdue > 0 ? (
        <div style={{ background: 'var(--alert-soft-2)', border: '1px solid var(--alert-border)', borderRadius: 10, padding: '13px 16px', margin: '0 0 18px' }}>
          <div style={{ font: '700 11.5px Helvetica,Arial,sans-serif', color: 'var(--alert)', letterSpacing: '.5px', margin: '0 0 8px' }}>⏰ GECİKEN AKSİYONLAR</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {packs.flatMap(x => x.p.overdue.map((a, i) => (
              <button
                key={x.key + '-' + i} type="button"
                onClick={() => openCase(x.key, 7)}
                title={'"' + (x.c.name || x.key) + '" çalışmasında izleme adımını aç'}
                style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', textAlign: 'left', width: '100%', border: 'none', background: 'transparent', padding: '4px 2px', borderRadius: 6, cursor: 'pointer', font: 'inherit' }}
              >
                <span style={{ flex: 'none', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--pri)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.c.name || x.key}</span>
                <span style={{ flex: '1 1 240px', minWidth: 0, font: '12px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{a.text}</span>
                <span style={{ flex: 'none', font: '11px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{(a.owner || '').trim() || 'sorumlu yok'}</span>
                <span style={{ flex: 'none', font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--alert)' }}>{a.dueDate} ⏰</span>
              </button>
            )))}
          </div>
        </div>
      ) : null}

      {/* Vaka kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {packs.map(({ key, c: cc, p }) => {
          const ms = MATURITY_STYLE[p.maturity.key] || MATURITY_STYLE.taslak;
          const active = state.activeCase === key;
          return (
            <button
              key={key} type="button"
              onClick={() => openCase(key)}
              aria-label={'Çalışmayı aç: ' + (cc.name || key)}
              style={{
                textAlign: 'left', font: 'inherit', cursor: 'pointer',
                background: 'var(--surface)', border: '1px solid ' + (active ? 'var(--pri-border)' : 'var(--line)'),
                borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 9
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0, font: '700 14px/1.3 Helvetica,Arial,sans-serif', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cc.name || key}</div>
                <span style={{ flex: 'none', font: '600 10px Helvetica,Arial,sans-serif', color: ms.ink, background: ms.bg, border: '1px solid ' + ms.border, borderRadius: 20, padding: '3px 8px' }}>{p.maturity.label}</span>
              </div>

              {/* 8 adımlık mini ilerleme */}
              <div style={{ display: 'flex', gap: 3 }} role="img" aria-label={'8 adımdan ' + p.okSteps.length + ' adımın ölçütleri tamam'}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <div key={n} title={n + '. ' + STEPS[n - 1].title} style={{ flex: 1, height: 4, borderRadius: 2, background: p.okSteps.includes(n) ? 'var(--ok)' : 'var(--line)' }} />
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>
                {p.g.hasGap ? (
                  <div>
                    <strong>{(cc.problem.kpiName || 'KPI')}:</strong>{' '}
                    <span style={{ color: p.g.good ? 'var(--ok-ink)' : 'var(--alert)', fontWeight: 700 }}>{p.g.kpiGapText}</span>
                  </div>
                ) : <div style={{ color: 'var(--muted)' }}>KPI farkı girilmemiş.</div>}
                {p.trackText ? <div style={{ color: 'var(--muted)' }}>{p.trackText}</div> : null}
                <div>
                  Aksiyon: {p.actions.length ? p.doneActions.length + '/' + p.actions.length + ' tamam' : 'planlanmadı'}
                  {p.overdue.length ? <span style={{ color: 'var(--alert)', fontWeight: 700 }}> · {p.overdue.length} gecikti ⏰</span> : null}
                </div>
                <div style={{ color: 'var(--muted)' }}>
                  Kök neden: {p.rcs.length ? p.verifiedRcs.length + '/' + p.rcs.length + ' doğrulanmış' : 'yazılmamış'}
                  {' · '}Karar: {p.decisionSet ? 'verildi' : 'bekliyor'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 'auto', paddingTop: 2 }}>
                <span style={{
                  flex: 'none', font: '700 10px Helvetica,Arial,sans-serif', borderRadius: 10, padding: '2px 7px',
                  color: p.conf.total >= 80 ? 'var(--ok-ink)' : p.conf.total >= 50 ? 'var(--pri-ink)' : 'var(--warn-ink)',
                  background: p.conf.total >= 80 ? 'var(--ok-soft)' : p.conf.total >= 50 ? 'var(--pri-soft)' : 'var(--warn-soft)',
                  border: '1px solid ' + (p.conf.total >= 80 ? 'var(--ok-border)' : p.conf.total >= 50 ? 'var(--pri-border-5)' : 'var(--warn-border)')
                }}>Güven: %{p.conf.total}</span>
                <span style={{ marginLeft: 'auto', font: '600 11.5px Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>{active ? 'Açık çalışma →' : 'Aç →'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
