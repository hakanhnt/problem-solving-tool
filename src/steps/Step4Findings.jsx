import React from 'react';
import { useStore, verMeta } from '../lib/store.jsx';
import { Card, GuidanceBox, MethodBox, AddButton, RemoveButton, VerifyBadge, YZButton, Badge, S } from '../ui/primitives.jsx';

const QUESTIONS = [
  'Ölçülmüş, kanıtlı sapmalar neler?',
  'Ölçülmüş ve doğrulanmış problem bulguları neler?',
  'Hangi sapmalar verilerle doğrulandı?',
  'Varsayımları bıraktım mı — her bulgunun bir verisi/kanıtı var mı?',
  'Fikrimi doğrulayan veriyi mi topladım, yoksa çürütebilecek veriye de baktım mı? (onaylama yanlılığı)',
  'Bulguyu "bence" ile mi yazdım, "gördüğüm/ölçtüğüm veri şu" ile mi? (gözlem yapmadan yorum yapmama)'
];

export default function Step4Findings() {
  const { c, updC, inp, fieldHelp, removeC } = useStore();
  const aiReady = (c.problem.statement || '').trim().length > 0;

  return (
    <div>
      <GuidanceBox items={QUESTIONS} margin="0 0 16px" />

      <div style={{ background: 'var(--warn-soft-2)', border: '1px solid var(--warn-border-2)', borderRadius: 8, padding: '12px 14px', margin: '0 0 16px', font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--warn-ink-3)' }}>
        <strong>Unutmayın:</strong> Problem başka şeydir, problem bulgusu başka şeydir, kök neden başka şeydir. Bulgu, veriye dayalı ölçülmüş spesifik bir sapmadır; kök neden bu sapmanın altında yatan sebeptir.
      </div>

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>Doğrulanmış Bulgular / Alt Problemler</div>
        <div style={S.cardSub}>Her bulguyu ölçülmüş sapma olarak yazın ve kanıtını belirtin.</div>
        <MethodBox margin="0 0 14px">Bulgu = veriyle doğrulanmış, ölçülmüş spesifik sapma. "Bence, galiba" ile başlayan ifadeler bulgu değildir; her bulgunun kaynağı yazılmalıdır.</MethodBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {c.findings.map((f, i) => {
            const vm = verMeta(f);
            return (
              <div key={i} style={S.itemCard}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Badge>B{i + 1}</Badge>
                  <textarea
                    className="pcx-field" value={f.text} onChange={inp('findings', i, 'text')}
                    placeholder="Ölçülmüş sapma — örn. Booking → yükleme ort. 12 gün (hedef 5); +7 gün sapma"
                    style={{ ...S.textarea, flex: 1, width: 'auto', minHeight: 52 }}
                  />
                  {aiReady ? <YZButton onClick={() => fieldHelp('Problem bulgusu B' + (i + 1), (f.text || '') + (f.evidence ? ' (Kanıt: ' + f.evidence + ')' : ''))} title="YZ'den bu bulgu için yardım al" /> : null}
                  <RemoveButton onClick={() => removeC('bulgu', cc => cc.findings.splice(i, 1))} />
                </div>
                <textarea
                  className="pcx-field" value={f.evidence} onChange={inp('findings', i, 'evidence')}
                  placeholder="Veri / kanıt kaynağı — örn. forwarder milestone raporu, son 30 yükleme"
                  style={{ ...S.textarea, font: '12.5px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', minHeight: 40 }}
                />
                <VerifyBadge meta={vm} onClick={() => updC(cc => { cc.findings[i].verified = !cc.findings[i].verified; })} />
              </div>
            );
          })}
          <AddButton onClick={() => updC(cc => cc.findings.push({ text: '', evidence: '' }))}>+ Bulgu ekle</AddButton>
        </div>
      </Card>
    </div>
  );
}
