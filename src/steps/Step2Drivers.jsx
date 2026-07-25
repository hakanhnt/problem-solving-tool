import React from 'react';
import { useStore, verMeta } from '../lib/store.jsx';
import { driverMap } from '../lib/derive.js';
import { Card, GuidanceBox, MethodBox, AddButton, RemoveButton, VerifyBadge, YZButton, S } from '../ui/primitives.jsx';

const QUESTIONS = [
  'Bu sonucu hangi ana etkenler sürüklüyor? Hangi ana etkenler sonucu oluşturuyor?',
  "Hangi iş sürücülerinde / driver'larda sapma olabilir?",
  'Hangi süreçlerde sorun olabilir? Hangi ana driver bozuk?',
  "Sorunlu KPI'ı hangi driver'lardaki ya da süreçlerdeki bozukluk oluşturuyor?",
  'İşi yapanlara sordum mu? Yerinde gözlem yaptım mı? Kritik paydaşlara ve konu uzmanlarına danıştım mı?'
];

export default function Step2Drivers() {
  const { c, updC, inp, fieldHelp } = useStore();
  const aiReady = (c.problem.statement || '').trim().length > 0;
  const dmap = driverMap(c);

  return (
    <div>
      <GuidanceBox items={QUESTIONS} />

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>Ana Driver'lar / İş Sürücüleri</div>
        <div style={S.cardSub}>Sonucu oluşturan ana etkenleri ve ilgili süreçleri listeleyin.</div>
        <MethodBox margin="0 0 14px">Business Driver Mapping — KPI'ı oluşturan ana etkenleri MECE (birbirini dışlayan, bütünü kapsayan) şekilde haritalayın. Şüpheleri masa başında değil, işi yapanlarla ve Gemba'da doğrulayın.</MethodBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {c.drivers.map((d, i) => {
            const vm = verMeta(d);
            return (
              <div key={i} style={S.itemCard}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <textarea
                    className="pcx-field" value={d.name} onChange={inp('drivers', i, 'name')}
                    placeholder="Driver / ana etken adı"
                    style={{ ...S.textarea, flex: 1, width: 'auto', font: '600 14px/1.45 Helvetica,Arial,sans-serif', minHeight: 44 }}
                  />
                  {aiReady ? <YZButton onClick={() => fieldHelp('Ana driver / iş sürücüsü ' + (i + 1), (d.name || '') + (d.note ? ' — ' + d.note : ''))} /> : null}
                  <RemoveButton onClick={() => updC(cc => cc.drivers.splice(i, 1))} />
                </div>
                <textarea
                  className="pcx-field" value={d.note} onChange={inp('drivers', i, 'note')}
                  placeholder="Hangi süreçleri kapsıyor, kimlerle yürüyor, neden şüpheleniyorsunuz?"
                  style={{ ...S.textarea, minHeight: 52, height: 104 }}
                />
                <VerifyBadge meta={vm} onClick={() => updC(cc => { cc.drivers[i].verified = !cc.drivers[i].verified; })} />
              </div>
            );
          })}
          <AddButton onClick={() => updC(cc => cc.drivers.push({ name: '', note: '' }))}>+ Driver ekle</AddButton>
        </div>
      </Card>

      {c.drivers.some(d => (d.name || '').trim()) ? (
        <Card>
          <div style={{ ...S.cardTitle, margin: '0 0 12px' }}>Driver Haritası <span style={{ font: '400 12px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>— görsel</span></div>
          <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', padding: '4px 0' }}>
            <div style={{ flex: 'none', background: 'var(--pri)', color: 'var(--on-pri)', borderRadius: 9, padding: '14px 16px', font: '700 13px/1.4 Helvetica,Arial,sans-serif', maxWidth: 190, textAlign: 'center' }}>
              {(c.problem.kpiName || '').trim() || 'Sorunlu KPI'}
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
          <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted-2)', marginTop: 8 }}>Driver ve alt bileşen girdilerinizden otomatik çizilir; Adım 3'te alt bileşen ekledikçe zenginleşir.</div>
        </Card>
      ) : null}
    </div>
  );
}
