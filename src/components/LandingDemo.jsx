// Tanıtım ekranının kahramanındaki vaka gösterimi: uygulamadaki dolu örnek
// vakanın (ithalat yol süresi) dört aşamalı yolculuğu. Bir kez kendiliğinden
// oynar; kullanıcı bir sekmeye tıklayınca otomatik ilerleme durur.
// Hareket azaltma tercihi olan kullanıcıda otomatik ilerleme hiç başlamaz.

import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/store.jsx';

const DWELL = [5600, 4400, 6000];

function prefersReducedMotion() {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}

export default function LandingDemo({ onOpenExample }) {
  const { t } = useStore();
  const [stage, setStage] = useState(0);
  const [auto, setAuto] = useState(() => !prefersReducedMotion());

  useEffect(() => {
    if (!auto || stage >= 3) return undefined;
    const id = setTimeout(() => setStage(s => s + 1), DWELL[stage]);
    return () => clearTimeout(id);
  }, [auto, stage]);

  const go = n => { setAuto(false); setStage(n); };
  const replay = () => { setStage(0); setAuto(!prefersReducedMotion()); };

  const tabs = [t('Şikâyet', 'Complaint'), t('Problem', 'Problem'), t('Test', 'Test'), t('Kök neden', 'Root cause')];

  const stages = [
    <div key="0" className="pl-stage">
      <p className="pl-kicker">{t('Toplantıda söylenen', 'What was said in the meeting')}</p>
      <p className="pl-quote">
        <q>
          {t('İthalat ', 'Imports are ')}<span className="pl-vague">{t('çok yavaş', 'way too slow')}</span>,{' '}
          <span className="pl-strike">{t('forwarder’ı değiştirelim', 'let’s switch forwarders')}</span>.
        </q>
      </p>
      <ul className="pl-notes">
        <li className="pl-note"><span className="pl-swatch vague" aria-hidden="true" />{t('Ne kadar yavaş? Hedef ve gerçekleşen yok.', 'How slow? No target, no actual.')}</li>
        <li className="pl-note"><span className="pl-swatch strike" aria-hidden="true" />{t('Bu bir çözüm. Problem henüz tanımlanmadı.', 'That’s a solution. The problem isn’t defined yet.')}</li>
      </ul>
    </div>,

    <div key="1" className="pl-stage">
      <p className="pl-kicker">{t('Ölçülmüş problem', 'Measured problem')}</p>
      <p className="pl-statement">{t('Uzakdoğu’daki üreticiden antrepo teslimine uçtan uca yol süresi hedefi 45 gün, gerçekleşen ortalama 65 gün.', 'End-to-end lead time from the Far East supplier to bonded-warehouse delivery: target 45 days, actual average 65 days.')}</p>
      <div className="pl-bars" role="img" aria-label={t('Hedef 45 gün, gerçekleşen 65 gün', 'Target 45 days, actual 65 days')}>
        <div className="pl-bar-row">
          <span>{t('Hedef', 'Target')}</span>
          <div className="pl-bar-track"><div className="pl-bar target" style={{ width: (45 / 70 * 100) + '%' }}>45</div></div>
        </div>
        <div className="pl-bar-row">
          <span>{t('Gerçekleşen', 'Actual')}</span>
          <div className="pl-bar-track">
            <div className="pl-bar actual" style={{ width: (65 / 70 * 100) + '%' }}>65</div>
            <div className="pl-bar-gap" style={{ left: (45 / 70 * 100) + '%' }} />
          </div>
        </div>
      </div>
      <p className="pl-gap-label">{t('20 günlük sapma: stok devri ve mağaza bulunurluğu bundan etkileniyor.', 'A 20-day gap, hitting stock turnover and store availability.')}</p>
    </div>,

    <div key="2" className="pl-stage">
      <p className="pl-kicker">{t('Hipotezler veriyle sınanıyor', 'Hypotheses tested against data')}</p>
      <ul className="pl-tests">
        <li className="pl-test">
          <span className="pl-test-q">{t('Forwarder mı yavaş?', 'Is the forwarder slow?')}</span>
          <span className="pl-verdict no">{t('Elendi', 'Ruled out')}</span>
          <span className="pl-test-d">{t('İki forwarder’da da booking → yükleme 11–13 gün. Gecikme forwarder’a bağlı değil.', 'Booking → loading takes 11–13 days with both forwarders. The delay isn’t the forwarder.')}</span>
        </li>
        <li className="pl-test">
          <span className="pl-test-q">{t('Evrak seti eksik mi geliyor?', 'Do document sets arrive incomplete?')}</span>
          <span className="pl-verdict yes">{t('Destekleniyor', 'Supported')}</span>
          <span className="pl-test-d">{t('Setlerin yalnızca %38’i ilk seferde eksiksiz; her düzeltme turu ortalama 4 gün ekliyor.', 'Only 38% of sets arrive complete the first time; each correction round adds 4 days on average.')}</span>
        </li>
      </ul>
      <p className="pl-aside">{t('Forwarder’ı değiştirmek sapmanın kaynağına dokunmayacaktı.', 'Switching forwarders would not have touched the source of the gap.')}</p>
    </div>,

    <div key="3" className="pl-stage">
      <p className="pl-kicker">{t('Doğrulanmış kök neden', 'Verified root cause')}</p>
      <div className="pl-root">
        <p className="pl-statement">{t('Uçtan uca sürecin bir sahibi yok; ara adımların hedefi tanımlanmamış ve ölçülmüyor.', 'The end-to-end process has no owner; intermediate steps have no targets and aren’t measured.')}</p>
        <span className="pl-verified">{t('Doğrulandı', 'Verified')}</span>
      </div>
      <div className="pl-result">
        <div className="pl-nums" aria-label={t('12 günden 8 güne', 'From 12 days to 8')}><s>12</s>8<span>{t('gün', 'days')}</span></div>
        <p>{t('Ara hedefler haftalık izlenmeye başlanınca, ilk ayda booking → yükleme süresi 12 günden 8 güne indi.', 'Once intermediate targets were tracked weekly, booking → loading fell from 12 to 8 days in the first month.')}</p>
      </div>
      <button type="button" className="pl-link" style={{ marginTop: 22 }} onClick={replay}>{t('Baştan izle', 'Watch again')}</button>
    </div>
  ];

  return (
    <figure className="pl-demo" style={{ margin: 0 }} aria-label={t('Örnek vaka: bir problemin dört aşaması', 'Example case: four stages of one problem')}>
      <div className="pl-tabs" role="tablist">
        {tabs.map((label, i) => (
          <button
            key={i} type="button" role="tab" id={'pl-tab-' + i}
            aria-selected={stage === i} aria-controls="pl-stage"
            className={'pl-tab' + (i < stage ? ' is-past' : '')}
            onClick={() => go(i)}
          >
            <span className="pl-tab-n" aria-hidden="true">{i + 1}</span>{label}
            {stage === i ? (
              <span
                key={stage + (auto ? 'a' : 's')}
                aria-hidden="true"
                className={'pl-tab-bar ' + (auto && i < 3 ? 'is-timed' : 'is-static')}
                style={{ '--pl-dwell': (DWELL[i] || 0) + 'ms' }}
              />
            ) : null}
          </button>
        ))}
      </div>
      <div id="pl-stage" role="tabpanel" aria-labelledby={'pl-tab-' + stage}>{stages[stage]}</div>
      <figcaption className="pl-demo-foot">
        <span>{t('Bu vaka uygulamada dolu bir örnek olarak duruyor.', 'This case ships with the app as a worked example.')}</span>
        <span style={{ display: 'flex', gap: 16 }}>
          <button type="button" className="pl-link" onClick={onOpenExample}>{t('Vakayı aç', 'Open the case')}</button>
        </span>
      </figcaption>
    </figure>
  );
}
