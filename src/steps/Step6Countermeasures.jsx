import React, { useState } from 'react';
import { useStore, prioMeta } from '../lib/store.jsx';
import { THINKING_METHODS } from '../lib/defaults.js';
import { THINKING_METHOD_INFO } from '../lib/thinking.js';
import { decisionMatrix, isOverdue } from '../lib/derive.js';
import ThinkingCheck from '../components/ThinkingCheck.jsx';
import { Card, CardHead, GuidanceBox, MethodBox, AddButton, RemoveButton, YZButton, Badge, HButton, Spinner, S, useNarrow } from '../ui/primitives.jsx';

/**
 * Seçilen düşünme yönteminin karşı çalıştığı yanılgı ve ekip soruları.
 * Kaynak: "Düşünme Yöntemlerine Göre Güçlü Ekip Soruları" kurum dokümanı.
 */
function MethodQuestions({ method }) {
  const [open, setOpen] = useState(false);
  const info = THINKING_METHOD_INFO[method];
  if (!info) return null;
  return (
    <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '9px 12px' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 200 }}>
          Bu yöntem <strong>{info.bias}</strong> yanılgısına karşı çalışır · {info.amac}
        </span>
        <HButton
          onClick={() => setOpen(!open)}
          style={{ flex: 'none', padding: '5px 10px', border: '1px solid var(--pri-border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--pri)', font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
          hover={{ background: 'var(--pri-soft-3)' }}
        >{open ? 'Soruları gizle' : 'Ekibe sorulacak ' + info.sorular.length + ' soru'}</HButton>
      </div>
      {open ? (
        <ul style={{ margin: '8px 0 0', padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {info.sorular.map((q, i) => <li key={i} style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{q}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

const QUESTIONS = [
  'Nasıl çözeceğiz, ne yapacağız? Yerine göre doğru düşünme yöntemlerini kullanarak alternatifler ürettim mi?',
  'Kısıtları ve riskleri dikkate alarak karar kriterlerini belirledim mi?',
  'Alternatifleri kriterlere göre yarıştırdım mı?',
  'Seçtiğim çözüm kök nedeni mi gideriyor, yoksa sadece belirtiyi mi?',
  'İlk aklıma gelen çözüme mi çapalandım — en az iki gerçek alternatif ürettim mi? (çapa etkisi)',
  'Bu seçeneği geleceğe bakarak mı, yoksa geçmişteki yatırımı savunmak için mi tutuyorum? (batık maliyet)'
];

export default function Step6Countermeasures() {
  const { c, updC, inp, fieldHelp, runDecisionCoach, runActionCoach, runPremortem, removeC } = useStore();
  const aiReady = (c.problem.statement || '').trim().length > 0;
  const M = decisionMatrix(c);
  const narrow = useNarrow();

  const dc = c.decisionCoach;
  const dcIdle = !dc || dc.status === 'idle' || dc.status === 'error';
  const ac = c.actionCoach;
  const acIdle = !ac || ac.status === 'idle' || ac.status === 'error';
  const pm = c.premortem;
  const pmIdle = !pm || pm.status === 'idle' || pm.status === 'error';
  const hasDecision = (c.decision.choice || '').trim().length > 0;

  return (
    <div>
      <GuidanceBox items={QUESTIONS} />

      {/* Geçici önlem (8D-D3) */}
      <Card>
        <CardHead
          title="Geçici Önlem — Kanamayı Durdurun"
          sub="Kök neden analizi ve kalıcı çözüm zaman alır; bu sırada müşteriyi / süreci bugün ne koruyor?"
          aiReady={aiReady}
          onHelp={() => fieldHelp('Geçici önlem (containment)', [c.containment.action, c.containment.owner, c.containment.until].filter(Boolean).join(' | '))}
          helpTitle="YZ'den geçici önlem için yardım al"
        />
        <MethodBox>8D metodolojisinin D3 disiplini — geçici önlem 24-48 saat içinde devrede olmalıdır. <strong>Geçici önlem problemi çözmez, çözüm için zaman kazandırır:</strong> kalıcı çözüm doğrulanınca kaldırılır. Karar asla geçici önlemin kendisi olamaz.</MethodBox>
        <textarea
          className="pcx-field" value={c.containment.action} onChange={inp('containment', 'action')}
          placeholder="Örn. şüpheli parti karantinaya alındı; kritik siparişlerde ek kontrol; kısmi hava kargo; manuel doğrulama adımı…"
          style={{ ...S.textarea, minHeight: 52, margin: '0 0 12px' }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1.4fr', gap: 12 }}>
          <div>
            <label style={S.label}>Sorumlu</label>
            <input className="pcx-field-sm" value={c.containment.owner} onChange={inp('containment', 'owner')} placeholder="Rol / kişi" style={S.inputSm} />
          </div>
          <div>
            <label style={S.label}>Ne zamana kadar / hangi koşulda kaldırılacak?</label>
            <input className="pcx-field-sm" value={c.containment.until} onChange={inp('containment', 'until')} placeholder="Örn. kalıcı çözüm KPI ile doğrulanana kadar" style={S.inputSm} />
          </div>
        </div>
        {(c.containment.action || '').trim() ? (
          <div style={{ marginTop: 12, display: 'inline-flex', gap: 8, alignItems: 'center', background: c.containment.removed ? 'var(--ok-soft)' : 'var(--warn-soft)', border: '1px solid ' + (c.containment.removed ? 'var(--ok-border)' : 'var(--warn-border)'), borderRadius: 20, padding: '5px 12px' }}>
            <span style={{ font: '600 11.5px Helvetica,Arial,sans-serif', color: c.containment.removed ? 'var(--ok-ink)' : 'var(--warn-ink)' }}>
              {c.containment.removed ? '✓ Geçici önlem kaldırıldı' : '⏳ Geçici önlem devrede — kalıcı çözüm doğrulanınca Adım 7\'de kaldırın'}
            </span>
          </div>
        ) : null}
      </Card>

      {/* Alternatif çözümler */}
      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>Alternatif Çözümler</div>
        <div style={S.cardSub}>Her alternatifin hangi düşünme yöntemiyle üretildiğini işaretleyin.</div>
        <MethodBox margin="0 0 14px">Farklı düşünme biçimleri (ilk ilkeler, yanal, sistem, tasarım...) farklı çözüm uzayları açar. En az 3 alternatif üretin; aklınıza ilk geleni hemen seçmeyin.</MethodBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {c.alternatives.map((a, i) => (
            <div key={i} style={S.itemCard}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Badge bg="var(--ok)">A{i + 1}</Badge>
                <textarea
                  className="pcx-field" value={a.name} onChange={inp('alternatives', i, 'name')} placeholder="Alternatif çözüm"
                  style={{ ...S.textarea, flex: 1, width: 'auto', font: '600 13px/1.45 Helvetica,Arial,sans-serif', minHeight: 48 }}
                />
                {aiReady ? <YZButton onClick={() => fieldHelp('Alternatif çözüm A' + (i + 1), [a.name, a.method, a.note].filter(Boolean).join(' | '))} title="YZ'den bu alternatif için yardım al" /> : null}
                <RemoveButton onClick={() => removeC('alternatif (matris puanlarıyla)', cc => { cc.alternatives.splice(i, 1); cc.scores = {}; })} />
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <label style={{ flex: 'none', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>Düşünme yöntemi:</label>
                <select
                  value={a.method} onChange={inp('alternatives', i, 'method')}
                  style={{ ...S.select, flex: 1, font: '13px Helvetica,Arial,sans-serif' }}
                >
                  <option value="">Seçin…</option>
                  {THINKING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <MethodQuestions method={a.method} />
              <textarea
                className="pcx-field" value={a.note} onChange={inp('alternatives', i, 'note')}
                placeholder="Nasıl uygulanır, hangi kısıt/riskleri var?"
                style={{ ...S.textarea, minHeight: 48, height: 150 }}
              />
            </div>
          ))}
          <AddButton onClick={() => updC(cc => cc.alternatives.push({ name: '', method: '', note: '' }))}>+ Alternatif ekle</AddButton>
        </div>
      </Card>

      {/* Karar kriterleri */}
      <Card>
        <CardHead
          title="Karar Kriterleri"
          sub={'Kısıt ve riskleri dikkate alarak kriterleri ve ağırlıklarını belirleyin. Ağırlık toplamı: %' + M.wsum}
          aiReady={aiReady}
          onHelp={() => fieldHelp('Karar kriterleri ve ağırlıkları', c.criteria.map(x => (x.name || '?') + ' %' + (x.weight || 0)).join(', '))}
          helpTitle="YZ'den kriterler için yardım al"
        />
        <MethodBox margin="0 0 14px">Karar kriterleri kısıtları ve riskleri yansıtır; ağırlıkları önem sırasına göre, toplam 100 olacak şekilde dağıtın. Puanlamanın öznel kalmaması için her kritere <strong>1-3-5 puan tanımı</strong> yazın: "5" tam olarak neye verilir?</MethodBox>
        {!M.valid ? (
          <div role="alert" style={{ margin: '0 0 12px', font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--alert)', background: 'var(--alert-soft)', border: '1px solid var(--alert-border)', borderRadius: 8, padding: '9px 12px' }}>
            <strong>Ağırlık toplamı %{String(M.wsum).replace('.', ',')}</strong> — {M.wDelta > 0 ? String(M.wDelta).replace('.', ',') + ' puan eksik' : String(-M.wDelta).replace('.', ',') + ' puan fazla'}. Toplam %100 olana kadar matris puanları <strong>taslak</strong> sayılır.
          </div>
        ) : (
          <div style={{ margin: '0 0 12px', display: 'inline-block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ok-ink)', background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 20, padding: '4px 11px' }}>✓ Ağırlık toplamı %100 — matris geçerli</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {c.criteria.map((cr, i) => (
            <div key={i} style={{ border: '1px solid var(--line-2)', borderRadius: 8, padding: '10px 12px', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <textarea
                  className="pcx-field" value={cr.name} onChange={inp('criteria', i, 'name')}
                  placeholder="Kriter — örn. Etki, uygulama hızı, maliyet, risk"
                  aria-label={'Kriter ' + (i + 1) + ' adı'}
                  style={{ ...S.textarea, flex: 1, width: 'auto', minWidth: 180, minHeight: 40 }}
                />
                <input
                  className="pcx-field-sm" type="number" min="0" max="100" value={cr.weight} onChange={inp('criteria', i, 'weight')} placeholder="%"
                  aria-label={'Kriter ' + (i + 1) + ' ağırlığı (yüzde)'}
                  style={{ width: 76, boxSizing: 'border-box', padding: '9px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
                />
                <select
                  value={cr.yon || 'yuksek'} onChange={inp('criteria', i, 'yon')}
                  aria-label={'Kriter ' + (i + 1) + ' yönü'}
                  title="Ölçülen özelliğin yönü: 'yüksek iyi' (etki, hız) ya da 'düşük iyi' (maliyet, risk). Her iki durumda da 5 puan en iyi seçeneğe verilir."
                  style={{ ...S.select, width: 130, flex: 'none' }}
                >
                  <option value="yuksek">Yüksek iyi</option>
                  <option value="dusuk">Düşük iyi</option>
                </select>
                <RemoveButton onClick={() => removeC('karar kriteri (matris puanlarıyla)', cc => { cc.criteria.splice(i, 1); cc.scores = {}; })} />
              </div>
              <details>
                <summary style={{ cursor: 'pointer', font: '600 11.5px Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>
                  Puan tanımları ve kaynak {((cr.d1 || '') + (cr.d3 || '') + (cr.d5 || '')).trim() ? '✓' : '(önerilir — puanlamayı nesnelleştirir)'}
                </summary>
                <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
                  {[['d1', '1 PUAN = zayıf'], ['d3', '3 PUAN = orta'], ['d5', '5 PUAN = çok iyi']].map(([k, lb]) => (
                    <div key={k}>
                      <label style={{ display: 'block', font: '600 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.4px', margin: '0 0 4px' }}>{lb}</label>
                      <textarea
                        className="pcx-field-sm" value={cr[k] || ''} onChange={inp('criteria', i, k)}
                        placeholder="Bu puan neye verilir?"
                        style={{ ...S.textarea, font: '12px/1.45 Helvetica,Arial,sans-serif', minHeight: 40 }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8 }}>
                  <label style={{ display: 'block', font: '600 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.4px', margin: '0 0 4px' }}>PUANLAMA KAYNAĞI / DAYANAĞI</label>
                  <input
                    className="pcx-field-sm" value={cr.source || ''} onChange={inp('criteria', i, 'source')}
                    placeholder="Puanlar neye dayanıyor? Örn. pilot sonuçları, efor tahmini, uzman görüşü…"
                    style={S.inputSm}
                  />
                </div>
              </details>
            </div>
          ))}
          <AddButton onClick={() => updC(cc => cc.criteria.push({ name: '', weight: '', yon: 'yuksek', d1: '', d3: '', d5: '', source: '' }))}>+ Kriter ekle</AddButton>
        </div>
      </Card>

      {/* Karar matrisi */}
      {c.alternatives.length > 0 && c.criteria.length > 0 ? (
        <Card>
          <CardHead
            title="Karar Matrisi"
            sub="Her alternatifi her kritere göre puanlayın: 0 (zayıf) – 5 (çok iyi). Ağırlıklı toplam otomatik hesaplanır."
            aiReady={aiReady}
            onHelp={() => fieldHelp('Karar matrisi puanlaması', JSON.stringify(c.scores))}
            helpTitle="YZ'den puanlama için yardım al"
          />
          <MethodBox margin="0 0 14px">Ağırlıklı puanlama matrisi alternatifleri nesnel biçimde karşılaştırır; ama matris karar vermez, akıl yürütmenize girdi sağlar. Puanlar 1 (zayıf) – 5 (çok iyi); "düşük iyi" kriterlerde de en iyi seçenek 5 alır.</MethodBox>
          {!M.valid ? (
            <div role="alert" style={{ margin: '0 0 12px', font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--alert)', background: 'var(--alert-soft)', border: '1px solid var(--alert-border)', borderRadius: 8, padding: '9px 12px' }}>
              <strong>⚠ Puanlar geçersiz:</strong> Kriter ağırlıkları toplamı %{String(M.wsum).replace('.', ',')} — {M.wDelta > 0 ? String(M.wDelta).replace('.', ',') + ' puan eksik' : String(-M.wDelta).replace('.', ',') + ' puan fazla'}. Aşağıdaki toplamlar yalnızca ön izlemedir; karara dayanak yapmayın.
            </div>
          ) : null}
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 8, margin: '0 0 8px', minWidth: 560 }}>
              <div style={{ flex: 1, minWidth: 140, font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px' }}>ALTERNATİF</div>
              {M.head.map((mh, i) => {
                const cr = c.criteria[i] || {};
                const tip = [mh.name, mh.yon === 'dusuk' ? '(düşük iyi)' : '(yüksek iyi)', cr.d1 ? '1 = ' + cr.d1 : '', cr.d3 ? '3 = ' + cr.d3 : '', cr.d5 ? '5 = ' + cr.d5 : '', cr.source ? 'Kaynak: ' + cr.source : ''].filter(Boolean).join('\n');
                return (
                  <div key={i} title={tip} style={{ flex: '1 1 72px', minWidth: 72, maxWidth: 104, font: '700 11px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>
                    {mh.name}<br />%{mh.weight}
                    <span style={{ font: '400 10px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}> · {mh.yon === 'dusuk' ? 'düşük iyi' : 'yüksek iyi'}</span>
                  </div>
                );
              })}
              <div style={{ width: 56, flex: 'none', font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', textAlign: 'right' }}>PUAN</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 560 }}>
              {M.rows.map(mr => (
                <div key={mr.n} style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid var(--line-4)', paddingTop: 8 }}>
                  <div style={{ flex: 1, minWidth: 140, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}><strong>A{mr.n}</strong> · {mr.name}</div>
                  {mr.cells.map((cell, ci) => (
                    <input
                      key={cell.key} className="pcx-field-sm" type="number" min="0" max="5" value={cell.value}
                      aria-label={'A' + mr.n + ' — ' + ((M.head[ci] || {}).name || 'kriter') + ' puanı (0-5)'}
                      onChange={e => { const v = e.target.value; updC(cc => { cc.scores[cell.key] = v; }); }}
                      style={{ flex: '1 1 72px', minWidth: 72, maxWidth: 104, boxSizing: 'border-box', padding: '8px 9px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
                    />
                  ))}
                  <div style={{ width: 56, flex: 'none', font: '700 15px Helvetica,Arial,sans-serif', color: M.valid ? 'var(--pri)' : 'var(--muted)', textAlign: 'right' }}>{mr.total}</div>
                </div>
              ))}
            </div>
          </div>
          {M.best ? (
            <div style={{ marginTop: 14, background: M.valid ? 'var(--ok-soft)' : 'var(--surface-2)', border: '1px solid ' + (M.valid ? 'var(--ok-border)' : 'var(--line-2)'), borderRadius: 8, padding: '12px 14px', font: '13px/1.6 Helvetica,Arial,sans-serif', color: M.valid ? 'var(--ok-ink)' : 'var(--ink-3)' }}>
              <div><strong>{M.valid ? 'Matris önerisi' : 'Taslak sonuç'}:</strong> En yüksek ağırlıklı puan {M.best.total} ile <strong>A{M.best.n} — {M.best.name}</strong></div>
              {M.second ? (
                <div style={{ marginTop: 4 }}>
                  İkinci: A{M.second.n} ({M.second.total}) · Fark: {String(M.lead).replace('.', ',')} puan
                  {M.lead !== null && M.lead < 0.3 ? <strong> — fark çok küçük, matris tek başına ayırt etmiyor; niteliksel değerlendirme yapın.</strong> : null}
                </div>
              ) : null}
              {M.influential ? <div style={{ marginTop: 4 }}>Sonucu en çok belirleyen kriter: <strong>{M.influential.name}</strong> (üstünlüğe katkısı {String(M.influential.contrib).replace('.', ',')} puan)</div> : null}
              {M.sensitivity.length ? (
                <div style={{ marginTop: 4, color: 'var(--warn-ink)' }}>
                  <strong>Hassasiyet:</strong> {M.sensitivity.map(s => '"' + s.name + '" kriteri çıkarılırsa kazanan ' + s.newWinner + ' olur').join('; ')}. Sonuç bu kriterlere duyarlı — ağırlıkları gerçekten böyle mi?
                </div>
              ) : M.valid && M.second ? (
                <div style={{ marginTop: 4, color: 'var(--muted)' }}>Hassasiyet: Hiçbir kriteri çıkarmak kazananı değiştirmiyor — sonuç sağlam görünüyor.</div>
              ) : null}
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* Karar öncesi düşünme kontrolü */}
      <ThinkingCheck />

      {/* Karar */}
      <Card>
        <CardHead
          title="Karar"
          sub="Akıl yürüterek en doğru çözümü önerin; matris girdidir, karar sizindir."
          aiReady={aiReady}
          onHelp={() => fieldHelp('Karar ve gerekçe', (c.decision.choice || '') + ' | Gerekçe: ' + (c.decision.rationale || ''))}
          helpTitle="YZ'den karar için yardım al"
        />
        <MethodBox>Kararı kök nedenle ilişkilendirin — seçilen çözüm kök nedeni gidermiyorsa belirti tedavisidir. Gerekçenizde kısıt ve riskleri nasıl karşıladığınızı yazın.</MethodBox>

        <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border)', borderRadius: 8, padding: '12px 14px', margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dcIdle ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 220 }}>
                Rehber; alternatiflerinize, kriterlerinize ve matris puanlarınıza bakarak size bir karar önerisi hazırlayabilir.
                {dc && dc.status === 'error' ? <span style={{ color: 'var(--alert)' }}> Öneri hazırlanırken hata oluştu, tekrar deneyin.</span> : null}
              </div>
              <HButton onClick={runDecisionCoach} style={{ flex: 'none', ...S.ghostBtn, border: '1px solid var(--pri)', background: 'var(--pri)', color: 'var(--on-pri)' }} hover={S.primaryHover}>Rehberden karar önerisi al</HButton>
            </div>
          ) : null}
          {dc && dc.status === 'busy' ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Spinner />
              <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>Rehber çalışıyor — alternatifleriniz ve matris puanlarınız değerlendiriliyor…</div>
            </div>
          ) : null}
          {dc && dc.status === 'done' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px' }}>REHBERİN KARAR ÖNERİSİ</div>
              <div style={{ font: '600 13px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{dc.choice}</div>
              <div style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{dc.rationale}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <HButton
                  onClick={() => updC(cc => { if (!cc.decisionCoach) return; cc.decision.choice = cc.decisionCoach.choice; cc.decision.rationale = cc.decisionCoach.rationale; })}
                  style={{ padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                  hover={S.primaryHover}
                >Karar alanlarına aktar</HButton>
                <HButton onClick={runDecisionCoach} style={S.ghostBtn} hover={S.ghostHover}>Yeniden öner</HButton>
                <HButton
                  onClick={() => updC(cc => { delete cc.decisionCoach; })}
                  style={{ padding: '8px 14px', border: 'none', background: 'transparent', color: 'var(--muted)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                  hover={{ color: 'var(--ink-3)' }}
                >Kapat</HButton>
              </div>
              <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>Öneri bir girdidir; karar sizindir. Aktardıktan sonra kendi akıl yürütmenizle düzenleyin.</div>
            </div>
          ) : null}
        </div>

        <label style={S.label}>Kararınız / önerdiğiniz çözüm</label>
        <textarea
          className="pcx-field" value={c.decision.choice} onChange={inp('decision', 'choice')}
          style={{ ...S.textarea, font: '14px/1.45 Helvetica,Arial,sans-serif', minHeight: 52, height: 122, margin: '0 0 12px' }}
        />
        <label style={S.label}>Gerekçe (akıl yürütme)</label>
        <textarea
          className="pcx-field" value={c.decision.rationale} onChange={inp('decision', 'rationale')}
          placeholder="Bu karar kök nedeni nasıl gideriyor? Hangi kısıt ve riskleri nasıl karşılıyor?"
          style={{ ...S.textarea, minHeight: 76, height: 376 }}
        />
      </Card>

      {/* Pre-mortem (Klein) */}
      {hasDecision ? (
        <Card>
          <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>Pre-Mortem — Karar Başarısız Olsaydı?</div>
          <div style={S.cardSub}>Karar verildi; şimdi son savunma hattı. 6 ay sonrasını hayal edin: karar uygulandı ve başarısız oldu. Ne oldu?</div>
          <MethodBox margin="0 0 14px">Gary Klein'ın yöntemi — olayı "olabilir" değil <strong>"oldu"</strong> diye hayal etmek, başarısızlık nedeni tespitini ~%30 artırır ve aşırı güveni ölçülebilir düşürür. Çekinceleri planlama aşamasında konuşulur kılar.</MethodBox>

          <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border)', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pmIdle ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 220 }}>
                  Rehber; kararınız, aksiyonlarınız ve kök nedenlerinize bakarak 4-5 olası başarısızlık senaryosu, erken uyarı sinyalleri ve önleyici tedbirler üretir.
                  {pm && pm.status === 'error' ? <span style={{ color: 'var(--alert)' }}> Senaryolar üretilemedi, tekrar deneyin.</span> : null}
                </div>
                <HButton
                  onClick={runPremortem}
                  style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                  hover={S.primaryHover}
                >⏳ Pre-mortem çalıştır</HButton>
              </div>
            ) : null}

            {pm && pm.status === 'busy' ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Spinner />
                <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>6 ay sonrası hayal ediliyor — başarısızlık senaryoları yazılıyor…</div>
              </div>
            ) : null}

            {pm && pm.status === 'done' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pm.giris ? <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{pm.giris}</div> : null}
                {(pm.items || []).map((it, i) => (
                  <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '11px 13px' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ font: '700 13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', margin: '0 0 4px' }}>💥 {it.baslik}</div>
                        <div style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 6px' }}>{it.hikaye}</div>
                        {it.sinyal ? <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', margin: '0 0 3px' }}><strong>Erken sinyal:</strong> {it.sinyal}</div> : null}
                        {it.onlem ? <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ok-ink)' }}><strong>Önleyici tedbir:</strong> {it.onlem}</div> : null}
                      </div>
                      {it.onlem ? (
                        <button
                          onClick={() => updC(cc => {
                            const x = cc.premortem && cc.premortem.items[i];
                            if (!x || x.added) return;
                            cc.actions = cc.actions || [];
                            cc.actions.push({ text: x.onlem, owner: '', due: '', startDate: '', dueDate: '', rcIdx: '', successCriteria: x.sinyal ? 'Erken sinyal izlenir: ' + x.sinyal : '', evidence: '', delayReason: '', etki: '', efor: '', note: 'Pre-mortem tedbiri: ' + x.baslik });
                            x.added = true;
                          })}
                          style={{
                            flex: 'none',
                            border: '1px solid ' + (it.added ? 'var(--ok-border)' : 'var(--pri)'),
                            background: it.added ? 'var(--ok-soft)' : 'var(--pri)',
                            color: it.added ? 'var(--ok)' : 'var(--on-pri)',
                            borderRadius: 6, padding: '7px 12px', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer'
                          }}
                        >{it.added ? 'Eklendi ✓' : 'Tedbiri plana ekle'}</button>
                      ) : null}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <HButton onClick={runPremortem} style={{ padding: '7px 12px', border: '1px solid var(--pri-border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--pri)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.ghostHover}>Yeniden çalıştır</HButton>
                  <HButton onClick={() => updC(cc => { delete cc.premortem; })} style={{ padding: '7px 12px', border: 'none', background: 'transparent', color: 'var(--muted)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ color: 'var(--ink-3)' }}>Kapat</HButton>
                </div>
                <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>Senaryolar hipotezdir; hangi tedbirin plana gireceğine siz karar verin. Erken sinyalleri Adım 7'deki izlemeye taşımayı unutmayın.</div>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* Aksiyon planı */}
      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>Aksiyon Planı</div>
        <div style={S.cardSub}>Kararı hayata geçirecek somut adımları yazın; sorumlu ve süre atayın, etki/efora göre önceliklendirin.</div>
        <MethodBox margin="0 0 14px">Etki/Efor matrisi — yüksek etki + düşük efor "hızlı kazanım"dır, önce yapılır; yüksek etki + yüksek efor "stratejik"tir, planlanır; düşük etki + yüksek efor sorgulanmalıdır. Her aksiyonun ölçülebilir bir çıktısı ve tek bir sorumlusu olmalıdır.</MethodBox>

        <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border)', borderRadius: 8, padding: '12px 14px', margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {acIdle ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 220 }}>
                Rehber; kararınıza, kök nedenlerinize ve bulgularınıza bakarak önceliklendirilmiş aksiyonlar önerebilir.
                {ac && ac.status === 'error' ? <span style={{ color: 'var(--alert)' }}> Öneri hazırlanırken hata oluştu, tekrar deneyin.</span> : null}
              </div>
              <HButton onClick={runActionCoach} style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.primaryHover}>Rehberden aksiyon önerisi al</HButton>
            </div>
          ) : null}
          {ac && ac.status === 'busy' ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Spinner />
              <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>Rehber çalışıyor — karar ve kök nedenlerinize göre aksiyonlar hazırlanıyor…</div>
            </div>
          ) : null}
          {ac && ac.status === 'done' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px' }}>REHBERİN AKSİYON ÖNERİLERİ</div>
              {(ac.items || []).map((it, i) => {
                const p = prioMeta(it);
                const sub = [it.sorumluRol, it.sure, (it.etki && it.efor) ? 'Etki ' + it.etki + ' · Efor ' + it.efor : '', it.gerekce].filter(Boolean).join(' · ');
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--surface)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '11px 13px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ flex: 'none', padding: '4px 9px', borderRadius: 20, border: '1px solid ' + p.border, background: p.bg, color: p.color, font: '700 10px Helvetica,Arial,sans-serif' }}>{p.label}</span>
                        <span style={{ font: '600 13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{it.aksiyon}</span>
                      </div>
                      <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-4)', marginTop: 4 }}>{sub}</div>
                    </div>
                    <button
                      onClick={() => updC(cc => {
                        const x = cc.actionCoach && cc.actionCoach.items[i];
                        if (!x || x.added) return;
                        cc.actions = cc.actions || [];
                        cc.actions.push({ text: x.aksiyon, owner: x.sorumluRol, due: x.sure, startDate: '', dueDate: '', rcIdx: '', successCriteria: '', evidence: '', delayReason: '', etki: x.etki, efor: x.efor });
                        x.added = true;
                      })}
                      style={{
                        flex: 'none',
                        border: '1px solid ' + (it.added ? 'var(--ok-border)' : 'var(--pri)'),
                        background: it.added ? 'var(--ok-soft)' : 'var(--pri)',
                        color: it.added ? 'var(--ok)' : 'var(--on-pri)',
                        borderRadius: 6, padding: '7px 12px', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer'
                      }}
                    >{it.added ? 'Eklendi ✓' : 'Plana ekle'}</button>
                  </div>
                );
              })}
              <div style={{ display: 'flex', gap: 8 }}>
                <HButton onClick={runActionCoach} style={{ padding: '7px 12px', border: '1px solid var(--pri-border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--pri)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.ghostHover}>Yeniden öner</HButton>
                <HButton onClick={() => updC(cc => { delete cc.actionCoach; })} style={{ padding: '7px 12px', border: 'none', background: 'transparent', color: 'var(--muted)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ color: 'var(--ink-3)' }}>Kapat</HButton>
              </div>
            </div>
          ) : null}
        </div>

        {(c.actions || []).length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '0 0 12px' }}>
            {c.actions.map((a, i) => {
              const p = prioMeta(a);
              const late = isOverdue(a);
              return (
                <div key={i} style={{ ...S.itemCard, border: late ? '1px solid var(--alert-border)' : S.itemCard.border }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Badge>{i + 1}</Badge>
                    <textarea
                      className="pcx-field" value={a.text} onChange={inp('actions', i, 'text')}
                      placeholder="Aksiyon — ölçülebilir çıktısı olan somut bir iş"
                      aria-label={(i + 1) + '. aksiyon tanımı'}
                      style={{ ...S.textarea, flex: 1, width: 'auto', minHeight: 46 }}
                    />
                    {late ? <div style={{ flex: 'none', padding: '5px 10px', borderRadius: 20, border: '1px solid var(--alert-border)', background: 'var(--alert-soft)', color: 'var(--alert)', font: '700 10.5px Helvetica,Arial,sans-serif', marginTop: 4 }}>⏰ GECİKTİ</div> : null}
                    <div style={{ flex: 'none', padding: '5px 10px', borderRadius: 20, border: '1px solid ' + p.border, background: p.bg, color: p.color, font: '700 10.5px Helvetica,Arial,sans-serif', marginTop: 4 }}>{p.label}</div>
                    <RemoveButton onClick={() => removeC('aksiyon', cc => cc.actions.splice(i, 1))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr 1fr' : '1.4fr 1fr 1fr .7fr .7fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>SORUMLU</label>
                      <input className="pcx-field-sm" value={a.owner} onChange={inp('actions', i, 'owner')} placeholder="Rol / kişi" aria-label={(i + 1) + '. aksiyonun sorumlusu'} style={S.inputSm} />
                    </div>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>BAŞLANGIÇ</label>
                      <input className="pcx-field-sm" type="date" value={a.startDate || ''} onChange={inp('actions', i, 'startDate')} aria-label={(i + 1) + '. aksiyonun başlangıç tarihi'} style={S.inputSm} />
                    </div>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>TERMİN</label>
                      <input className="pcx-field-sm" type="date" value={a.dueDate || ''} onChange={inp('actions', i, 'dueDate')} aria-label={(i + 1) + '. aksiyonun termin tarihi'} style={{ ...S.inputSm, borderColor: late ? 'var(--alert)' : undefined }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>ETKİ (1-5)</label>
                      <select value={a.etki || ''} onChange={inp('actions', i, 'etki')} aria-label={(i + 1) + '. aksiyonun etkisi'} style={S.select}>
                        <option value="">—</option>{[1, 2, 3, 4, 5].map(v => <option key={v} value={String(v)}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>EFOR (1-5)</label>
                      <select value={a.efor || ''} onChange={inp('actions', i, 'efor')} aria-label={(i + 1) + '. aksiyonun eforu'} style={S.select}>
                        <option value="">—</option>{[1, 2, 3, 4, 5].map(v => <option key={v} value={String(v)}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  {(a.due || '').trim() && !(a.dueDate || '').trim() ? (
                    <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)' }}>
                      Eski termin kaydı: "<strong>{a.due}</strong>" — takip ve gecikme uyarısı için lütfen gerçek bir termin tarihi seçin.
                    </div>
                  ) : null}
                  <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>HANGİ KÖK NEDENİ GİDERİYOR?</label>
                      <select value={String(a.rcIdx ?? '')} onChange={inp('actions', i, 'rcIdx')} aria-label={(i + 1) + '. aksiyonun bağlı olduğu kök neden'} style={S.select}>
                        <option value="">— seçilmedi —</option>
                        {(c.rootCauses || []).map((rc, ri) => (rc.text || '').trim()
                          ? <option key={ri} value={String(ri)}>KN{ri + 1} — {rc.text.slice(0, 60)}</option> : null)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>BAŞARI ÖLÇÜTÜ</label>
                      <input
                        className="pcx-field-sm" value={a.successCriteria || ''} onChange={inp('actions', i, 'successCriteria')}
                        placeholder="Ne olursa bu aksiyon başarılı sayılır? (ölçülebilir)"
                        aria-label={(i + 1) + '. aksiyonun başarı ölçütü'} style={S.inputSm}
                      />
                    </div>
                  </div>
                  {String(a.rcIdx ?? '') === '' ? (
                    <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
                      Kök nedene bağlanmamış aksiyonlar izlenebilirlik denetiminde işaretlenir — bu aksiyon hangi kök nedeni gideriyor?
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <AddButton
            onClick={() => updC(cc => { cc.actions = cc.actions || []; cc.actions.push({ text: '', owner: '', due: '', startDate: '', dueDate: '', rcIdx: '', successCriteria: '', evidence: '', delayReason: '', etki: '', efor: '' }); })}
            style={{ flex: 1, minWidth: 160, width: 'auto' }}
          >+ Aksiyon ekle</AddButton>
          {(c.actions || []).length ? (
            <HButton
              onClick={() => updC(cc => cc.actions.sort((x, y) => prioMeta(y).score - prioMeta(x).score))}
              style={{ flex: 'none', padding: '10px 14px', border: '1px solid var(--field-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={{ background: 'var(--surface-4)' }}
            >Önceliğe göre sırala</HButton>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
