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
                    <label htmlFor={'pcx-share-' + i} style={{ display: 'block', font: '600 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.4px', margin: '0 0 3px' }}>
                      SAPMAYA KATKI{(c.problem.unit || '').trim() ? ' (' + c.problem.unit.trim() + ')' : ''}
                    </label>
                    <input
                      id={'pcx-share-' + i}
                      className="pcx-field-sm" type="number" min="0" step="any" value={f.share || ''} onChange={inp('findings', i, 'share')}
                      placeholder="örn. 7"
                      title={'Bu bulgunun KPI sapmasına katkısı — KPI ile AYNI birimde girin' + ((c.problem.unit || '').trim() ? ' (' + c.problem.unit.trim() + ')' : '') + '. En az 2 bulguda girilirse Pareto analizi çizilir.'}
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
          <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>
            Pareto Önceliklendirme <span style={{ font: '400 12px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
              — {pareto.mode === 'kpi' ? 'KPI sapmasına göre' : 'bulguların kendi içindeki dağılımı'}
            </span>
          </div>
          <MethodBox margin="10px 0 14px">Pareto ilkesi — sapmanın büyük bölümü genellikle az sayıda bulgudan gelir. Katkıları KPI ile <strong>aynı birimde</strong> girin; paylar KPI sapmasının kendisine göre hesaplanır, bulgu toplamı %100 sayılmaz. Kök neden analizine (Adım 5) en büyük katkılı bulgudan başlayın.</MethodBox>

          {pareto.mode === 'kpi' ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '0 0 12px', font: '12px Helvetica,Arial,sans-serif' }}>
              <span style={{ background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 20, padding: '4px 11px', color: 'var(--ink-3)' }}>
                KPI sapması: <strong>{String(pareto.gap).replace('.', ',')}{pareto.unit ? ' ' + pareto.unit : ''}</strong>
              </span>
              <span style={{ background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 20, padding: '4px 11px', color: 'var(--ok-ink)' }}>
                Bulgularla açıklanan: <strong>{String(pareto.explained).replace('.', ',')}{pareto.unit ? ' ' + pareto.unit : ''} (%{pareto.explainedPct})</strong>
              </span>
              {pareto.unexplained > 0 ? (
                <span style={{ background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 20, padding: '4px 11px', color: 'var(--warn-ink)' }}>
                  Açıklanamayan: <strong>{String(pareto.unexplained).replace('.', ',')}{pareto.unit ? ' ' + pareto.unit : ''} (%{pareto.unexplainedPct})</strong>
                </span>
              ) : null}
            </div>
          ) : (
            <div style={{ margin: '0 0 12px', font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 8, padding: '8px 12px' }}>
              Adım 1'de ölçülmüş bir KPI sapması olmadığı için yalnızca bulguların <strong>kendi içindeki</strong> dağılımı gösteriliyor. KPI hedef/gerçekleşen girildiğinde paylar sapmaya göre hesaplanır.
            </div>
          )}

          {pareto.overflow > 0 ? (
            <div role="alert" style={{ margin: '0 0 12px', font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--alert)', background: 'var(--alert-soft)', border: '1px solid var(--alert-border)', borderRadius: 8, padding: '10px 12px' }}>
              <strong>⚠ Tutarlılık uyarısı:</strong> Bulgu katkılarının toplamı ({String(pareto.explained).replace('.', ',')}{pareto.unit ? ' ' + pareto.unit : ''}) KPI sapmasından ({String(pareto.gap).replace('.', ',')}{pareto.unit ? ' ' + pareto.unit : ''}) <strong>{String(pareto.overflow).replace('.', ',')}{pareto.unit ? ' ' + pareto.unit : ''} fazla</strong>. Katkılar çakışıyor (aynı gecikme iki bulguda sayılmış), farklı birimde girilmiş ya da abartılı olabilir — verileri gözden geçirin.
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pareto.bars.map(bar => (
              <div key={bar.label} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 'none', width: 30, font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>{bar.label}</div>
                <div style={{ flex: 1, height: 20, background: 'var(--surface-4)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: bar.w + '%', height: '100%', background: pareto.vital.includes(bar.label) ? 'var(--pri)' : 'var(--pri-bar)', borderRadius: 5 }} />
                </div>
                <div style={{ flex: 'none', width: 170, font: '11.5px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', textAlign: 'right' }}>
                  {String(bar.v).replace('.', ',')}{pareto.unit ? ' ' + pareto.unit : ''}
                  {bar.pctOfGap !== null ? <> · sapmanın %{bar.pctOfGap}</> : <> · %{bar.pctInternal}</>}
                  <span style={{ color: 'var(--muted)' }}> (küm. %{bar.cumInternal})</span>
                </div>
              </div>
            ))}
            {pareto.mode === 'kpi' && pareto.unexplained > 0 ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 'none', width: 30, font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--warn-ink)' }}>?</div>
                <div style={{ flex: 1, height: 20, background: 'var(--surface-4)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: Math.max(3, Math.round(pareto.unexplained / Math.max(pareto.gap, pareto.explained) * 100)) + '%', height: '100%', background: 'repeating-linear-gradient(45deg, var(--warn-border), var(--warn-border) 6px, var(--warn-soft) 6px, var(--warn-soft) 12px)', borderRadius: 5 }} />
                </div>
                <div style={{ flex: 'none', width: 170, font: '11.5px Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', textAlign: 'right' }}>
                  Açıklanamayan · {String(pareto.unexplained).replace('.', ',')}{pareto.unit ? ' ' + pareto.unit : ''} (%{pareto.unexplainedPct})
                </div>
              </div>
            ) : null}
          </div>

          <div style={{ marginTop: 12, display: 'inline-block', background: 'var(--pri-soft)', border: '1px solid var(--pri-border-5)', borderRadius: 8, padding: '8px 12px', font: '600 12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>
            {pareto.vital.join(' + ')} → {pareto.mode === 'kpi'
              ? <>KPI sapmasındaki pay %{Math.min(100, Math.round(pareto.bars.slice(0, pareto.vital.length).reduce((a, b) => a + b.v, 0) / pareto.gap * 100))} · açıklanan bölümdeki pay %{pareto.vitalPct}.</>
              : <>girilen katkılardaki kümülatif pay %{pareto.vitalPct}.</>} Adım 5'e {pareto.bars[0].label} ile başlayın.
          </div>
          {pareto.mode === 'kpi' && pareto.unexplained > 0 && pareto.unexplainedPct >= 30 ? (
            <div style={{ marginTop: 8, font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
              Sapmada bulgularla açıklanmayan pay %{pareto.unexplainedPct} — Adım 2-3'e dönüp eksik sürücü/alt bileşen olup olmadığını kontrol etmek isteyebilirsiniz.
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
