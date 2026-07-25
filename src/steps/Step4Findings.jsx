import React from 'react';
import { useStore, verMeta } from '../lib/store.jsx';
import { Card, GuidanceBox, MethodBox, AddButton, RemoveButton, VerifyBadge, YZButton, Badge, S } from '../ui/primitives.jsx';
import { paretoData } from '../lib/derive.js';

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
  const pareto = paretoData(c);

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
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <textarea
                    className="pcx-field" value={f.evidence} onChange={inp('findings', i, 'evidence')}
                    placeholder="Veri / kanıt kaynağı — örn. forwarder milestone raporu, son 30 yükleme"
                    style={{ ...S.textarea, flex: 1, width: 'auto', minWidth: 220, font: '12.5px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', minHeight: 40 }}
                  />
                  <div style={{ flex: 'none' }}>
                    <label style={{ display: 'block', font: '600 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.4px', margin: '0 0 3px' }}>SAPMAYA KATKI</label>
                    <input
                      className="pcx-field-sm" type="number" min="0" step="any" value={f.share || ''} onChange={inp('findings', i, 'share')}
                      placeholder="örn. 7"
                      title="Bu bulgunun toplam sapmaya katkısı (gün, adet, % — birim serbest). En az 2 bulguda girilirse Pareto grafiği çizilir."
                      style={{ width: 100, boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
                    />
                  </div>
                </div>
                <VerifyBadge meta={vm} onClick={() => updC(cc => { cc.findings[i].verified = !cc.findings[i].verified; })} />
              </div>
            );
          })}
          <AddButton onClick={() => updC(cc => cc.findings.push({ text: '', evidence: '', share: '' }))}>+ Bulgu ekle</AddButton>
        </div>
      </Card>

      {pareto ? (
        <Card>
          <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>Pareto Önceliklendirme <span style={{ font: '400 12px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>— sapmaya katkıya göre</span></div>
          <MethodBox margin="10px 0 14px">Pareto ilkesi — sapmanın büyük bölümü genellikle az sayıda bulgudan gelir. Kök neden analizine (Adım 5) en büyük katkılı bulgudan başlayın; küçük katkılı bulgulara aynı derinliği harcamayın.</MethodBox>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pareto.bars.map(bar => (
              <div key={bar.label} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 'none', width: 30, font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>{bar.label}</div>
                <div style={{ flex: 1, height: 20, background: 'var(--surface-4)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: bar.w + '%', height: '100%', background: pareto.vital.includes(bar.label) ? 'var(--pri)' : 'var(--pri-bar)', borderRadius: 5 }} />
                </div>
                <div style={{ flex: 'none', width: 130, font: '11.5px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', textAlign: 'right' }}>
                  {bar.v} · %{bar.pct} <span style={{ color: 'var(--muted)' }}>(kümülatif %{bar.cumPct})</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'inline-block', background: 'var(--pri-soft)', border: '1px solid var(--pri-border-5)', borderRadius: 8, padding: '8px 12px', font: '600 12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>
            {pareto.vital.join(' + ')} → toplam sapmadaki kümülatif pay %{pareto.vitalPct}. Adım 5'e {pareto.bars[0].label} ile başlayın.
          </div>
        </Card>
      ) : null}
    </div>
  );
}
