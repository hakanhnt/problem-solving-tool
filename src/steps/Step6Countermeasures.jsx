import React, { useState } from 'react';
import { useStore, prioMeta } from '../lib/store.jsx';
import { THINKING_METHODS } from '../lib/defaults.js';
import { THINKING_METHOD_INFO } from '../lib/thinking.js';
import { decisionMatrix } from '../lib/derive.js';
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
  const { c, updC, inp, fieldHelp, runDecisionCoach, runActionCoach, removeC } = useStore();
  const aiReady = (c.problem.statement || '').trim().length > 0;
  const M = decisionMatrix(c);
  const narrow = useNarrow();

  const dc = c.decisionCoach;
  const dcIdle = !dc || dc.status === 'idle' || dc.status === 'error';
  const ac = c.actionCoach;
  const acIdle = !ac || ac.status === 'idle' || ac.status === 'error';

  return (
    <div>
      <GuidanceBox items={QUESTIONS} />

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
        <MethodBox margin="0 0 14px">Karar kriterleri kısıtları ve riskleri yansıtır; ağırlıkları önem sırasına göre, toplam 100 olacak şekilde dağıtın.</MethodBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {c.criteria.map((cr, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <textarea
                className="pcx-field" value={cr.name} onChange={inp('criteria', i, 'name')}
                placeholder="Kriter — örn. Etki, uygulama hızı, maliyet, risk"
                style={{ ...S.textarea, flex: 1, width: 'auto', minHeight: 40 }}
              />
              <input
                className="pcx-field-sm" type="number" min="0" max="100" value={cr.weight} onChange={inp('criteria', i, 'weight')} placeholder="%"
                style={{ width: 88, boxSizing: 'border-box', padding: '9px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
              />
              <RemoveButton onClick={() => removeC('karar kriteri (matris puanlarıyla)', cc => { cc.criteria.splice(i, 1); cc.scores = {}; })} />
            </div>
          ))}
          <AddButton onClick={() => updC(cc => cc.criteria.push({ name: '', weight: '' }))}>+ Kriter ekle</AddButton>
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
          <MethodBox margin="0 0 14px">Ağırlıklı puanlama matrisi alternatifleri nesnel biçimde karşılaştırır; ama matris karar vermez, akıl yürütmenize girdi sağlar.</MethodBox>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 8, margin: '0 0 8px', minWidth: 560 }}>
              <div style={{ flex: 1, minWidth: 140, font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px' }}>ALTERNATİF</div>
              {M.head.map((mh, i) => (
                <div key={i} style={{ flex: '1 1 72px', minWidth: 72, maxWidth: 104, font: '700 11px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{mh.name}<br />%{mh.weight}</div>
              ))}
              <div style={{ width: 56, flex: 'none', font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', textAlign: 'right' }}>PUAN</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 560 }}>
              {M.rows.map(mr => (
                <div key={mr.n} style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid var(--line-4)', paddingTop: 8 }}>
                  <div style={{ flex: 1, minWidth: 140, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}><strong>A{mr.n}</strong> · {mr.name}</div>
                  {mr.cells.map(cell => (
                    <input
                      key={cell.key} className="pcx-field-sm" type="number" min="0" max="5" value={cell.value}
                      onChange={e => { const v = e.target.value; updC(cc => { cc.scores[cell.key] = v; }); }}
                      style={{ flex: '1 1 72px', minWidth: 72, maxWidth: 104, boxSizing: 'border-box', padding: '8px 9px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
                    />
                  ))}
                  <div style={{ width: 56, flex: 'none', font: '700 15px Helvetica,Arial,sans-serif', color: 'var(--pri)', textAlign: 'right' }}>{mr.total}</div>
                </div>
              ))}
            </div>
          </div>
          {M.best ? (
            <div style={{ marginTop: 14, background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 8, padding: '12px 14px', font: '13px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ok-ink)' }}>
              <strong>Matris önerisi:</strong> En yüksek ağırlıklı puan {M.best.total} ile <strong>A{M.best.n} — {M.best.name}</strong>
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
                        cc.actions.push({ text: x.aksiyon, owner: x.sorumluRol, due: x.sure, etki: x.etki, efor: x.efor });
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
              return (
                <div key={i} style={S.itemCard}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Badge>{i + 1}</Badge>
                    <textarea
                      className="pcx-field" value={a.text} onChange={inp('actions', i, 'text')}
                      placeholder="Aksiyon — ölçülebilir çıktısı olan somut bir iş"
                      style={{ ...S.textarea, flex: 1, width: 'auto', minHeight: 46 }}
                    />
                    <div style={{ flex: 'none', padding: '5px 10px', borderRadius: 20, border: '1px solid ' + p.border, background: p.bg, color: p.color, font: '700 10.5px Helvetica,Arial,sans-serif', marginTop: 4 }}>{p.label}</div>
                    <RemoveButton onClick={() => removeC('aksiyon', cc => cc.actions.splice(i, 1))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr 1fr' : '1.4fr 1fr .7fr .7fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>SORUMLU</label>
                      <input className="pcx-field-sm" value={a.owner} onChange={inp('actions', i, 'owner')} placeholder="Rol / kişi" style={S.inputSm} />
                    </div>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>SÜRE / TERMİN</label>
                      <input className="pcx-field-sm" value={a.due} onChange={inp('actions', i, 'due')} placeholder="Örn. 2 hafta" style={S.inputSm} />
                    </div>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>ETKİ (1-5)</label>
                      <select value={a.etki || ''} onChange={inp('actions', i, 'etki')} style={S.select}>
                        <option value="">—</option>{[1, 2, 3, 4, 5].map(v => <option key={v} value={String(v)}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>EFOR (1-5)</label>
                      <select value={a.efor || ''} onChange={inp('actions', i, 'efor')} style={S.select}>
                        <option value="">—</option>{[1, 2, 3, 4, 5].map(v => <option key={v} value={String(v)}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <AddButton
            onClick={() => updC(cc => { cc.actions = cc.actions || []; cc.actions.push({ text: '', owner: '', due: '', etki: '', efor: '' }); })}
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
