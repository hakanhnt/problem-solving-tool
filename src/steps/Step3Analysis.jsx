import React from 'react';
import { useStore, verMeta } from '../lib/store.jsx';
import { Card, GuidanceBox, MethodBox, AddButton, RemoveButton, VerifyBadge, YZButton, AdvancedSection, S } from '../ui/primitives.jsx';

const QUESTIONS = [
  "O etkenin hangi alt bileşeni bozuk? İş sürücüsünün hangi alt bileşeninde problem var?",
  "Etkisi en büyük iş sürücülerinin alt bileşenlerinin hangisinde sorun var?",
  "Hangi KPI veya PI'larda, ya da SIPOC'a göre girdi kalitesinde bozukluk var?",
  'Analizi işin yapıldığı yerde, işi yapanlarla birlikte, süreç metriklerini kontrol ederek mi yapıyorum?'
];

const SIPOC_COLS = [
  { key: 's', head: ['SUPPLIER', 'Tedarikçi'] },
  { key: 'i', head: ['INPUT', 'Girdi'] },
  { key: 'p', head: ['PROCESS', 'Süreç'] },
  { key: 'o', head: ['OUTPUT', 'Çıktı'] },
  { key: 'c', head: ['CUSTOMER', 'Müşteri'] }
];

const GRID = '1fr 1.3fr 1.3fr 1.1fr 1fr 52px';

export default function Step3Analysis() {
  const { c, updC, inp, fieldHelp, removeC } = useStore();
  const aiReady = (c.problem.statement || '').trim().length > 0;

  return (
    <div>
      <GuidanceBox items={QUESTIONS} />

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>Alt Bileşen Analizi</div>
        <div style={S.cardSub}>Her iş sürücüsü için sorunlu alt bileşeni ve tespitinizi yazın.</div>
        <MethodBox margin="0 0 14px">İş sürücüsü analizi (driver analysis) — etkisi en büyük iş sürücüsünü alt bileşenlerine ayırın; her alt bileşende KPI/PI sapması olup olmadığını süreç metrikleriyle kontrol edin.</MethodBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {c.driverAnalysis.map((d, i) => {
            const vm = verMeta(d);
            return (
              <div key={i} style={S.itemCard}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <textarea
                    className="pcx-field" value={d.driver} onChange={inp('driverAnalysis', i, 'driver')} placeholder="Driver"
                    style={{ ...S.textarea, flex: 1, width: 'auto', font: '600 13px/1.45 Helvetica,Arial,sans-serif', minHeight: 58 }}
                  />
                  <textarea
                    className="pcx-field" value={d.component} onChange={inp('driverAnalysis', i, 'component')} placeholder="Sorunlu alt bileşen"
                    style={{ ...S.textarea, flex: 1.4, width: 'auto', minHeight: 58 }}
                  />
                  {aiReady ? <YZButton title={"YZ'den " + (i + 1) + ". alt bileşen analizi için yardım al"} onClick={() => fieldHelp('Driver alt bileşen analizi ' + (i + 1), [d.driver, d.component, d.issue].filter(Boolean).join(' | '))} /> : null}
                  <RemoveButton onClick={() => removeC('alt bileşen analizi', cc => cc.driverAnalysis.splice(i, 1))} />
                </div>
                <textarea
                  className="pcx-field" value={d.issue} onChange={inp('driverAnalysis', i, 'issue')}
                  placeholder="Tespit: ne bozuk, nasıl gözlemlediniz?"
                  style={{ ...S.textarea, minHeight: 52 }}
                />
                <VerifyBadge meta={vm} onClick={() => updC(cc => { cc.driverAnalysis[i].verified = !cc.driverAnalysis[i].verified; })} />
              </div>
            );
          })}
          <AddButton onClick={() => updC(cc => cc.driverAnalysis.push({ driver: '', component: '', issue: '' }))}>+ Alt bileşen analizi ekle</AddButton>
        </div>
      </Card>

      <AdvancedSection
        id="s3"
        title="İleri analiz — SIPOC (Tedarikçi → Girdi → Süreç → Çıktı → Müşteri)"
        sub="Alt bileşen analizi sorunun hangi adımda olduğunu gösterir; SIPOC o adımın girdi kalitesini sorgular. Girdiden şüpheleniyorsanız açın."
      >
      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>SIPOC Analizi</div>
        <div style={S.cardSub}>Sorunlu süreç adımları için Tedarikçi → Girdi → Süreç → Çıktı → Müşteri zincirini doldurun.</div>
        <MethodBox margin="0 0 14px">SIPOC — süreci Tedarikçi → Girdi → Süreç → Çıktı → Müşteri zinciri olarak gösterir; özellikle girdi kalitesindeki bozuklukları görünür kılar.</MethodBox>

        <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 640 }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 8, margin: '0 0 8px' }}>
          {SIPOC_COLS.map(col => (
            <div key={col.key} style={{ font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px' }}>{col.head[0]}<br />{col.head[1]}</div>
          ))}
          <div />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {c.sipoc.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: GRID, gap: 8, alignItems: 'start' }}>
              {SIPOC_COLS.map(col => (
                <textarea
                  key={col.key} className="pcx-field-sm" value={r[col.key]} onChange={inp('sipoc', i, col.key)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 9px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none', resize: 'vertical', minHeight: 58 }}
                />
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', paddingTop: 4 }}>
                {aiReady ? <YZButton onClick={() => fieldHelp('SIPOC satırı ' + (i + 1), [r.s, r.i, r.p, r.o, r.c].filter(Boolean).join(' | '))} title="YZ'den bu satır için yardım al" /> : null}
                <RemoveButton onClick={() => removeC('SIPOC satırı', cc => cc.sipoc.splice(i, 1))} style={{ font: '600 11px Helvetica,Arial,sans-serif' }} />
              </div>
            </div>
          ))}
          <AddButton onClick={() => updC(cc => cc.sipoc.push({ s: '', i: '', p: '', o: '', c: '' }))}>+ SIPOC satırı ekle</AddButton>
        </div>
        </div>
        </div>
      </Card>
      </AdvancedSection>
    </div>
  );
}
