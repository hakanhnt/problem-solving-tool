// Adım araç şeridi: Rehber, Zihin Kontrolü ve Sorular tek satırda düğme olarak
// durur; tıklanan açılır, diğerleri kapalı kalır. Böylece kullanıcının
// dolduracağı form ilk ekranda görünür. Rehber kendiliğinden çalışmaya
// başladığında (boş adım) paneli otomatik açılır — öneriler gözden kaçmaz.
// Açık sekme tercihi tarayıcıda hatırlanır.

import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { Spinner } from '../ui/primitives.jsx';
import CoachPanel from './CoachPanel.jsx';
import MindCheck, { hasMindCheck } from './MindCheck.jsx';
import { questionsFor as Q1 } from '../steps/Step1Problem.jsx';
import { QUESTIONS as Q2 } from '../steps/Step2Drivers.jsx';
import { QUESTIONS as Q3 } from '../steps/Step3Analysis.jsx';
import { questionsFor as Q4 } from '../steps/Step4Findings.jsx';
import { questionsFor as Q5 } from '../steps/Step5RootCause.jsx';
import { questionsFor as Q6 } from '../steps/Step6Countermeasures.jsx';
import { QUESTIONS as Q7 } from '../steps/Step7Tracking.jsx';

const QUESTIONS = { 1: Q1, 2: Q2, 3: Q3, 4: Q4, 5: Q5, 6: Q6, 7: Q7 };
const TAB_KEY = 'pcx_helper_tab';

function Pill({ id, open, onToggle, children, tone }) {
  return (
    <button
      type="button" id={'pcx-tab-' + id}
      aria-expanded={open} aria-controls="pcx-helper-panel"
      onClick={onToggle}
      className={'pcx-pill' + (open ? ' is-open' : '') + (tone ? ' is-' + tone : '')}
    >{children}</button>
  );
}

export default function StepToolbar() {
  const { c, step, t, lang } = useStore();
  const [tab, setTab] = useState(() => { try { return localStorage.getItem(TAB_KEY) || ''; } catch (e) { return ''; } });
  const choose = next => {
    setTab(next);
    try { localStorage.setItem(TAB_KEY, next); } catch (e) { /* gizli mod */ }
  };

  const aiReady = (c.problem.statement || '').trim().length > 0;
  const coachShown = step >= 1 && step <= 6 && (aiReady || step >= 2);
  const ck = (c.coach && c.coach[step]) || null;
  const status = ck ? ck.status : 'idle';
  const count = status === 'done' ? (ck.items || []).length : 0;
  const questions = QUESTIONS[step] ? QUESTIONS[step](t) : null;
  const mind = hasMindCheck(step, lang);

  // Rehber kendiliğinden çalışmaya başlarsa (boş adım) paneli aç.
  useEffect(() => {
    if (status === 'busy' && coachShown) setTab('coach');
  }, [status, step, coachShown]);

  const available = { coach: coachShown, mind, questions: !!questions };
  const active = available[tab] ? tab : '';
  if (!coachShown && !mind && !questions) return null;

  const toggle = id => () => choose(active === id ? '' : id);

  let coachLabel = t('Rehber', 'Coach');
  if (status === 'busy') coachLabel = t('Rehber çalışıyor', 'Coach is working');
  else if (count) coachLabel = t('Rehber: ' + count + ' öneri', 'Coach: ' + count + ' suggestions');
  else if (status === 'error') coachLabel = t('Rehber: tekrar deneyin', 'Coach: try again');

  return (
    <div data-noprint="1" style={{ margin: '0 0 24px' }}>
      <div role="group" aria-label={t('Bu adım için yardım', 'Help for this step')} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {coachShown ? (
          <Pill id="coach" open={active === 'coach'} onToggle={toggle('coach')} tone={count ? 'pri' : ''}>
            {status === 'busy' ? <Spinner size={12} border={2} /> : <span aria-hidden="true" className="pcx-pill-mark">✦</span>}
            {coachLabel}
          </Pill>
        ) : null}
        {mind ? <Pill id="mind" open={active === 'mind'} onToggle={toggle('mind')}>{t('Zihin Kontrolü', 'Mind Check')}</Pill> : null}
        {questions ? <Pill id="questions" open={active === 'questions'} onToggle={toggle('questions')}>{t('Sorulacak sorular', 'Questions to ask')}</Pill> : null}
      </div>

      {active ? (
        <div id="pcx-helper-panel" role="region" aria-labelledby={'pcx-tab-' + active} className="pcx-helper-panel">
          {active === 'coach' ? <CoachPanel /> : null}
          {active === 'mind' ? <MindCheck /> : null}
          {active === 'questions' ? (
            <>
              <div style={{ font: '13px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 8px' }}>{t('Kendinize ve paydaşlarınıza sorun:', 'Ask yourself and your stakeholders:')}</div>
              <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {questions.map((q, i) => <li key={i} style={{ font: '13.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink-2)' }}>{q}</li>)}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
