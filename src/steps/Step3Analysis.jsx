import React from 'react';
import { useStore, verMeta } from '../lib/store.jsx';
import { Card, GuidanceBox, MethodBox, AddButton, RemoveButton, VerifyBadge, YZButton, AdvancedSection, S } from '../ui/primitives.jsx';

const QUESTIONS = t => [
  t("O etkenin hangi alt bileşeni bozuk? İş sürücüsünün hangi alt bileşeninde problem var?", 'Which sub-component of that factor is broken? Which sub-component of the business driver has the problem?'),
  t("Etkisi en büyük iş sürücülerinin alt bileşenlerinin hangisinde sorun var?", 'Which sub-components of the highest-impact business drivers have a problem?'),
  t("Hangi KPI veya PI'larda, ya da SIPOC'a göre girdi kalitesinde bozukluk var?", 'Which KPIs or PIs show a deviation, or where is input quality broken per SIPOC?'),
  t('Analizi işin yapıldığı yerde, işi yapanlarla birlikte, süreç metriklerini kontrol ederek mi yapıyorum?', 'Am I doing the analysis where the work happens, with the people doing it, checking process metrics?')
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
  const { c, updC, inp, fieldHelp, removeC, t, lang } = useStore();
  const aiReady = (c.problem.statement || '').trim().length > 0;

  return (
    <div>
      <GuidanceBox items={QUESTIONS(t)} />

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>{t('Alt Bileşen Analizi', 'Sub-component Analysis')}</div>
        <div style={S.cardSub}>{t('Her iş sürücüsü için sorunlu alt bileşeni ve tespitinizi yazın.', 'For each business driver, write the problem sub-component and your finding.')}</div>
        <MethodBox margin="0 0 14px">{t('İş sürücüsü analizi (driver analysis) — etkisi en büyük iş sürücüsünü alt bileşenlerine ayırın; her alt bileşende KPI/PI sapması olup olmadığını süreç metrikleriyle kontrol edin.', 'Business driver analysis — break the highest-impact business driver into its sub-components; use process metrics to check each sub-component for KPI/PI deviations.')}</MethodBox>
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
                    className="pcx-field" value={d.component} onChange={inp('driverAnalysis', i, 'component')} placeholder={t('Sorunlu alt bileşen', 'Problem sub-component')}
                    style={{ ...S.textarea, flex: 1.4, width: 'auto', minHeight: 58 }}
                  />
                  {aiReady ? <YZButton title={t("YZ'den " + (i + 1) + '. alt bileşen analizi için yardım al', 'Get AI help for sub-component analysis ' + (i + 1))} onClick={() => fieldHelp(t('Driver alt bileşen analizi ', 'Driver sub-component analysis ') + (i + 1), [d.driver, d.component, d.issue].filter(Boolean).join(' | '))} /> : null}
                  <RemoveButton onClick={() => removeC(t('alt bileşen analizi', 'sub-component analysis'), cc => cc.driverAnalysis.splice(i, 1))} />
                </div>
                <textarea
                  className="pcx-field" value={d.issue} onChange={inp('driverAnalysis', i, 'issue')}
                  placeholder={t('Tespit: ne bozuk, nasıl gözlemlediniz?', 'Finding: what is broken, how did you observe it?')}
                  style={{ ...S.textarea, minHeight: 52 }}
                />
                <VerifyBadge meta={vm} onClick={() => updC(cc => { cc.driverAnalysis[i].verified = !cc.driverAnalysis[i].verified; })} />
              </div>
            );
          })}
          <AddButton onClick={() => updC(cc => cc.driverAnalysis.push({ driver: '', component: '', issue: '' }))}>{t('+ Alt bileşen analizi ekle', '+ Add sub-component analysis')}</AddButton>
        </div>
      </Card>

      <AdvancedSection
        id="s3"
        title={t('İleri analiz — SIPOC (Tedarikçi → Girdi → Süreç → Çıktı → Müşteri)', 'Advanced analysis — SIPOC (Supplier → Input → Process → Output → Customer)')}
        sub={t('Alt bileşen analizi sorunun hangi adımda olduğunu gösterir; SIPOC o adımın girdi kalitesini sorgular. Girdiden şüpheleniyorsanız açın.', "Sub-component analysis shows which step has the problem; SIPOC questions that step's input quality. Open it if you suspect the inputs.")}
      >
      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>{t('SIPOC Analizi', 'SIPOC Analysis')}</div>
        <div style={S.cardSub}>{t('Sorunlu süreç adımları için Tedarikçi → Girdi → Süreç → Çıktı → Müşteri zincirini doldurun.', 'For the problem process steps, fill in the Supplier → Input → Process → Output → Customer chain.')}</div>
        <MethodBox margin="0 0 14px">{t('SIPOC — süreci Tedarikçi → Girdi → Süreç → Çıktı → Müşteri zinciri olarak gösterir; özellikle girdi kalitesindeki bozuklukları görünür kılar.', 'SIPOC — shows the process as a Supplier → Input → Process → Output → Customer chain; it makes input quality issues in particular visible.')}</MethodBox>

        <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 640 }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 8, margin: '0 0 8px' }}>
          {SIPOC_COLS.map(col => (
            <div key={col.key} style={{ font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px' }}>{col.head[0]}{lang === 'en' ? null : <><br />{col.head[1]}</>}</div>
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
                {aiReady ? <YZButton onClick={() => fieldHelp(t('SIPOC satırı ', 'SIPOC row ') + (i + 1), [r.s, r.i, r.p, r.o, r.c].filter(Boolean).join(' | '))} title={t("YZ'den bu satır için yardım al", 'Get AI help for this row')} /> : null}
                <RemoveButton onClick={() => removeC(t('SIPOC satırı', 'SIPOC row'), cc => cc.sipoc.splice(i, 1))} style={{ font: '600 11px Helvetica,Arial,sans-serif' }} />
              </div>
            </div>
          ))}
          <AddButton onClick={() => updC(cc => cc.sipoc.push({ s: '', i: '', p: '', o: '', c: '' }))}>{t('+ SIPOC satırı ekle', '+ Add SIPOC row')}</AddButton>
        </div>
        </div>
        </div>
      </Card>
      </AdvancedSection>
    </div>
  );
}
