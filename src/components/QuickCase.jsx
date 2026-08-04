// Hızlı Çözüm modu: 15-20 dakikalık sorunlar (low-hanging fruit) için tek ekran.
// Aynı veri modelini kullanır — tam akışa terfi ettirildiğinde girilenler kayıpsız taşınır.

import React from 'react';
import { useStore } from '../lib/store.jsx';
import { triageAdvice } from '../lib/derive.js';
import { Card, CardHead, MethodBox, HButton, S } from '../ui/primitives.jsx';

const field = {
  width: '100%', boxSizing: 'border-box', padding: '9px 11px',
  border: '1px solid var(--field-border)', borderRadius: 6,
  font: '13px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink)',
  background: 'var(--surface)', outline: 'none'
};
const lbl = { display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' };

export default function QuickCase() {
  const { c, updC, upd, t, lang } = useStore();

  const act = (c.actions || [])[0] || {};
  const setAct = (k, v) => updC(cc => {
    if (!cc.actions.length) cc.actions.push({ text: '', owner: '', startDate: '', dueDate: '', due: '', etki: '', efor: '', status: 'bekliyor', rcIdx: '', findingIdx: '', successCriteria: '', evidence: '', delayReason: '', priority: '' });
    cc.actions[0][k] = v;
  });
  const setWhy = (i, v) => updC(cc => { cc.whys[i] = v; });
  const setDriver = v => updC(cc => {
    if (!cc.drivers.length) cc.drivers.push({ name: '', note: '' });
    cc.drivers[0].name = v;
  });

  const promote = () => {
    if (!confirm(t('Bu çalışma 8 adımlık tam akışa geçirilecek. Girdiğiniz tanım, sürücü, nedenler ve önlem tam akışın ilgili adımlarında aynen görünür. Devam edilsin mi?', 'This case will be promoted to the 8-step full flow. Your definition, driver, whys and countermeasure will appear unchanged in the corresponding steps. Continue?'))) return;
    upd(n => { n.cases[n.activeCase].mode = 'full'; n.step = 1; });
  };

  const adv = triageAdvice(c.triage, lang);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '30px 32px 70px' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 4px' }}>
        <h1 style={{ flex: 1, minWidth: 220, margin: 0, font: '700 22px/1.25 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>⚡ {c.name || t('Hızlı Çözüm', 'Quick Solve')}</h1>
        <span style={{ flex: 'none', font: '600 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)', background: 'var(--pri-soft)', border: '1px solid var(--pri-border-5)', borderRadius: 20, padding: '3px 9px' }}>{t('Hızlı çözüm modu', 'Quick solve mode')}</span>
      </div>
      <div style={{ font: '13px/1.6 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 16px' }}>
        {t('Kısa sürede kök nedeni bulunabilecek sorunlar için tek ekran: tanımlayın, birkaç "neden" sorun, önlemi ve sorumluyu yazın. Sorun beklediğinizden derinse tam akışa terfi ettirin.', 'One screen for problems whose root cause can be found quickly: define it, ask a few whys, write the countermeasure and its owner. If the problem runs deeper than expected, promote it to the full flow.')}
      </div>

      {adv ? (
        <div style={{ background: 'var(--surface-4)', border: '1px solid var(--line-strong)', borderRadius: 8, padding: '9px 12px', margin: '0 0 14px', font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>
          <strong>{t('Triyaj: ', 'Triage: ')}</strong>{adv.label}
        </div>
      ) : null}

      <Card>
        <CardHead title={t('1 · Sorun ne?', '1 · What is the problem?')} sub={t('Ne oldu, nerede, ne kadar? Ölçülebilir yazın.', 'What happened, where, how much? Make it measurable.')} />
        <textarea
          className="pcx-field" rows={3} value={c.problem.statement}
          onChange={e => updC(cc => { cc.problem.statement = e.target.value; })}
          placeholder={t('Örn: X mağazasında NOS ürün reyonda yok; depoda 40 adet stok görünüyor.', 'E.g., NOS product missing from the shelf in store X; system shows 40 units in the back room.')}
          style={{ ...field, resize: 'vertical' }}
        />
      </Card>

      <Card>
        <CardHead title={t('2 · Sorunu süren etken', '2 · What drives it')} sub={t('Hangi süreç ya da etken bu sonucu üretiyor? İşi yapana sorun.', 'Which process or factor produces this outcome? Ask the person doing the work.')} />
        <input
          className="pcx-field" value={(c.drivers[0] || {}).name || ''}
          onChange={e => setDriver(e.target.value)}
          placeholder={t('Örn: depo → reyon doldurma süreci', 'E.g., the back-room → shelf replenishment process')}
          style={field}
        />
      </Card>

      <Card>
        <CardHead title={t('3 · Neden? (kökene inin)', '3 · Why? (drill to the root)')} sub={t('Cevap kişiyi değil süreci göstermeli; son "neden" kök nedeninizdir.', 'Answers should point at the process, not a person; the last "why" is your root cause.')} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[0, 1, 2].map(i => (
            <label key={i} style={{ display: 'block' }}>
              <span style={lbl}>{t('Neden ' + (i + 1), 'Why ' + (i + 1))}{i === 2 ? t(' (kök neden)', ' (root cause)') : ''}</span>
              <input
                className="pcx-field" value={c.whys[i] || ''}
                onChange={e => setWhy(i, e.target.value)}
                placeholder={i === 0 ? t('İlk "neden" — belirtinin bir altı', 'First why — one level below the symptom') : i === 1 ? t('İkinci "neden"', 'Second why') : t('Kök neden — süreç/sistem eksiği olarak yazın', 'Root cause — phrase it as a process/system gap')}
                style={field}
              />
            </label>
          ))}
        </div>
        <MethodBox margin="10px 0 0">{t('Üç "neden" yetmediyse bu sorun hızlı çözümlük değildir — tam akışa terfi ettirin.', 'If three whys are not enough, this problem is not a quick solve — promote it to the full flow.')}</MethodBox>
      </Card>

      <Card>
        <CardHead title={t('4 · Önlem ve sorumlu', '4 · Countermeasure and owner')} sub={t('Tekrarını önleyecek aksiyon; kendi alanınız değilse süreç sahibine iletin.', 'The action that prevents recurrence; if it is outside your area, hand it to the process owner.')} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <textarea
            className="pcx-field" rows={2} value={act.text || ''}
            onChange={e => setAct('text', e.target.value)}
            placeholder={t('Örn: reyon doldurma listesine NOS kontrolü eklendi; mağaza müdürüne süreç değişikliği iletildi.', 'E.g., NOS check added to the replenishment list; the process change was handed to the store manager.')}
            style={{ ...field, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <label style={{ flex: '1 1 180px' }}>
              <span style={lbl}>{t('Sorumlu / devredilen', 'Owner / delegated to')}</span>
              <input className="pcx-field" value={act.owner || ''} onChange={e => setAct('owner', e.target.value)} placeholder={t('Kişi ya da süreç sahibi', 'Person or process owner')} style={field} />
            </label>
            <label style={{ flex: '1 1 140px' }}>
              <span style={lbl}>{t('Termin', 'Due date')}</span>
              <input className="pcx-field" type="date" value={act.dueDate || ''} onChange={e => setAct('dueDate', e.target.value)} style={field} />
            </label>
            <label style={{ flex: '1 1 140px' }}>
              <span style={lbl}>{t('Durum', 'Status')}</span>
              <select className="pcx-field" value={act.status || 'bekliyor'} onChange={e => setAct('status', e.target.value)} style={{ ...S.select, width: '100%', font: '13px Helvetica,Arial,sans-serif' }}>
                <option value="bekliyor">{t('Bekliyor', 'Waiting')}</option>
                <option value="devam">{t('Devam ediyor', 'In progress')}</option>
                <option value="tamam">{t('Tamamlandı', 'Completed')}</option>
              </select>
            </label>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
        <HButton
          onClick={promote}
          style={{ flex: 'none', padding: '10px 16px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
          hover={{ background: 'var(--pri-hover)' }}
        >{t('⤴ Tam akışa terfi ettir (8 adım)', '⤴ Promote to the full flow (8 steps)')}</HButton>
        <span style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t('Girilenler kayıpsız taşınır: tanım → Adım 1, sürücü → Adım 2, nedenler → Adım 5, önlem → Adım 7.', 'Your entries carry over losslessly: definition → Step 1, driver → Step 2, whys → Step 5, countermeasure → Step 7.')}</span>
      </div>
    </div>
  );
}
