import React from 'react';
import { useStore, verMeta } from '../lib/store.jsx';
import { driverMap } from '../lib/derive.js';
import { Card, GuidanceBox, MethodBox, AddButton, RemoveButton, VerifyBadge, YZButton, S } from '../ui/primitives.jsx';

const QUESTIONS = t => [
  t('Bu sonucu hangi ana etkenler sürüklüyor? Hangi ana etkenler sonucu oluşturuyor?', 'Which main factors drive this outcome? Which main factors produce the result?'),
  t("Hangi iş sürücülerinde (business driver) sapma olabilir?", 'Which business drivers might be deviating?'),
  t('Hangi süreçlerde sorun olabilir? Hangi ana iş sürücüsü bozuk?', 'Which processes might have a problem? Which main business driver is broken?'),
  t("Sorunlu KPI'ı hangi iş sürücülerindeki ya da süreçlerdeki bozukluk oluşturuyor?", 'Which breakdown in business drivers or processes produces the problem KPI?'),
  t('İşi yapanlara sordum mu? Yerinde gözlem yaptım mı? Kritik paydaşlara ve konu uzmanlarına danıştım mı?', 'Did I ask the people doing the work? Did I observe on site? Did I consult critical stakeholders and subject matter experts?')
];

export default function Step2Drivers() {
  const { c, updC, inp, fieldHelp, removeC, t } = useStore();
  const aiReady = (c.problem.statement || '').trim().length > 0;
  const dmap = driverMap(c);

  return (
    <div>
      <GuidanceBox items={QUESTIONS(t)} />

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>{t('Ana İş Sürücüleri', 'Main Business Drivers')}</div>
        <div style={S.cardSub}>{t('Sonucu oluşturan ana etkenleri ve ilgili süreçleri listeleyin.', 'List the main factors that produce the outcome and the related processes.')}</div>
        <MethodBox margin="0 0 14px">{t("İş sürücüsü haritalama (business driver mapping) — KPI'ı oluşturan ana etkenleri MECE (birbirini dışlayan, bütünü kapsayan) şekilde haritalayın. Şüpheleri masa başında değil, işi yapanlarla ve Gemba'da doğrulayın.", 'Business driver mapping — map the main factors that produce the KPI in a MECE (mutually exclusive, collectively exhaustive) way. Verify suspicions with the people doing the work and at the Gemba, not at your desk.')}</MethodBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {c.drivers.map((d, i) => {
            const vm = verMeta(d);
            return (
              <div key={i} style={S.itemCard}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <textarea
                    className="pcx-field" value={d.name} onChange={inp('drivers', i, 'name')}
                    placeholder={t('İş sürücüsü / ana etken adı', 'Business driver / main factor name')}
                    style={{ ...S.textarea, flex: 1, width: 'auto', font: '600 14px/1.45 Helvetica,Arial,sans-serif', minHeight: 44 }}
                  />
                  {aiReady ? <YZButton title={t("YZ'den " + (i + 1) + '. iş sürücüsü için yardım al', 'Get AI help for business driver ' + (i + 1))} onClick={() => fieldHelp(t('Ana iş sürücüsü ', 'Main business driver ') + (i + 1), (d.name || '') + (d.note ? ' — ' + d.note : ''))} /> : null}
                  <RemoveButton onClick={() => removeC('driver', cc => cc.drivers.splice(i, 1))} />
                </div>
                <textarea
                  className="pcx-field" value={d.note} onChange={inp('drivers', i, 'note')}
                  placeholder={t('Hangi süreçleri kapsıyor, kimlerle yürüyor, neden şüpheleniyorsunuz?', 'Which processes does it cover, who runs it, why do you suspect it?')}
                  style={{ ...S.textarea, minHeight: 52, height: 104 }}
                />
                <VerifyBadge meta={vm} onClick={() => updC(cc => { cc.drivers[i].verified = !cc.drivers[i].verified; })} />
              </div>
            );
          })}
          <AddButton onClick={() => updC(cc => cc.drivers.push({ name: '', note: '' }))}>{t('+ İş sürücüsü ekle', '+ Add business driver')}</AddButton>
        </div>
      </Card>

      {c.drivers.some(d => (d.name || '').trim()) ? (
        <Card>
          <div style={{ ...S.cardTitle, margin: '0 0 12px' }}>{t('İş Sürücüsü Haritası', 'Business Driver Map')} <span style={{ font: '400 12px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t('— görsel', '— visual')}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', padding: '4px 0' }}>
            <div style={{ flex: 'none', background: 'var(--pri)', color: 'var(--on-pri)', borderRadius: 9, padding: '14px 16px', font: '700 13px/1.4 Helvetica,Arial,sans-serif', maxWidth: 190, textAlign: 'center' }}>
              {(c.problem.kpiName || '').trim() || t('Sorunlu KPI', 'Problem KPI')}
            </div>
            <div style={{ flex: 'none', width: 28, height: 2, background: 'var(--pri-border)' }} />
            <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 10, borderLeft: '2px solid var(--pri-border)', padding: '6px 0 6px 28px' }}>
              {dmap.map((dn, i) => (
                <div key={i} style={{ position: 'relative', background: 'var(--pri-soft)', border: '1px solid var(--pri-border-2)', borderRadius: 8, padding: '10px 13px' }}>
                  <div style={{ position: 'absolute', left: -28, top: '50%', width: 28, height: 2, background: 'var(--pri-border)' }} />
                  <div style={{ font: '600 12.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>{dn.name}</div>
                  {dn.hasSub ? <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', marginTop: 4 }}>↳ {dn.sub}</div> : null}
                </div>
              ))}
            </div>
          </div>
          <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted-2)', marginTop: 8 }}>{t("İş sürücüsü ve alt bileşen girdilerinizden otomatik çizilir; Adım 3'te alt bileşen ekledikçe zenginleşir.", 'Drawn automatically from your business driver and sub-component entries; it gets richer as you add sub-components in Step 3.')}</div>
        </Card>
      ) : null}
    </div>
  );
}
