// Vaka panosu: tüm çalışmaların durumu tek ekranda. Her kart "sıradaki adımı"
// gösterir ve tek tıkla oraya götürür; geciken aksiyonlar kartların altında,
// çalışmaya göre gruplu ve katlanabilir bir bölümde durur. Kullanıcının kendi
// çalışmaları örneklerden önce listelenir.

import React, { useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { stepsFor } from '../lib/defaults.js';
import { gapInfo, caseMaturity, confidenceScore, stepChecklist, isOverdue, trackingGapText } from '../lib/derive.js';

const VERIFIED_RC = ['dogrulandi', 'test-edildi', 'destekleniyor'];
const SAMPLE = k => k === 'ornek' || k === 'ornek2';

const TONE = {
  dogrulandi: 'ok', izleme: 'pri', uygulama: 'pri', analiz: 'pri', kanit: 'warn', taslak: 'mute', bos: 'mute'
};

function daysLate(due) {
  const d = new Date(due + 'T00:00:00');
  if (isNaN(d)) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

/** Kartın türetilmiş durumu ve sıradaki adım önerisi. */
function casePack(cc, lang, t) {
  const steps = stepsFor(lang);
  const g = gapInfo(cc.problem || {}, lang);
  const actions = (cc.actions || []).filter(a => (a.text || '').trim());
  const overdue = actions.filter(a => isOverdue(a));
  const rcs = (cc.rootCauses || []).filter(r => (r.text || '').trim());
  const checks = [1, 2, 3, 4, 5, 6, 7, 8].map(n => stepChecklist(cc, n, lang));
  const okSteps = checks.map((ck, i) => (ck.missing === 0 ? i + 1 : 0)).filter(Boolean);
  const empty = !((cc.problem || {}).statement || '').trim();

  let next;
  if (cc.mode === 'quick') {
    next = { step: null, label: t('Hızlı çözüme devam et', 'Continue the quick solve'), note: '' };
  } else if (overdue.length) {
    next = { step: 7, label: t('Geciken aksiyonları güncelle', 'Update overdue actions'), note: t('Adım 7 · ', 'Step 7 · ') + steps[6].title };
  } else {
    const n = checks.findIndex(ck => ck.missing > 0) + 1;
    next = n
      ? { step: n, label: empty ? t('Problemi tanımlayarak başla', 'Start by defining the problem') : t('Devam et: ', 'Continue: ') + steps[n - 1].title, note: t('Adım ', 'Step ') + n + ' · ' + checks[n - 1].missing + t(' ölçüt eksik', ' criteria missing') }
      : { step: 8, label: t('Raporu aç', 'Open the report'), note: t('Tüm adımların ölçütleri tamam', 'All steps meet their criteria') };
  }

  return {
    g, empty, next, okSteps, actions, overdue, rcs,
    maturity: caseMaturity(cc, lang),
    conf: confidenceScore(cc, lang),
    doneActions: actions.filter(a => a.status === 'tamam'),
    verifiedRcs: rcs.filter(r => VERIFIED_RC.includes(r.status || 'hipotez')),
    decisionSet: !!(((cc.decision || {}).choice) || '').trim(),
    trackText: (cc.tracking || []).length ? trackingGapText(cc, lang) : ''
  };
}

function Fact({ label, value, tone }) {
  return (
    <div className="pcx-dash-fact">
      <dt>{label}</dt>
      <dd className={tone ? 'is-' + tone : ''}>{value}</dd>
    </div>
  );
}

export default function Dashboard() {
  const { state, upd, ensureCoach, t, lang } = useStore();
  const steps = stepsFor(lang);
  const pct = v => (lang === 'en' ? v + '%' : '%' + v);
  const [overdueOpen, setOverdueOpen] = useState(false);

  const caseKeys = Object.keys(state.cases);
  const rank = k => (SAMPLE(k) ? (k === 'ornek' ? 1 : 2) : 0);
  caseKeys.sort((a, b) => rank(a) - rank(b));
  const packs = caseKeys.map(k => ({ key: k, c: state.cases[k], p: casePack(state.cases[k], lang, t) }));

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

  const showOverdue = () => {
    setOverdueOpen(true);
    setTimeout(() => { const el = document.getElementById('pcx-overdue'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);
  };

  return (
    <div data-dash="1" className="pcx-dash">
      <div className="pcx-dash-head">
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 className="pcx-display" style={{ margin: 0, fontSize: 30, lineHeight: 1.12, color: 'var(--ink)' }}>{t('Vaka Panosu', 'Case Dashboard')}</h1>
          <p className="pcx-dash-summary">
            {packs.length}{t(' çalışma', ' cases')}
            <span aria-hidden="true"> / </span>{totActive}{t(' uygulamada veya izlemede', ' implementing or tracking')}
            <span aria-hidden="true"> / </span>{totVerified}{t(' KPI ile doğrulandı', ' verified with KPI')}
            {totOverdue ? (
              <>
                <span aria-hidden="true"> / </span>
                <button type="button" className="pcx-dash-link is-alert" onClick={showOverdue}>{totOverdue}{t(' geciken aksiyon', ' overdue actions')}</button>
              </>
            ) : null}
          </p>
        </div>
        <button type="button" className="pcx-dash-btn" onClick={() => upd(n => { n.dashOpen = false; })}>{t('Çalışmaya dön', 'Back to case')}</button>
      </div>

      <div className="pcx-dash-grid">
        {packs.map(({ key, c: cc, p }) => {
          const active = state.activeCase === key;
          const tone = cc.mode === 'quick' ? 'pri' : (TONE[p.maturity.key] || 'mute');
          return (
            <article key={key} className={'pcx-dash-card' + (active ? ' is-active' : '')} aria-label={cc.name || key}>
              <header className="pcx-dash-card-head">
                <h2 className="pcx-dash-name" title={cc.name || key}>{cc.name || key}</h2>
                <span className={'pcx-dash-chip is-' + tone}>{cc.mode === 'quick' ? t('Hızlı çözüm', 'Quick solve') : p.maturity.label}</span>
              </header>
              <div className="pcx-dash-meta">
                {SAMPLE(key) ? t('Örnek çalışma', 'Example case') : t('Sizin çalışmanız', 'Your case')}
                {active ? t(' · şu an açık', ' · open now') : ''}
              </div>

              {cc.mode !== 'quick' && !p.empty ? (
                <div className="pcx-dash-steps" role="img" aria-label={t('8 adımdan ' + p.okSteps.length + ' adımın ölçütleri tamam', p.okSteps.length + ' of 8 steps meet their criteria')}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <span key={n} title={n + '. ' + steps[n - 1].title} className={p.okSteps.includes(n) ? 'is-ok' : (p.next.step === n ? 'is-next' : '')} />
                  ))}
                  <b>{p.okSteps.length}/8</b>
                </div>
              ) : null}

              <div className="pcx-dash-kpi">
                {cc.mode === 'quick' ? (
                  (cc.problem.statement || '').trim()
                    ? <span className="pcx-dash-clamp">{cc.problem.statement}</span>
                    : <span className="is-muted">{t('Sorun henüz yazılmadı.', 'No problem written yet.')}</span>
                ) : p.g.hasGap ? (
                  <>
                    <span className="is-muted">{cc.problem.kpiName || 'KPI'}</span>
                    <strong className={p.g.good ? 'is-ok' : 'is-alert'}>{p.g.kpiGapText}</strong>
                  </>
                ) : <span className="is-muted">{p.empty ? t('Henüz başlanmadı. İlk adımda hedef ile gerçekleşen arasındaki farkı yazacaksınız.', 'Not started yet. In the first step you will write down the gap between target and actual.') : t('KPI farkı girilmedi.', 'No KPI gap entered.')}</span>}
              </div>

              {!p.empty || cc.mode === 'quick' ? (
                <dl className="pcx-dash-facts">
                  <Fact
                    label={t('Aksiyonlar', 'Actions')}
                    value={p.actions.length ? p.doneActions.length + '/' + p.actions.length + (p.overdue.length ? t(', ' + p.overdue.length + ' gecikti', ', ' + p.overdue.length + ' overdue') : '') : t('Planlanmadı', 'Not planned')}
                    tone={p.overdue.length ? 'alert' : ''}
                  />
                  {cc.mode !== 'quick' ? (
                    <>
                      <Fact label={t('Kök neden', 'Root causes')} value={p.rcs.length ? p.verifiedRcs.length + '/' + p.rcs.length + t(' doğrulandı', ' verified') : t('Yazılmadı', 'Not written')} />
                      <Fact label={t('Karar', 'Decision')} value={p.decisionSet ? t('Verildi', 'Made') : t('Bekliyor', 'Pending')} />
                      <Fact label={t('Güven', 'Confidence')} value={pct(p.conf.total)} tone={p.conf.total >= 80 ? 'ok' : p.conf.total >= 50 ? '' : 'warn'} />
                    </>
                  ) : null}
                </dl>
              ) : null}
              {p.trackText ? <div className="pcx-dash-track">{p.trackText}</div> : null}

              <footer className="pcx-dash-card-foot">
                <button type="button" className="pcx-dash-cta" onClick={() => openCase(key, p.next.step)}>{p.next.label}</button>
                {p.next.note ? <span className="pcx-dash-note">{p.next.note}</span> : null}
              </footer>
            </article>
          );
        })}
      </div>

      {totOverdue > 0 ? (
        <section id="pcx-overdue" className="pcx-dash-overdue">
          <button type="button" className="pcx-dash-overdue-toggle" aria-expanded={overdueOpen} aria-controls="pcx-overdue-list" onClick={() => setOverdueOpen(o => !o)}>
            <span>{t('Geciken aksiyonlar', 'Overdue actions')} <span className="pcx-dash-count">{totOverdue}</span></span>
            <span aria-hidden="true" style={{ fontSize: 11, color: 'var(--muted)' }}>{overdueOpen ? '▲' : '▼'}</span>
          </button>
          {overdueOpen ? (
            <div id="pcx-overdue-list">
              {packs.filter(x => x.p.overdue.length).map(x => (
                <div key={x.key} className="pcx-dash-og">
                  <div className="pcx-dash-og-head">
                    <span>{x.c.name || x.key}</span>
                    <button type="button" className="pcx-dash-link" onClick={() => openCase(x.key, 7)}>{t('İzleme adımında aç', 'Open in tracking step')}</button>
                  </div>
                  <ul>
                    {x.p.overdue.map((a, i) => (
                      <li key={i}>
                        <span className="pcx-dash-og-text">{a.text}</span>
                        <span className="pcx-dash-og-owner">{(a.owner || '').trim() || t('Sorumlu yok', 'No owner')}</span>
                        <span className="pcx-dash-og-late">{t(daysLate(a.dueDate) + ' gün gecikti', daysLate(a.dueDate) + ' days late')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
