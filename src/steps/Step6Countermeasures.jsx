import React, { useState } from 'react';
import { useStore, prioMeta } from '../lib/store.jsx';
import { preCheckItemsFor } from '../lib/mindcheck.js';
import { THINKING_METHODS, thinkingMethodsFor } from '../lib/defaults.js';
import { fmtNum } from '../lib/i18n.js';
import { THINKING_METHOD_INFO } from '../lib/thinking.js';
import { decisionMatrix, isOverdue, timingAdvice } from '../lib/derive.js';
import ThinkingCheck from '../components/ThinkingCheck.jsx';
import { Card, CardHead, GuidanceBox, MethodBox, AddButton, RemoveButton, YZButton, Badge, HButton, Spinner, AdvancedSection, S, useNarrow } from '../ui/primitives.jsx';

/**
 * Seçilen düşünme yönteminin karşı çalıştığı yanılgı ve ekip soruları.
 * Kaynak: "Düşünme Yöntemlerine Göre Güçlü Ekip Soruları" kurum dokümanı.
 */
function MethodQuestions({ method }) {
  const [open, setOpen] = useState(false);
  const { t } = useStore();
  const info = THINKING_METHOD_INFO[method];
  if (!info) return null;
  return (
    <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '9px 12px' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 200 }}>
          {t('Bu yöntem ', 'This method counters the ')}<strong>{info.bias}</strong>{t(' yanılgısına karşı çalışır', ' bias')} · {info.amac}
        </span>
        <HButton
          onClick={() => setOpen(!open)}
          style={{ flex: 'none', padding: '5px 10px', border: '1px solid var(--pri-border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--pri)', font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
          hover={{ background: 'var(--pri-soft-3)' }}
        >{open ? t('Soruları gizle', 'Hide questions') : t('Ekibe sorulacak ' + info.sorular.length + ' soru', info.sorular.length + ' questions to ask the team')}</HButton>
      </div>
      {open ? (
        <ul style={{ margin: '8px 0 0', padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {info.sorular.map((q, i) => <li key={i} style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{q}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

const questionsFor = t => [
  t('Nasıl çözeceğiz, ne yapacağız? Yerine göre doğru düşünme yöntemlerini kullanarak alternatifler ürettim mi?', 'How will we solve it, what will we do? Did I generate alternatives using the right thinking methods for the situation?'),
  t('Kısıtları ve riskleri dikkate alarak karar kriterlerini belirledim mi?', 'Did I set the decision criteria considering constraints and risks?'),
  t('Alternatifleri kriterlere göre yarıştırdım mı?', 'Did I race the alternatives against the criteria?'),
  t('Seçtiğim çözüm kök nedeni mi gideriyor, yoksa sadece belirtiyi mi?', 'Does my chosen solution address the root cause, or only the symptom?'),
  t('İlk aklıma gelen çözüme mi çapalandım — en az iki gerçek alternatif ürettim mi? (çapa etkisi)', 'Did I anchor on the first solution that came to mind — did I generate at least two real alternatives? (anchoring effect)'),
  t('Bu seçeneği geleceğe bakarak mı, yoksa geçmişteki yatırımı savunmak için mi tutuyorum? (batık maliyet)', 'Am I keeping this option looking to the future, or to defend past investment? (sunk cost)')
];

/** Öncelik rozeti etiketi — store TR üretir; EN karşılığı burada eşlenir. */
const PRIO_LABELS_EN = {
  'Yüksek öncelik': 'High priority',
  'Orta öncelik': 'Medium priority',
  'Düşük öncelik': 'Low priority',
  'Puanlayın': 'Score it',
  'Hızlı kazanım': 'Quick win',
  'Stratejik': 'Strategic',
  'Ara kazanım': 'Small win',
  'Sorgulanmalı': 'Questionable'
};

export default function Step6Countermeasures() {
  const { c, updC, inp, fieldHelp, runDecisionCoach, runActionCoach, runPremortem, runSimilarCases, runFmeaCoach, applyFmeaCoach, runForceCoach, applyForceCoach, runContainmentCoach, applyContainment, runMatrixCoach, applyMatrixCoach, removeC, t, lang } = useStore();
  const aiReady = (c.problem.statement || '').trim().length > 0;
  const M = decisionMatrix(c, lang);
  const prioLabel = l => t(l, PRIO_LABELS_EN[l] || l);
  const TM_LABELS = thinkingMethodsFor(lang);
  const narrow = useNarrow();

  const dc = c.decisionCoach;
  const dcIdle = !dc || dc.status === 'idle' || dc.status === 'error';
  const ac = c.actionCoach;
  const acIdle = !ac || ac.status === 'idle' || ac.status === 'error';
  const pm = c.premortem;
  const simc = c.similarCases;
  const fmc = c.fmeaCoach;
  const foc = c.forceCoach;
  const rpnOf = r => { const v = (parseInt(r.s, 10) || 0) * (parseInt(r.o, 10) || 0) * (parseInt(r.d, 10) || 0); return v > 0 ? v : null; };
  const simIdle = !simc || simc.status === 'idle' || simc.status === 'error';
  const pmIdle = !pm || pm.status === 'idle' || pm.status === 'error';
  const coc = c.containmentCoach;
  const mc = c.matrixCoach;
  const hasDecision = (c.decision.choice || '').trim().length > 0;

  return (
    <div>
      <GuidanceBox items={questionsFor(t)} />

      {/* Geçici önlem (8D-D3) */}
      <Card>
        <CardHead
          title={t('Geçici Önlem — Kanamayı Durdurun', 'Containment — Stop the Bleeding')}
          sub={t('Kök neden analizi ve kalıcı çözüm zaman alır; bu sırada müşteriyi / süreci bugün ne koruyor?', 'Root cause analysis and the permanent fix take time; meanwhile, what protects the customer / process today?')}
          aiReady={aiReady}
          onHelp={() => fieldHelp(t('Geçici önlem (containment)', 'Containment'), [c.containment.action, c.containment.owner, c.containment.until].filter(Boolean).join(' | '))}
          helpTitle={t("YZ'den geçici önlem için yardım al", 'Get AI help for containment')}
        />
        <MethodBox>{t('8D metodolojisinin D3 disiplini — geçici önlem 24-48 saat içinde devrede olmalıdır. ', 'Discipline D3 of the 8D methodology — containment must be in place within 24-48 hours. ')}<strong>{t('Geçici önlem problemi çözmez, çözüm için zaman kazandırır:', 'Containment does not solve the problem; it buys time for the solution:')}</strong>{t(' kalıcı çözüm doğrulanınca kaldırılır. Karar asla geçici önlemin kendisi olamaz.', ' it is removed once the permanent fix is verified. The decision can never be the containment itself.')}</MethodBox>

        {/* Rehberden geçici önlem adayları — seçilen aday yalnız boş alanlara aktarılır */}
        {aiReady ? (
          <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border)', borderRadius: 8, padding: '12px 14px', margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!coc || coc.status === 'error' ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 220 }}>
                  {t('Rehber; probleminize ve bulgularınıza bakarak farklı türlerde 2-3 geçici önlem adayı önerebilir — her biri sorumlu rol ve kaldırma koşuluyla.', 'The coach can suggest 2-3 containment candidates of different types based on your problem and findings — each with an owner role and a removal condition.')}
                  {coc && coc.status === 'error' ? <span style={{ color: 'var(--alert)' }}>{t(' Öneri hazırlanamadı', ' Could not prepare a suggestion')}{coc.errMsg ? ' (' + coc.errMsg + ')' : ''}{t(' — tekrar deneyin.', ' — try again.')}</span> : null}
                </div>
                <HButton onClick={runContainmentCoach} style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.primaryHover}>{t('Rehberden geçici önlem önerisi al', 'Get containment suggestions from the coach')}</HButton>
              </div>
            ) : null}

            {coc && coc.status === 'busy' ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Spinner />
                <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>{t('Geçici önlem adayları hazırlanıyor…', 'Preparing containment candidates…')}</div>
              </div>
            ) : null}

            {coc && coc.status === 'done' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px' }}>{t('GEÇİCİ ÖNLEM ADAYLARI — hipotezdir, uygulanabilirliğini doğrulayın', 'CONTAINMENT CANDIDATES — hypotheses; verify their feasibility')}</div>
                {coc.truncated ? <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)' }}>{t('Yanıt uzunluk sınırına takıldı; tamamlanabilen adaylar gösteriliyor.', 'The response hit the length limit; showing the candidates that completed.')}</div> : null}
                {coc.giris ? <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{coc.giris}</div> : null}
                {(coc.items || []).map((it, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--surface)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '11px 13px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ font: '600 13px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{it.onlem}</div>
                      <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-4)', marginTop: 4 }}>
                        {[it.rol ? t('Sorumlu: ', 'Owner: ') + it.rol : '', it.kosul ? t('Kaldırma koşulu: ', 'Removal condition: ') + it.kosul : ''].filter(Boolean).join(' · ')}
                      </div>
                      {it.dikkat ? <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', marginTop: 3 }}>{t('Dikkat: ', 'Caution: ')}{it.dikkat}</div> : null}
                    </div>
                    <button
                      onClick={() => applyContainment(i)}
                      disabled={it.applied}
                      style={{
                        flex: 'none',
                        border: '1px solid ' + (it.applied ? 'var(--ok-border)' : 'var(--pri)'),
                        background: it.applied ? 'var(--ok-soft)' : 'var(--pri)',
                        color: it.applied ? 'var(--ok)' : 'var(--on-pri)',
                        borderRadius: 6, padding: '7px 12px', font: '600 12px Helvetica,Arial,sans-serif', cursor: it.applied ? 'default' : 'pointer'
                      }}
                    >{it.applied ? t('Aktarıldı ✓', 'Applied ✓') : t('Boş alanlara aktar', 'Copy to empty fields')}</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <HButton onClick={runContainmentCoach} style={{ padding: '7px 12px', border: '1px solid var(--pri-border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--pri)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.ghostHover}>{t('Yeniden öner', 'Suggest again')}</HButton>
                  <HButton onClick={() => updC(cc => { delete cc.containmentCoach; })} style={{ padding: '7px 12px', border: 'none', background: 'transparent', color: 'var(--muted)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ color: 'var(--ink-3)' }}>{t('Kapat', 'Close')}</HButton>
                </div>
                {(coc.sorular || []).length ? (
                  <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {coc.sorular.map((q, i) => <li key={i} style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{q}</li>)}
                  </ul>
                ) : null}
                <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t("Aktarım yalnız boş alanlara yapılır — yazdıklarınız ezilmez. Geçici önlem kök nedeni çözmez; kaldırma koşulunu Adım 7'de takip edin.", 'Values are copied only into empty fields — your text is not overwritten. Containment does not fix the root cause; track the removal condition in Step 7.')}</div>
              </div>
            ) : null}
          </div>
        ) : null}
        <textarea
          className="pcx-field" value={c.containment.action} onChange={inp('containment', 'action')}
          placeholder={t('Örn. şüpheli parti karantinaya alındı; kritik siparişlerde ek kontrol; kısmi hava kargo; manuel doğrulama adımı…', 'E.g. suspect batch quarantined; extra checks on critical orders; partial air freight; manual verification step…')}
          style={{ ...S.textarea, minHeight: 52, margin: '0 0 12px' }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1.4fr', gap: 12 }}>
          <div>
            <label style={S.label}>{t('Sorumlu', 'Owner')}</label>
            <input className="pcx-field-sm" value={c.containment.owner} onChange={inp('containment', 'owner')} placeholder={t('Rol / kişi', 'Role / person')} style={S.inputSm} />
          </div>
          <div>
            <label style={S.label}>{t('Ne zamana kadar / hangi koşulda kaldırılacak?', 'Until when / under what condition will it be removed?')}</label>
            <input className="pcx-field-sm" value={c.containment.until} onChange={inp('containment', 'until')} placeholder={t('Örn. kalıcı çözüm KPI ile doğrulanana kadar', 'E.g. until the permanent fix is verified via the KPI')} style={S.inputSm} />
          </div>
        </div>
        {(c.containment.action || '').trim() ? (
          <div style={{ marginTop: 12, display: 'inline-flex', gap: 8, alignItems: 'center', background: c.containment.removed ? 'var(--ok-soft)' : 'var(--warn-soft)', border: '1px solid ' + (c.containment.removed ? 'var(--ok-border)' : 'var(--warn-border)'), borderRadius: 20, padding: '5px 12px' }}>
            <span style={{ font: '600 11.5px Helvetica,Arial,sans-serif', color: c.containment.removed ? 'var(--ok-ink)' : 'var(--warn-ink)' }}>
              {c.containment.removed ? t('✓ Geçici önlem kaldırıldı', '✓ Containment removed') : t('⏳ Geçici önlem devrede — kalıcı çözüm doğrulanınca Adım 7\'de kaldırın', '⏳ Containment in effect — remove it in Step 7 once the permanent fix is verified')}
            </span>
          </div>
        ) : null}
      </Card>

      {/* Alternatif çözümler */}
      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>{t('Alternatif Çözümler', 'Alternative Solutions')}</div>
        <div style={S.cardSub}>{t('Her alternatifin hangi düşünme yöntemiyle üretildiğini işaretleyin.', 'Mark which thinking method produced each alternative.')}</div>
        <MethodBox margin="0 0 14px">{t('Farklı düşünme biçimleri (ilk ilkeler, yanal, sistem, tasarım...) farklı çözüm uzayları açar. En az 3 alternatif üretin; aklınıza ilk geleni hemen seçmeyin.', 'Different modes of thinking (first principles, lateral, systems, design...) open different solution spaces. Generate at least 3 alternatives; do not immediately pick the first idea that comes to mind.')}</MethodBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {c.alternatives.map((a, i) => (
            <div key={i} style={S.itemCard}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Badge bg="var(--ok)">A{i + 1}</Badge>
                <textarea
                  className="pcx-field" value={a.name} onChange={inp('alternatives', i, 'name')} placeholder={t('Alternatif çözüm', 'Alternative solution')}
                  style={{ ...S.textarea, flex: 1, width: 'auto', font: '600 13px/1.45 Helvetica,Arial,sans-serif', minHeight: 48 }}
                />
                {aiReady ? <YZButton onClick={() => fieldHelp(t('Alternatif çözüm A', 'Alternative solution A') + (i + 1), [a.name, a.method, a.note].filter(Boolean).join(' | '))} title={t("YZ'den bu alternatif için yardım al", 'Get AI help for this alternative')} /> : null}
                <RemoveButton onClick={() => removeC(t('alternatif (matris puanlarıyla)', 'alternative (with its matrix scores)'), cc => { cc.alternatives.splice(i, 1); cc.scores = {}; })} />
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <label style={{ flex: 'none', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{t('Düşünme yöntemi:', 'Thinking method:')}</label>
                <select
                  value={a.method} onChange={inp('alternatives', i, 'method')}
                  style={{ ...S.select, flex: 1, font: '13px Helvetica,Arial,sans-serif' }}
                >
                  <option value="">{t('Seçin…', 'Choose…')}</option>
                  {THINKING_METHODS.map((m, mi) => <option key={m} value={m}>{TM_LABELS[mi] || m}</option>)}
                </select>
              </div>
              <MethodQuestions method={a.method} />
              <textarea
                className="pcx-field" value={a.note} onChange={inp('alternatives', i, 'note')}
                placeholder={t('Nasıl uygulanır, hangi kısıt/riskleri var?', 'How is it implemented; what constraints/risks does it have?')}
                style={{ ...S.textarea, minHeight: 48, height: 150 }}
              />
            </div>
          ))}
          <AddButton onClick={() => updC(cc => cc.alternatives.push({ name: '', method: '', note: '' }))}>{t('+ Alternatif ekle', '+ Add alternative')}</AddButton>
        </div>
      </Card>

      {/* Benzer vakalar — YZ sentezi; kaynak gösterilmez, her kart etiketlidir */}
      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>{t('📚 Benzer Vakalar — YZ Sentezi', '📚 Similar Cases — AI Synthesis')}</div>
        <div style={S.cardSub}>{t('Benzer problemi yaşamış kuruluşların yaygın bilinen deneyimlerinden analog vakalar — çözüm uzayını genişletmek ve pre-mortem\'i beslemek için.', 'Analog cases from widely known experiences of organizations that faced a similar problem — to widen the solution space and feed the pre-mortem.')}</div>
        <div style={{ font: '12px/1.6 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 8, padding: '8px 11px', margin: '0 0 12px' }}>
          {t('Bu vakalar YZ\'nin genel bilgisinden sentezlenir; kaynak doğrulaması YAPILMAZ ve kaynak gösterilmez. Emsal değil ilham olarak kullanın; kritik bir karara dayanak yapmadan önce her vakayı kendiniz doğrulayın.', 'These cases are synthesized from the AI\'s general knowledge; sources are NOT verified and none are cited. Use them as inspiration, not precedent; verify each case yourself before basing any critical decision on it.')}
        </div>

        <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border)', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {simIdle ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 220 }}>
                {t('Rehber; probleminize, kök nedenlerinize ve bulgularınıza bakarak 3-4 analog vaka anlatır — en az biri başarısızlıkla sonuçlanmış olur.', 'The coach tells 3-4 analog cases based on your problem, root causes and findings — at least one of them ended in failure.')}
                {simc && simc.status === 'error' ? <span style={{ color: 'var(--alert)' }}> {t('Vakalar üretilemedi', 'Could not generate the cases')}{simc.errMsg ? ' (' + simc.errMsg + ')' : ''}{t(' — tekrar deneyin.', ' — try again.')}</span> : null}
              </div>
              <HButton
                onClick={runSimilarCases}
                style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                hover={S.primaryHover}
              >{t('Benzer vakaları getir', 'Fetch similar cases')}</HButton>
            </div>
          ) : null}

          {simc && simc.status === 'busy' ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Spinner />
              <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>{t('Benzer problemi yaşamış vakalar derleniyor…', 'Compiling cases that faced a similar problem…')}</div>
            </div>
          ) : null}

          {simc && simc.status === 'done' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {simc.truncated ? (
                <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 6, padding: '7px 10px' }}>
                  {t('Yanıt uzunluk sınırına takıldı; tamamlanabilen vakalar gösteriliyor.', 'The reply hit the length limit; showing the cases that completed.')}
                </div>
              ) : null}
              {simc.giris ? <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{simc.giris}</div> : null}
              {(simc.items || []).map((v, i) => {
                const st = v.durum === 'basarili'
                  ? { lb: t('✓ Başarılı', '✓ Succeeded'), ink: 'var(--ok-ink)', bg: 'var(--ok-soft)', bd: 'var(--ok-border)' }
                  : v.durum === 'basarisiz'
                    ? { lb: t('✗ Başarısız', '✗ Failed'), ink: 'var(--alert)', bg: 'var(--alert-soft)', bd: 'var(--alert-border)' }
                    : { lb: t('~ Karışık sonuç', '~ Mixed outcome'), ink: 'var(--warn-ink)', bg: 'var(--warn-soft)', bd: 'var(--warn-border)' };
                return (
                  <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '11px 13px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 5px' }}>
                      <span style={{ flex: 'none', font: '700 10px Helvetica,Arial,sans-serif', color: st.ink, background: st.bg, border: '1px solid ' + st.bd, borderRadius: 20, padding: '3px 8px' }}>{st.lb}</span>
                      <span style={{ font: '700 13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{v.baslik}</span>
                    </div>
                    {v.baglam ? <div style={{ font: '12px/1.55 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 4px' }}>{v.baglam}</div> : null}
                    {v.cozum ? <div style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 3px' }}><strong>{t('Ne yaptılar:', 'What they did:')}</strong> {v.cozum}</div> : null}
                    {v.sonuc ? <div style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 3px' }}><strong>{t('Ne oldu:', 'What happened:')}</strong> {v.sonuc}</div> : null}
                    {v.ders ? <div style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ok-ink)', margin: '0 0 3px' }}><strong>{t('Taşınabilir ders:', 'Transferable lesson:')}</strong> {v.ders}</div> : null}
                    {v.bag ? <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', margin: '0 0 3px' }}><strong>{t('Vakanızla bağ:', 'Link to your case:')}</strong> {v.bag}</div> : null}
                    {(v.dogrulama || []).length ? (
                      <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-4)', margin: '0 0 3px' }}>
                        <strong>{t('Doğrulamak için:', 'To verify:')}</strong> {v.dogrulama.join(' · ')}
                      </div>
                    ) : null}
                    <div style={{ font: '600 10.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 6, padding: '5px 8px', marginTop: 7 }}>
                      {t('⚠ YZ sentezi — kaynak doğrulanmadı; emsal değil ilham. Doğrulamadan karara dayanak yapmayın.', '⚠ AI synthesis — sources not verified; inspiration, not precedent. Do not base a decision on it without verifying.')}
                    </div>
                  </div>
                );
              })}
              <div style={{ display: 'flex', gap: 8 }}>
                <HButton onClick={runSimilarCases} style={{ padding: '7px 12px', border: '1px solid var(--pri-border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--pri)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.ghostHover}>{t('Yeniden üret', 'Regenerate')}</HButton>
                <HButton onClick={() => updC(cc => { delete cc.similarCases; })} style={{ padding: '7px 12px', border: 'none', background: 'transparent', color: 'var(--muted)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ color: 'var(--ink-3)' }}>{t('Kapat', 'Close')}</HButton>
              </div>
              <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
                {t('Doğruladığınız bir vakanın kaynağını Adım 1\'deki Referanslar bölümüne ekleyebilirsiniz; rapora dahil etmek için Adım 8\'de "Benzer vakalar" bölümünü açın.', 'You can add the source of a case you verified to the References section in Step 1; to include these in the report, enable the "Similar cases" section in Step 8.')}
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      {/* Karar kriterleri */}
      <Card>
        <CardHead
          title={t('Karar Kriterleri', 'Decision Criteria')}
          sub={t('Kısıt ve riskleri dikkate alarak kriterleri ve ağırlıklarını belirleyin. Ağırlık toplamı: %' + M.wsum, 'Set the criteria and their weights considering constraints and risks. Weight total: ' + M.wsum + '%')}
          aiReady={aiReady}
          onHelp={() => fieldHelp(t('Karar kriterleri ve ağırlıkları', 'Decision criteria and weights'), c.criteria.map(x => (x.name || '?') + t(' %' + (x.weight || 0), ' ' + (x.weight || 0) + '%')).join(', '))}
          helpTitle={t("YZ'den kriterler için yardım al", 'Get AI help for the criteria')}
        />
        <MethodBox margin="0 0 14px">{t('Karar kriterleri kısıtları ve riskleri yansıtır; ağırlıkları önem sırasına göre, toplam 100 olacak şekilde dağıtın. Puanlamanın öznel kalmaması için her kritere ', 'Decision criteria reflect constraints and risks; distribute the weights by importance so they total 100. To keep scoring objective, write a ')}<strong>{t('1-3-5 puan tanımı', '1-3-5 score definition')}</strong>{t(' yazın: "5" tam olarak neye verilir?', ' for each criterion: what exactly earns a "5"?')}</MethodBox>
        {!M.valid ? (
          <div role="alert" style={{ margin: '0 0 12px', font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--alert)', background: 'var(--alert-soft)', border: '1px solid var(--alert-border)', borderRadius: 8, padding: '9px 12px' }}>
            <strong>{t('Ağırlık toplamı %' + fmtNum(lang, M.wsum), 'Weight total ' + fmtNum(lang, M.wsum) + '%')}</strong> — {M.wDelta > 0 ? fmtNum(lang, M.wDelta) + t(' puan eksik', ' points missing') : fmtNum(lang, -M.wDelta) + t(' puan fazla', ' points over')}. {t('Toplam %100 olana kadar matris puanları ', 'Until the total is 100%, matrix scores count as a ')}<strong>{t('taslak', 'draft')}</strong>{t(' sayılır.', '.')}
          </div>
        ) : (
          <div style={{ margin: '0 0 12px', display: 'inline-block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ok-ink)', background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 20, padding: '4px 11px' }}>{t('✓ Ağırlık toplamı %100 — matris geçerli', '✓ Weight total 100% — matrix valid')}</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {c.criteria.map((cr, i) => (
            <div key={i} style={{ border: '1px solid var(--line-2)', borderRadius: 8, padding: '10px 12px', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <textarea
                  className="pcx-field" value={cr.name} onChange={inp('criteria', i, 'name')}
                  placeholder={t('Kriter — örn. Etki, uygulama hızı, maliyet, risk', 'Criterion — e.g. impact, speed of implementation, cost, risk')}
                  aria-label={t('Kriter ' + (i + 1) + ' adı', 'Criterion ' + (i + 1) + ' name')}
                  style={{ ...S.textarea, flex: 1, width: 'auto', minWidth: 180, minHeight: 40 }}
                />
                <input
                  className="pcx-field-sm" type="number" min="0" max="100" value={cr.weight} onChange={inp('criteria', i, 'weight')} placeholder="%"
                  aria-label={t('Kriter ' + (i + 1) + ' ağırlığı (yüzde)', 'Criterion ' + (i + 1) + ' weight (percent)')}
                  style={{ width: 76, boxSizing: 'border-box', padding: '9px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
                />
                <select
                  value={cr.yon || 'yuksek'} onChange={inp('criteria', i, 'yon')}
                  aria-label={t('Kriter ' + (i + 1) + ' yönü', 'Criterion ' + (i + 1) + ' direction')}
                  title={t("Ölçülen özelliğin yönü: 'yüksek iyi' (etki, hız) ya da 'düşük iyi' (maliyet, risk). Her iki durumda da 5 puan en iyi seçeneğe verilir.", "Direction of the measured property: 'higher is better' (impact, speed) or 'lower is better' (cost, risk). In both cases the best option gets 5 points.")}
                  style={{ ...S.select, width: 130, flex: 'none' }}
                >
                  <option value="yuksek">{t('Yüksek iyi', 'Higher is better')}</option>
                  <option value="dusuk">{t('Düşük iyi', 'Lower is better')}</option>
                </select>
                <RemoveButton onClick={() => removeC(t('karar kriteri (matris puanlarıyla)', 'decision criterion (with its matrix scores)'), cc => { cc.criteria.splice(i, 1); cc.scores = {}; })} />
              </div>
              <details>
                <summary style={{ cursor: 'pointer', font: '600 11.5px Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>
                  {t('Puan tanımları ve kaynak ', 'Score definitions and source ')}{((cr.d1 || '') + (cr.d3 || '') + (cr.d5 || '')).trim() ? '✓' : t('(önerilir — puanlamayı nesnelleştirir)', '(recommended — makes scoring objective)')}
                </summary>
                <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
                  {[['d1', t('1 PUAN = zayıf', '1 POINT = weak')], ['d3', t('3 PUAN = orta', '3 POINTS = fair')], ['d5', t('5 PUAN = çok iyi', '5 POINTS = excellent')]].map(([k, lb]) => (
                    <div key={k}>
                      <label style={{ display: 'block', font: '600 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.4px', margin: '0 0 4px' }}>{lb}</label>
                      <textarea
                        className="pcx-field-sm" value={cr[k] || ''} onChange={inp('criteria', i, k)}
                        placeholder={t('Bu puan neye verilir?', 'What earns this score?')}
                        style={{ ...S.textarea, font: '12px/1.45 Helvetica,Arial,sans-serif', minHeight: 40 }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8 }}>
                  <label style={{ display: 'block', font: '600 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.4px', margin: '0 0 4px' }}>{t('PUANLAMA KAYNAĞI / DAYANAĞI', 'SCORING SOURCE / BASIS')}</label>
                  <input
                    className="pcx-field-sm" value={cr.source || ''} onChange={inp('criteria', i, 'source')}
                    placeholder={t('Puanlar neye dayanıyor? Örn. pilot sonuçları, efor tahmini, uzman görüşü…', 'What are the scores based on? E.g. pilot results, effort estimate, expert opinion…')}
                    style={S.inputSm}
                  />
                </div>
              </details>
            </div>
          ))}
          <AddButton onClick={() => updC(cc => cc.criteria.push({ name: '', weight: '', yon: 'yuksek', d1: '', d3: '', d5: '', source: '' }))}>{t('+ Kriter ekle', '+ Add criterion')}</AddButton>
        </div>
      </Card>

      {/* Karar matrisi */}
      {c.alternatives.length > 0 && c.criteria.length > 0 ? (
        <Card>
          <CardHead
            title={t('Karar Matrisi', 'Decision Matrix')}
            sub={t('Her alternatifi her kritere göre puanlayın: 0 (zayıf) – 5 (çok iyi). Ağırlıklı toplam otomatik hesaplanır.', 'Score each alternative against each criterion: 0 (weak) – 5 (excellent). The weighted total is computed automatically.')}
            aiReady={aiReady}
            onHelp={() => fieldHelp(t('Karar matrisi puanlaması', 'Decision matrix scoring'), JSON.stringify(c.scores))}
            helpTitle={t("YZ'den puanlama için yardım al", 'Get AI help with scoring')}
          />
          <MethodBox margin="0 0 14px">{t('Ağırlıklı puanlama matrisi alternatifleri nesnel biçimde karşılaştırır; ama matris karar vermez, akıl yürütmenize girdi sağlar. Puanlar 1 (zayıf) – 5 (çok iyi); "düşük iyi" kriterlerde de en iyi seçenek 5 alır.', "The weighted scoring matrix compares alternatives objectively; but the matrix does not decide — it feeds your reasoning. Scores are 1 (weak) – 5 (excellent); on 'lower is better' criteria the best option still gets 5.")}</MethodBox>

          {/* Rehberden puan önerileri — önizlenir, boş hücrelere ya da onayla tümüne aktarılır */}
          {aiReady ? (
            <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border)', borderRadius: 8, padding: '12px 14px', margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!mc || mc.status === 'error' ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 220 }}>
                    {t('Rehber; alternatiflerinize, kriter tanımlarınıza ve yönlerine göre her hücre için gerekçeli bir puan taslağı hazırlayabilir. Aktarımdan sonra tüm hücreler elle değiştirilebilir.', 'The coach can draft a justified score for every cell based on your alternatives, criterion definitions and directions. After applying, every cell stays editable.')}
                    {mc && mc.status === 'error' ? <span style={{ color: 'var(--alert)' }}> {t('Öneri hazırlanamadı', 'Could not prepare the suggestion')}{mc.errMsg ? ' (' + mc.errMsg + ')' : ''}{t(' — tekrar deneyin.', ' — try again.')}</span> : null}
                  </div>
                  <HButton onClick={runMatrixCoach} style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.primaryHover}>{t('Rehberden puan önerisi al', 'Get score suggestions from the coach')}</HButton>
                </div>
              ) : null}

              {mc && mc.status === 'busy' ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Spinner />
                  <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>{t('Her hücre için gerekçeli puanlar hazırlanıyor…', 'Preparing justified scores for every cell…')}</div>
                </div>
              ) : null}

              {mc && mc.status === 'done' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px' }}>{t('REHBERİN PUAN TASLAĞI — hipotezdir, gerekçeleri sorgulayın', "COACH'S SCORE DRAFT — a hypothesis; challenge the rationales")}</div>
                  {mc.truncated ? <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)' }}>{t('Yanıt uzunluk sınırına takıldı; tamamlanabilen hücreler gösteriliyor.', 'The reply hit the length limit; showing the cells that completed.')}</div> : null}
                  {mc.giris ? <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{mc.giris}</div> : null}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', background: 'var(--surface)', borderRadius: 6 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '5px 9px', border: '1px solid var(--line)', font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)', background: 'var(--pri-soft)', textAlign: 'left' }}>{t('Alternatif', 'Alternative')}</th>
                          {M.head.map((h, i) => <th key={i} style={{ padding: '5px 9px', border: '1px solid var(--line)', font: '700 11px/1.35 Helvetica,Arial,sans-serif', color: 'var(--pri-ink)', background: 'var(--pri-soft)', textAlign: 'center' }}>{h.name}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {c.alternatives.map((al, ai) => (
                          <tr key={ai}>
                            <td style={{ padding: '5px 9px', border: '1px solid var(--line)', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink)', whiteSpace: 'nowrap' }}>A{ai + 1}</td>
                            {c.criteria.map((cr, ci) => {
                              const cell = (mc.cells || []).find(x => x.ai === ai && x.ci === ci);
                              return (
                                <td key={ci} title={cell ? cell.gerekce : ''} style={{ padding: '5px 9px', border: '1px solid var(--line)', font: '700 13px Helvetica,Arial,sans-serif', color: cell ? 'var(--pri)' : 'var(--muted)', textAlign: 'center', cursor: cell && cell.gerekce ? 'help' : 'default' }}>
                                  {cell ? cell.puan : '—'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <details>
                    <summary style={{ cursor: 'pointer', font: '600 11.5px Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>{t('Hücre gerekçeleri', 'Cell rationales')} ({(mc.cells || []).length})</summary>
                    <ul style={{ margin: '6px 0 0', padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {(mc.cells || []).map((x, i) => (
                        <li key={i} style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>
                          <strong>A{x.ai + 1} · {(M.head[x.ci] || {}).name || 'K' + (x.ci + 1)} → {x.puan}</strong>{x.gerekce ? ' — ' + x.gerekce : ''}
                        </li>
                      ))}
                    </ul>
                  </details>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <HButton
                      onClick={() => applyMatrixCoach('empty')}
                      style={{ padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                      hover={S.primaryHover}
                    >{t('Boş hücrelere aktar', 'Apply to empty cells')}</HButton>
                    <HButton
                      onClick={() => { if (confirm(t('Önerilen puanlar matristeki MEVCUT puanların üzerine yazılacak. Devam edilsin mi?', 'The suggested scores will OVERWRITE the existing scores in the matrix. Continue?'))) applyMatrixCoach('all'); }}
                      style={{ padding: '8px 14px', border: '1px solid var(--warn-border)', borderRadius: 8, background: 'var(--warn-soft)', color: 'var(--warn-ink)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                      hover={{ background: 'var(--warn-soft-2)' }}
                    >{t('Tümünü değiştir', 'Replace all')}</HButton>
                    <HButton onClick={runMatrixCoach} style={{ padding: '8px 14px', border: '1px solid var(--pri-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.ghostHover}>Yeniden öner</HButton>
                    <HButton onClick={() => updC(cc => { delete cc.matrixCoach; })} style={{ padding: '8px 14px', border: 'none', background: 'transparent', color: 'var(--muted)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ color: 'var(--ink-3)' }}>Kapat</HButton>
                  </div>
                  {mc.applied ? <div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ok-ink)' }}>{t('✓ Aktarıldı — aşağıdaki matristen istediğiniz hücreyi elle değiştirebilirsiniz.', '✓ Applied — you can still edit any cell in the matrix below.')}</div> : null}
                  {(mc.sorular || []).length ? (
                    <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {mc.sorular.map((q, i) => <li key={i} style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{q}</li>)}
                    </ul>
                  ) : null}
                  <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t('Puanlar gerekçeleriyle birlikte bir taslaktır — matris karar vermez; gerekçesi zayıf hücreleri kendi verinizle düzeltin.', 'The scores and their rationales are a draft — the matrix does not decide; fix weakly-justified cells with your own data.')}</div>
                </div>
              ) : null}
            </div>
          ) : null}
          {!M.valid ? (
            <div role="alert" style={{ margin: '0 0 12px', font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--alert)', background: 'var(--alert-soft)', border: '1px solid var(--alert-border)', borderRadius: 8, padding: '9px 12px' }}>
              <strong>{t('⚠ Puanlar geçersiz:', '⚠ Scores are invalid:')}</strong> {t('Kriter ağırlıkları toplamı %' + String(M.wsum).replace('.', ','), 'Criterion weights sum to ' + String(M.wsum) + '%')} — {M.wDelta > 0 ? t(String(M.wDelta).replace('.', ',') + ' puan eksik', String(M.wDelta) + ' points missing') : t(String(-M.wDelta).replace('.', ',') + ' puan fazla', String(-M.wDelta) + ' points over')}. {t('Aşağıdaki toplamlar yalnızca ön izlemedir; karara dayanak yapmayın.', 'The totals below are a preview only; do not base the decision on them.')}
            </div>
          ) : null}
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 8, margin: '0 0 8px', minWidth: 560 }}>
              <div style={{ flex: 1, minWidth: 140, font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px' }}>{t('ALTERNATİF', 'ALTERNATIVE')}</div>
              {M.head.map((mh, i) => {
                const cr = c.criteria[i] || {};
                const tip = [mh.name, mh.yon === 'dusuk' ? t('(düşük iyi)', '(lower is better)') : t('(yüksek iyi)', '(higher is better)'), cr.d1 ? '1 = ' + cr.d1 : '', cr.d3 ? '3 = ' + cr.d3 : '', cr.d5 ? '5 = ' + cr.d5 : '', cr.source ? t('Kaynak: ', 'Source: ') + cr.source : ''].filter(Boolean).join('\n');
                return (
                  <div key={i} title={tip} style={{ flex: '1 1 72px', minWidth: 72, maxWidth: 104, font: '700 11px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>
                    {mh.name}<br />{lang === 'en' ? mh.weight + '%' : '%' + mh.weight}
                    <span style={{ font: '400 10px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}> · {mh.yon === 'dusuk' ? t('düşük iyi', 'lower is better') : t('yüksek iyi', 'higher is better')}</span>
                  </div>
                );
              })}
              <div style={{ width: 56, flex: 'none', font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', textAlign: 'right' }}>{t('PUAN', 'SCORE')}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 560 }}>
              {M.rows.map(mr => (
                <div key={mr.n} style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid var(--line-4)', paddingTop: 8 }}>
                  <div style={{ flex: 1, minWidth: 140, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}><strong>A{mr.n}</strong> · {mr.name}</div>
                  {mr.cells.map((cell, ci) => (
                    <input
                      key={cell.key} className="pcx-field-sm" type="number" min="0" max="5" value={cell.value}
                      aria-label={'A' + mr.n + ' — ' + ((M.head[ci] || {}).name || t('kriter', 'criterion')) + t(' puanı (0-5)', ' score (0-5)')}
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
              <div><strong>{M.valid ? t('Matris önerisi', 'Matrix suggestion') : t('Taslak sonuç', 'Draft result')}:</strong> {t('En yüksek ağırlıklı puan ' + M.best.total + ' ile', 'Highest weighted score ' + M.best.total + ':')} <strong>A{M.best.n} — {M.best.name}</strong></div>
              {M.second ? (
                <div style={{ marginTop: 4 }}>
                  {t('İkinci: ', 'Runner-up: ')}A{M.second.n} ({M.second.total}) · {t('Fark: ' + String(M.lead).replace('.', ',') + ' puan', 'Lead: ' + String(M.lead) + ' points')}
                  {M.lead !== null && M.lead < 0.3 ? <strong>{t(' — fark çok küçük, matris tek başına ayırt etmiyor; niteliksel değerlendirme yapın.', ' — the lead is very small; the matrix alone does not discriminate — do a qualitative assessment.')}</strong> : null}
                </div>
              ) : null}
              {M.influential ? <div style={{ marginTop: 4 }}>{t('Sonucu en çok belirleyen kriter: ', 'Most decisive criterion: ')}<strong>{M.influential.name}</strong> {t('(üstünlüğe katkısı ' + String(M.influential.contrib).replace('.', ',') + ' puan)', '(contributes ' + String(M.influential.contrib) + ' points to the lead)')}</div> : null}
              {M.sensitivity.length ? (
                <div style={{ marginTop: 4, color: 'var(--warn-ink)' }}>
                  <strong>{t('Hassasiyet:', 'Sensitivity:')}</strong> {M.sensitivity.map(s => t('"' + s.name + '" kriteri çıkarılırsa kazanan ' + s.newWinner + ' olur', 'removing "' + s.name + '" makes ' + s.newWinner + ' the winner')).join('; ')}. {t('Sonuç bu kriterlere duyarlı — ağırlıkları gerçekten böyle mi?', 'The result is sensitive to these criteria — are the weights really right?')}
                </div>
              ) : M.valid && M.second ? (
                <div style={{ marginTop: 4, color: 'var(--muted)' }}>{t('Hassasiyet: Hiçbir kriteri çıkarmak kazananı değiştirmiyor — sonuç sağlam görünüyor.', 'Sensitivity: removing no single criterion changes the winner — the result looks robust.')}</div>
              ) : null}
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* Karar öncesi düşünme kontrolü — ileri analiz */}
      <AdvancedSection
        id="s6-thinking"
        title={t('İleri analiz — Karar öncesi düşünme kontrolü', 'Advanced — Pre-decision thinking check')}
        sub={t('Kararı yazmadan önce varsayımlarınızı, alternatif açıklamaları ve bedelin kime düşeceğini sorgulayın; bilişsel yanılgı taraması da burada.', 'Before writing the decision, question your assumptions, alternative explanations and who pays the cost; the cognitive-bias scan lives here too.')}
      >
        <ThinkingCheck />
      </AdvancedSection>

      {/* Karar zamanlaması — ASAP/ALAP: kararın NE ZAMAN verileceği de bir karardır */}
      <Card>
        <CardHead
          title={t('Karar zamanlaması', 'Decision timing')}
          sub={t('Doğru kararın bir de doğru zamanı vardır: geri alma bedeline göre hemen verin (ASAP) ya da analiz için geciktirin (ALAP).', 'The right decision also has a right time: decide now (ASAP) or delay for analysis (ALAP), depending on the cost of reversal.')}
        />
        <MethodBox>{t('Eylem ilkeleri: geri alması ucuz kararı HEMEN verin; geri alması pahalı kararı fırsat penceresi kapanana dek analizle geciktirin; yeterli bilgiye ulaştığınızı gösteren işaret gerçekleştiğinde bilgi toplamayı BIRAKIN ve uygulayın.', 'Action principles: decide a cheaply reversible decision NOW; delay an expensive-to-reverse decision with analysis until the opportunity window closes; STOP gathering information and act once your enough-information signal fires.')}</MethodBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ flex: 'none', font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{t('Bu kararı geri almanın bedeli:', 'Cost of reversing this decision:')}</span>
            <select
              className="pcx-field" value={(c.timing || {}).reversal || ''}
              onChange={e => updC(cc => { cc.timing = cc.timing || { reversal: '', window: '', stopSignal: '' }; cc.timing.reversal = e.target.value; })}
              style={{ ...S.select, flex: '1 1 220px', font: '13px Helvetica,Arial,sans-serif' }}
            >
              <option value="">{t('— seçin —', '— select —')}</option>
              <option value="dusuk">{t('Düşük — kolayca geri alınır / küçük test', 'Low — easily reversed / small test')}</option>
              <option value="orta">{t('Orta — geri almak zahmetli ama mümkün', 'Moderate — reversal is costly but possible')}</option>
              <option value="yuksek">{t('Yüksek — geri dönüşü yok ya da çok pahalı', 'High — irreversible or very expensive to undo')}</option>
            </select>
          </label>
          {(() => {
            const adv = timingAdvice(c.timing, lang);
            if (!adv) return null;
            const tone = adv.key === 'asap' ? ['var(--ok-soft)', 'var(--ok-border)', 'var(--ok-ink)'] : adv.key === 'alap' ? ['var(--warn-soft)', 'var(--warn-border)', 'var(--warn-ink)'] : ['var(--pri-soft)', 'var(--pri-border-5)', 'var(--pri-ink)'];
            return (
              <div style={{ background: tone[0], border: '1px solid ' + tone[1], borderRadius: 8, padding: '10px 13px' }}>
                <div style={{ font: '700 12px Helvetica,Arial,sans-serif', color: tone[2] }}>{adv.label}</div>
                <div style={{ font: '12px/1.55 Helvetica,Arial,sans-serif', color: tone[2], marginTop: 3 }}>{adv.text}</div>
              </div>
            );
          })()}
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>{t('Fırsat penceresi / son karar tarihi', 'Opportunity window / decision deadline')}</span>
            <input
              className="pcx-field" value={(c.timing || {}).window || ''}
              onChange={e => updC(cc => { cc.timing = cc.timing || { reversal: '', window: '', stopSignal: '' }; cc.timing.window = e.target.value; })}
              placeholder={t('Örn: sipariş penceresi 15 Eylül\'de kapanıyor — o güne kadar karar verilmeli', 'E.g., the order window closes on 15 Sept — decide by then')}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
            />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>{t('Durma işareti — hangi bilgiye ulaşınca karar verilecek?', 'Stop signal — what information will trigger the decision?')}</span>
            <input
              className="pcx-field" value={(c.timing || {}).stopSignal || ''}
              onChange={e => updC(cc => { cc.timing = cc.timing || { reversal: '', window: '', stopSignal: '' }; cc.timing.stopSignal = e.target.value; })}
              placeholder={t('Örn: pilot sonucu alındığında ya da iki teklif karşılaştırıldığında bilgi toplamayı bırak', 'E.g., stop gathering information once the pilot result is in or two quotes are compared')}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
            />
          </label>
        </div>
      </Card>

      {/* Karar */}
      <Card>
        <CardHead
          title={t('Karar', 'Decision')}
          sub={t('Akıl yürüterek en doğru çözümü önerin; matris girdidir, karar sizindir.', 'Reason your way to the best solution; the matrix is an input — the decision is yours.')}
          aiReady={aiReady}
          onHelp={() => fieldHelp(t('Karar ve gerekçe', 'Decision and rationale'), (c.decision.choice || '') + t(' | Gerekçe: ', ' | Rationale: ') + (c.decision.rationale || ''))}
          helpTitle={t("YZ'den karar için yardım al", 'Get AI help with the decision')}
        />

        {/* Karar öncesi zihin kontrolü — üç soruya da yanıt verilince işaretlenir */}
        <div data-noprint="1" style={{ background: '#fbf7f3', border: '1px solid #e5d9cd', borderRadius: 8, padding: '12px 14px', margin: '0 0 12px' }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: '#8c6a35', letterSpacing: '.5px', margin: '0 0 8px' }}>
            {t('KARAR ALMADAN ÖNCE KENDİNİZE SORUN — üçünü de yanıtladıysanız işaretleyin', 'ASK YOURSELF BEFORE DECIDING — check each once you have answered all three')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {preCheckItemsFor(lang).map(q => {
              const on = !!(c.precheck || {})[q.key];
              return (
                <button
                  key={q.key} type="button"
                  onClick={() => updC(cc => { cc.precheck = cc.precheck || { p1: false, p2: false, p3: false }; cc.precheck[q.key] = !cc.precheck[q.key]; })}
                  aria-pressed={on}
                  style={{ display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left', width: '100%', background: '#fff', border: '1px solid #ecdfd0', borderRadius: 8, padding: '9px 11px', cursor: 'pointer', font: 'inherit' }}
                >
                  <span aria-hidden="true" style={{ flex: 'none', width: 18, height: 18, borderRadius: 4, border: on ? 'none' : '1px solid #ddcdb8', background: on ? '#35506e' : '#fff', color: '#fff', font: '700 12px/18px Helvetica,Arial,sans-serif', textAlign: 'center', marginTop: 1 }}>{on ? '✓' : ''}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', font: '600 12.5px/1.5 Helvetica,Arial,sans-serif', color: '#4a453e' }}>{q.soru}</span>
                    <span style={{ display: 'block', font: '11px/1.4 Helvetica,Arial,sans-serif', color: '#8a857c', marginTop: 2 }}>{q.not}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <MethodBox>{t('Kararı kök nedenle ilişkilendirin — seçilen çözüm kök nedeni gidermiyorsa belirti tedavisidir. Gerekçenizde kısıt ve riskleri nasıl karşıladığınızı yazın.', 'Tie the decision to the root cause — if the chosen solution does not eliminate the root cause, it is symptom treatment. In your rationale, explain how you handle constraints and risks.')}</MethodBox>

        <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border)', borderRadius: 8, padding: '12px 14px', margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dcIdle ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 220 }}>
                {t('Rehber; alternatiflerinize, kriterlerinize ve matris puanlarınıza bakarak size bir karar önerisi hazırlayabilir.', 'The coach can draft a decision suggestion from your alternatives, criteria and matrix scores.')}
                {dc && dc.status === 'error' ? <span style={{ color: 'var(--alert)' }}> {t('Öneri hazırlanamadı', 'Could not prepare the suggestion')}{dc.errMsg ? ' (' + dc.errMsg + ')' : ''}{t(' — tekrar deneyin.', ' — try again.')}</span> : null}
              </div>
              <HButton onClick={runDecisionCoach} style={{ flex: 'none', ...S.ghostBtn, border: '1px solid var(--pri)', background: 'var(--pri)', color: 'var(--on-pri)' }} hover={S.primaryHover}>{t('Rehberden karar önerisi al', 'Get a decision suggestion from the coach')}</HButton>
            </div>
          ) : null}
          {dc && dc.status === 'busy' ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Spinner />
              <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>{t('Rehber çalışıyor — alternatifleriniz ve matris puanlarınız değerlendiriliyor…', 'The coach is working — evaluating your alternatives and matrix scores…')}</div>
            </div>
          ) : null}
          {dc && dc.status === 'done' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px' }}>{t('REHBERİN KARAR ÖNERİSİ', "COACH'S DECISION SUGGESTION")}</div>
              <div style={{ font: '600 13px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{dc.choice}</div>
              <div style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{dc.rationale}</div>
              {(dc.secondOrder || '').trim() ? (
                <div style={{ font: '12px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>
                  <strong>{t('İkinci basamak: ', 'Second order: ')}</strong>{dc.secondOrder}
                </div>
              ) : null}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <HButton
                  onClick={() => updC(cc => { if (!cc.decisionCoach) return; cc.decision.choice = cc.decisionCoach.choice; cc.decision.rationale = cc.decisionCoach.rationale; if ((cc.decisionCoach.secondOrder || '').trim() && !(cc.decision.secondOrder || '').trim()) cc.decision.secondOrder = cc.decisionCoach.secondOrder; })}
                  style={{ padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                  hover={S.primaryHover}
                >{t('Karar alanlarına aktar', 'Apply to decision fields')}</HButton>
                <HButton onClick={runDecisionCoach} style={S.ghostBtn} hover={S.ghostHover}>Yeniden öner</HButton>
                <HButton
                  onClick={() => updC(cc => { delete cc.decisionCoach; })}
                  style={{ padding: '8px 14px', border: 'none', background: 'transparent', color: 'var(--muted)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                  hover={{ color: 'var(--ink-3)' }}
                >Kapat</HButton>
              </div>
              <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t('Öneri bir girdidir; karar sizindir. Aktardıktan sonra kendi akıl yürütmenizle düzenleyin.', 'The suggestion is an input; the decision is yours. After applying, edit it with your own reasoning.')}</div>
            </div>
          ) : null}
        </div>

        <label style={S.label}>{t('Kararınız / önerdiğiniz çözüm', 'Your decision / proposed solution')}</label>
        <textarea
          className="pcx-field" value={c.decision.choice} onChange={inp('decision', 'choice')}
          style={{ ...S.textarea, font: '14px/1.45 Helvetica,Arial,sans-serif', minHeight: 52, height: 122, margin: '0 0 12px' }}
        />
        <label style={S.label}>{t('Gerekçe (akıl yürütme)', 'Rationale (reasoning)')}</label>
        <textarea
          className="pcx-field" value={c.decision.rationale} onChange={inp('decision', 'rationale')}
          placeholder={t('Bu karar kök nedeni nasıl gideriyor? Hangi kısıt ve riskleri nasıl karşılıyor?', 'How does this decision eliminate the root cause? How does it handle constraints and risks?')}
          style={{ ...S.textarea, minHeight: 76, height: 376, margin: '0 0 12px' }}
        />

        {/* İkinci basamak düşünme (Munger/Parrish) */}
        <label style={S.label}>{t('Ve sonra ne olacak? — ikinci basamak etkileri', 'And then what? — second-order effects')}</label>
        <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 6px' }}>{t('Karar uygulanınca kimler/hangi süreçler etkilenir; çözümün kendisi hangi yeni problemi doğurabilir? İki basamak ileriyi yazın.', 'Once implemented, who and which processes are affected; what new problem might the solution itself create? Think two steps ahead.')}</div>
        <textarea
          className="pcx-field" value={c.decision.secondOrder || ''} onChange={inp('decision', 'secondOrder')}
          placeholder={t('Örn: zorunlu kontrol operasyonu yavaşlatır → yoğun dönemde bypass baskısı doğar → loglama ve istisna akışı gerekir.', 'E.g., the mandatory check slows operations → bypass pressure builds in peak season → logging and an exception flow are needed.')}
          style={{ ...S.textarea, minHeight: 60, height: 96, margin: '0 0 12px' }}
        />

        {/* Dış görünüm / referans sınıfı (Kahneman) */}
        <label style={S.label}>{t('Dış görünüm — benzer girişimler gerçekte nasıl sonuçlandı?', 'Outside view — how did similar initiatives actually turn out?')}</label>
        <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 6px' }}>{t('Planlama yanılgısının panzehiri: kendi planınıza değil, benzer girişimlerin gerçek sonuçlarına bakın (kurum içi geçmiş, sektör deneyimi, yukarıdaki Benzer Vakalar paneli). Termin ve etki beklentinizi buna göre düzeltin.', "The antidote to the planning fallacy: look at the actual outcomes of similar initiatives (internal history, industry experience, the Similar Cases panel above), not at your own plan. Adjust your deadline and impact expectations accordingly.")}</div>
        <textarea
          className="pcx-field" value={c.decision.outsideView || ''} onChange={inp('decision', 'outsideView')}
          placeholder={t('Örn: önceki sistem geçişimiz plandan 2 kat uzun sürdü — bu yüzden hedefi ara teslimatlara böldük.', 'E.g., our previous system migration took twice as long as planned — so we split the target into interim deliveries.')}
          style={{ ...S.textarea, minHeight: 60, height: 96 }}
        />
      </Card>

      {/* Pre-mortem (Klein) */}
      {hasDecision ? (
        <Card>
          <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>{t('Pre-Mortem — Karar Başarısız Olsaydı?', 'Pre-Mortem — What If the Decision Failed?')}</div>
          <div style={S.cardSub}>{t('Karar verildi; şimdi son savunma hattı. 6 ay sonrasını hayal edin: karar uygulandı ve başarısız oldu. Ne oldu?', 'The decision is made; now the last line of defense. Imagine 6 months from now: the decision was implemented and it failed. What happened?')}</div>
          <MethodBox margin="0 0 14px">{t('Gary Klein\'ın yöntemi — olayı "olabilir" değil ', "Gary Klein's method — imagining the event not as 'could happen' but as ")}<strong>{t('"oldu"', "'it happened'")}</strong>{t(' diye hayal etmek, başarısızlık nedeni tespitini ~%30 artırır ve aşırı güveni ölçülebilir düşürür. Çekinceleri planlama aşamasında konuşulur kılar.', ' increases failure-cause identification by ~30% and measurably lowers overconfidence. It makes reservations speakable at the planning stage.')}</MethodBox>

          <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border)', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pmIdle ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 220 }}>
                  {t('Rehber; kararınız, aksiyonlarınız ve kök nedenlerinize bakarak 4-5 olası başarısızlık senaryosu, erken uyarı sinyalleri ve önleyici tedbirler üretir.', 'The coach generates 4-5 possible failure scenarios, early-warning signals and preventive measures from your decision, actions and root causes.')}
                  {pm && pm.status === 'error' ? <span style={{ color: 'var(--alert)' }}> {t('Senaryolar üretilemedi', 'Could not generate the scenarios')}{pm.errMsg ? ' (' + pm.errMsg + ')' : ''}{t(' — tekrar deneyin.', ' — try again.')}</span> : null}
                </div>
                <HButton
                  onClick={runPremortem}
                  style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                  hover={S.primaryHover}
                >{t('⏳ Pre-mortem çalıştır', '⏳ Run pre-mortem')}</HButton>
              </div>
            ) : null}

            {pm && pm.status === 'busy' ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Spinner />
                <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>{t('6 ay sonrası hayal ediliyor — başarısızlık senaryoları yazılıyor…', 'Imagining 6 months ahead — writing the failure scenarios…')}</div>
              </div>
            ) : null}

            {pm && pm.status === 'done' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pm.truncated ? (
                  <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 6, padding: '7px 10px' }}>
                    {t('Yanıt uzunluk sınırına takıldı; tamamlanabilen ' + pm.items.length + ' senaryo gösteriliyor. Daha fazlası için "Yeniden çalıştır"a basın ya da Ayarlar\'dan analiz derinliğini artırın.', 'The reply hit the length limit; showing the ' + pm.items.length + ' scenario(s) that completed. Press "Run again" for more, or raise the analysis depth in Settings.')}
                  </div>
                ) : null}
                {pm.giris ? <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{pm.giris}</div> : null}
                {(pm.items || []).map((it, i) => (
                  <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '11px 13px' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ font: '700 13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', margin: '0 0 4px' }}>💥 {it.baslik}</div>
                        <div style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 6px' }}>{it.hikaye}</div>
                        {it.sinyal ? <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', margin: '0 0 3px' }}><strong>{t('Erken sinyal:', 'Early signal:')}</strong> {it.sinyal}</div> : null}
                        {it.onlem ? <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ok-ink)' }}><strong>{t('Önleyici tedbir:', 'Preventive measure:')}</strong> {it.onlem}</div> : null}
                      </div>
                      {it.onlem ? (
                        <button
                          onClick={() => updC(cc => {
                            const x = cc.premortem && cc.premortem.items[i];
                            if (!x || x.added) return;
                            cc.actions = cc.actions || [];
                            cc.actions.push({ text: x.onlem, owner: '', due: '', startDate: '', dueDate: '', rcIdx: '', successCriteria: x.sinyal ? t('Erken sinyal izlenir: ', 'Watch the early signal: ') + x.sinyal : '', evidence: '', delayReason: '', etki: '', efor: '', note: t('Pre-mortem tedbiri: ', 'Pre-mortem measure: ') + x.baslik });
                            x.added = true;
                          })}
                          style={{
                            flex: 'none',
                            border: '1px solid ' + (it.added ? 'var(--ok-border)' : 'var(--pri)'),
                            background: it.added ? 'var(--ok-soft)' : 'var(--pri)',
                            color: it.added ? 'var(--ok)' : 'var(--on-pri)',
                            borderRadius: 6, padding: '7px 12px', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer'
                          }}
                        >{it.added ? t('Eklendi ✓', 'Added ✓') : t('Tedbiri plana ekle', 'Add measure to the plan')}</button>
                      ) : null}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <HButton onClick={runPremortem} style={{ padding: '7px 12px', border: '1px solid var(--pri-border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--pri)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.ghostHover}>{t('Yeniden çalıştır', 'Run again')}</HButton>
                  <HButton onClick={() => updC(cc => { delete cc.premortem; })} style={{ padding: '7px 12px', border: 'none', background: 'transparent', color: 'var(--muted)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ color: 'var(--ink-3)' }}>Kapat</HButton>
                </div>
                <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t('Senaryolar hipotezdir; hangi tedbirin plana gireceğine siz karar verin. Erken sinyalleri Adım 7\'deki izlemeye taşımayı unutmayın.', 'The scenarios are hypotheses; you decide which measures enter the plan. Remember to carry the early signals into the tracking in Step 7.')}</div>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* FMEA — hafif: hata türleri, S/O/T, RPN */}
      <AdvancedSection
        id="s6-fmea"
        title={t('İleri analiz — FMEA (Hata Türleri ve Etkileri)', 'Advanced — FMEA (Failure Modes and Effects)')}
        sub={t('Seçilen çözümün uygulamada nerede bozulabileceğini Şiddet × Olasılık × Tespit (RPN) puanıyla sıralayın; pre-mortem hikâyelerini sayısal disipline bağlar.', 'Rank where the chosen solution can break in practice with Severity × Occurrence × Detection (RPN); it puts numeric discipline behind the pre-mortem stories.')}
      >
        <MethodBox margin="0 0 12px">{t('FMEA — her hata türüne 1-10 arası Şiddet (etkisi ne kadar ağır), Olasılık (ne sıklıkla olur) ve Tespit (fark etmesi ne kadar zor; 10 = en zor) verin. RPN = Ş×O×T; 100 üzeri satırlar önlem ister. Puanları ekibinizle kalibre edin — tek kişinin puanı yanlıdır.', 'FMEA — rate each failure mode 1-10 for Severity (how bad), Occurrence (how often) and Detection (how hard to notice; 10 = hardest). RPN = S×O×D; rows above 100 demand a countermeasure. Calibrate scores with your team — a single person\'s scores are biased.')}</MethodBox>

        <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border)', borderRadius: 8, padding: '11px 13px', margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!fmc || fmc.status === 'error' ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 220 }}>
                {t('Rehber; kararınız, aksiyonlarınız ve pre-mortem senaryolarınızdan 4-6 hata türü ve taslak puanlar önerebilir.', 'The coach can suggest 4-6 failure modes with draft scores from your decision, actions and pre-mortem scenarios.')}
                {fmc && fmc.status === 'error' ? <span style={{ color: 'var(--alert)' }}> {t('Taslak hazırlanamadı', 'Could not prepare the draft')}{fmc.errMsg ? ' (' + fmc.errMsg + ')' : ''}{t(' — tekrar deneyin.', ' — try again.')}</span> : null}
              </div>
              <HButton onClick={runFmeaCoach} style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.primaryHover}>{t('Rehberden FMEA taslağı al', 'Get an FMEA draft from the coach')}</HButton>
            </div>
          ) : null}
          {fmc && fmc.status === 'busy' ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Spinner /><div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>{t('Hata türleri ve taslak puanlar hazırlanıyor…', 'Preparing failure modes and draft scores…')}</div></div>
          ) : null}
          {fmc && fmc.status === 'done' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px' }}>{t('REHBERİN FMEA TASLAĞI — puanlar öznel taslaktır, ekiple kalibre edin', "COACH'S FMEA DRAFT — scores are a subjective draft; calibrate with the team")}</div>
              {fmc.truncated ? <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)' }}>{t('Yanıt kesildi; tamamlanabilen satırlar gösteriliyor.', 'The reply was cut; showing the rows that completed.')}</div> : null}
              {fmc.giris ? <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{fmc.giris}</div> : null}
              <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {(fmc.rows || []).map((r, i) => (
                  <li key={i} style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>
                    <strong>{r.mode}</strong> — {r.effect} · Ş{r.s}/O{r.o}/T{r.d}{rpnOf(r) ? ' · RPN ' + rpnOf(r) : ''}{r.onlem ? ' · ' + t('Önlem: ', 'Measure: ') + r.onlem : ''}
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <HButton onClick={applyFmeaCoach} style={{ padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.primaryHover}>{t('Satırları tabloya ekle', 'Add rows to the table')}</HButton>
                <HButton onClick={runFmeaCoach} style={S.ghostBtn} hover={S.ghostHover}>{t('Yeniden öner', 'Suggest again')}</HButton>
                <HButton onClick={() => updC(cc => { delete cc.fmeaCoach; })} style={{ padding: '8px 14px', border: 'none', background: 'transparent', color: 'var(--muted)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ color: 'var(--ink-3)' }}>{t('Kapat', 'Close')}</HButton>
              </div>
              {fmc.applied ? <div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ok-ink)' }}>{t('✓ Eklendi — aşağıdaki tablodan düzenleyebilirsiniz (aynı adlı satırlar atlandı).', '✓ Added — edit in the table below (rows with duplicate names were skipped).')}</div> : null}
              {(fmc.sorular || []).length ? <ul style={{ margin: 0, padding: '0 0 0 18px' }}>{fmc.sorular.map((q, i) => <li key={i} style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{q}</li>)}</ul> : null}
            </div>
          ) : null}
        </div>

        {(c.fmea || []).length ? (
          <div style={{ overflowX: 'auto', margin: '0 0 10px' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 760 }}>
              <thead>
                <tr>
                  {[t('HATA TÜRÜ', 'FAILURE MODE'), t('ETKİSİ', 'EFFECT'), t('NEDENİ', 'CAUSE'), t('Ş', 'S'), 'O', t('T', 'D'), 'RPN', t('ÖNLEM', 'MEASURE'), ''].map((h, i) => (
                    <th key={i} style={{ padding: '5px 7px', border: '1px solid var(--line)', font: '700 10px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', background: 'var(--surface-2)', textAlign: 'left', letterSpacing: '.4px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.fmea.map((r, i) => {
                  const rpn = rpnOf(r);
                  const rpnStyle = rpn === null ? { color: 'var(--muted)' } : rpn >= 200 ? { color: 'var(--alert)', fontWeight: 700 } : rpn >= 100 ? { color: 'var(--warn-ink)', fontWeight: 700 } : { color: 'var(--ok-ink)', fontWeight: 700 };
                  const sel = k => (
                    <select value={r[k] || ''} onChange={inp('fmea', i, k)} aria-label={t((i + 1) + '. satır ' + k.toUpperCase(), 'Row ' + (i + 1) + ' ' + k.toUpperCase())} style={{ ...S.select, width: 54, padding: '6px 4px' }}>
                      <option value="">—</option>{[1,2,3,4,5,6,7,8,9,10].map(v => <option key={v} value={String(v)}>{v}</option>)}
                    </select>
                  );
                  const inpCell = (k, ph) => (
                    <textarea className="pcx-field-sm" value={r[k] || ''} onChange={inp('fmea', i, k)} placeholder={ph} style={{ ...S.textarea, font: '12px/1.4 Helvetica,Arial,sans-serif', minHeight: 36, width: '100%', boxSizing: 'border-box' }} />
                  );
                  return (
                    <tr key={i}>
                      <td style={{ padding: 4, border: '1px solid var(--line)', minWidth: 150 }}>{inpCell('mode', t('Ne bozulur?', 'What breaks?'))}</td>
                      <td style={{ padding: 4, border: '1px solid var(--line)', minWidth: 140 }}>{inpCell('effect', t('Kime/neye, ne olur?', 'To whom/what, and how?'))}</td>
                      <td style={{ padding: 4, border: '1px solid var(--line)', minWidth: 140 }}>{inpCell('cause', t('Olası neden', 'Likely cause'))}</td>
                      <td style={{ padding: 4, border: '1px solid var(--line)' }}>{sel('s')}</td>
                      <td style={{ padding: 4, border: '1px solid var(--line)' }}>{sel('o')}</td>
                      <td style={{ padding: 4, border: '1px solid var(--line)' }}>{sel('d')}</td>
                      <td style={{ padding: '4px 8px', border: '1px solid var(--line)', font: '13px Helvetica,Arial,sans-serif', textAlign: 'center', ...rpnStyle }}>{rpn ?? '—'}</td>
                      <td style={{ padding: 4, border: '1px solid var(--line)', minWidth: 160 }}>
                        {inpCell('onlem', t('Önleyici / tespit edici önlem', 'Preventive / detective measure'))}
                        {(r.onlem || '').trim() ? (
                          <button type="button"
                            onClick={() => updC(cc => { cc.actions = cc.actions || []; cc.actions.push({ text: r.onlem, owner: '', due: '', startDate: '', dueDate: '', rcIdx: '', findingIdx: '', successCriteria: '', evidence: '', delayReason: '', etki: '', efor: '', priority: rpn && rpn >= 200 ? 'yuksek' : '', note: 'FMEA: ' + (r.mode || '') }); })}
                            style={{ marginTop: 4, padding: '4px 8px', border: '1px solid var(--pri-border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--pri)', font: '600 10.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                          >{t('Önlemi plana ekle', 'Add measure to plan')}</button>
                        ) : null}
                      </td>
                      <td style={{ padding: 4, border: '1px solid var(--line)' }}><RemoveButton onClick={() => removeC(t('FMEA satırı', 'FMEA row'), cc => cc.fmea.splice(i, 1))} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <AddButton onClick={() => updC(cc => { cc.fmea = cc.fmea || []; cc.fmea.push({ mode: '', effect: '', cause: '', s: '', o: '', d: '', onlem: '' }); })} style={{ flex: 1, minWidth: 160, width: 'auto' }}>{t('+ Satır ekle', '+ Add row')}</AddButton>
          {(c.fmea || []).length > 1 ? (
            <HButton onClick={() => updC(cc => cc.fmea.sort((x, y) => (rpnOf(y) || 0) - (rpnOf(x) || 0)))} style={{ flex: 'none', padding: '10px 14px', border: '1px solid var(--field-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: 'var(--surface-4)' }}>{t("RPN'e göre sırala", 'Sort by RPN')}</HButton>
          ) : null}
        </div>
      </AdvancedSection>

      {/* Kuvvet alanı analizi (Lewin) */}
      <AdvancedSection
        id="s6-forcefield"
        title={t('İleri analiz — Kuvvet Alanı Analizi (Lewin)', 'Advanced — Force Field Analysis (Lewin)')}
        sub={t('Kararı destekleyen itici kuvvetler ile direnç gösterecek kısıtlayıcı kuvvetleri tartın; uygulama planına geçmeden değişimin örgütte neye çarpacağını görün.', 'Weigh the driving forces behind the decision against the restraining ones; see what the change will hit in the organization before moving to the action plan.')}
      >
        <MethodBox margin="0 0 12px">{t("Lewin'in ilkesi: direnci azaltmak, itmeyi artırmaktan genellikle daha etkilidir — kısıtlayıcı kuvvetlere zayıflatma önlemi yazın. Güç: 1 (zayıf) – 5 (çok güçlü).", "Lewin's principle: reducing resistance usually beats pushing harder — write a mitigation for each restraining force. Strength: 1 (weak) – 5 (very strong).")}</MethodBox>

        <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border)', borderRadius: 8, padding: '11px 13px', margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!foc || foc.status === 'error' ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 220 }}>
                {t('Rehber; kararınıza göre itici ve kısıtlayıcı kuvvet adayları ve zayıflatma önerileri hazırlayabilir.', 'The coach can draft driving and restraining force candidates with mitigation suggestions for your decision.')}
                {foc && foc.status === 'error' ? <span style={{ color: 'var(--alert)' }}> {t('Taslak hazırlanamadı', 'Could not prepare the draft')}{foc.errMsg ? ' (' + foc.errMsg + ')' : ''}{t(' — tekrar deneyin.', ' — try again.')}</span> : null}
              </div>
              <HButton onClick={runForceCoach} style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.primaryHover}>{t('Rehberden kuvvet taslağı al', 'Get a force draft from the coach')}</HButton>
            </div>
          ) : null}
          {foc && foc.status === 'busy' ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Spinner /><div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>{t('İtici ve kısıtlayıcı kuvvetler çıkarılıyor…', 'Extracting driving and restraining forces…')}</div></div>
          ) : null}
          {foc && foc.status === 'done' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px' }}>{t('REHBERİN KUVVET TASLAĞI — hipotezdir, ekiple doğrulayın', "COACH'S FORCE DRAFT — a hypothesis; validate with the team")}</div>
              {foc.giris ? <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{foc.giris}</div> : null}
              <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {(foc.itici || []).map((x, i) => <li key={'i' + i} style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ok-ink)' }}>{t('İtici: ', 'Driving: ')}{x.text} ({x.strength}/5)</li>)}
                {(foc.kisitlayici || []).map((x, i) => <li key={'k' + i} style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)' }}>{t('Kısıtlayıcı: ', 'Restraining: ')}{x.text} ({x.strength}/5){x.azaltma ? ' · ' + t('Zayıflatma: ', 'Mitigation: ') + x.azaltma : ''}</li>)}
              </ul>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <HButton onClick={applyForceCoach} style={{ padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.primaryHover}>{t('Kuvvetleri listeye ekle', 'Add forces to the lists')}</HButton>
                <HButton onClick={runForceCoach} style={S.ghostBtn} hover={S.ghostHover}>{t('Yeniden öner', 'Suggest again')}</HButton>
                <HButton onClick={() => updC(cc => { delete cc.forceCoach; })} style={{ padding: '8px 14px', border: 'none', background: 'transparent', color: 'var(--muted)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ color: 'var(--ink-3)' }}>{t('Kapat', 'Close')}</HButton>
              </div>
              {foc.applied ? <div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ok-ink)' }}>{t('✓ Eklendi — aşağıdaki listelerden düzenleyebilirsiniz.', '✓ Added — edit in the lists below.')}</div> : null}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: 12 }}>
          {[
            { key: 'driving', title: t('İTİCİ KUVVETLER → değişimi destekler', 'DRIVING FORCES → support the change'), ink: 'var(--ok-ink)', border: 'var(--ok-border)', bar: 'var(--ok)' },
            { key: 'restraining', title: t('← KISITLAYICI KUVVETLER direnç gösterir', '← RESTRAINING FORCES resist the change'), ink: 'var(--warn-ink)', border: 'var(--warn-border)', bar: 'var(--warn-ink)' }
          ].map(colDef => {
            const list = (c.forcefield || {})[colDef.key] || [];
            const total = list.reduce((a, x) => a + (parseInt(x.strength, 10) || 0), 0);
            return (
              <div key={colDef.key} style={{ border: '1px solid ' + colDef.border, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', margin: '0 0 8px' }}>
                  <div style={{ flex: 1, font: '700 10.5px Helvetica,Arial,sans-serif', color: colDef.ink, letterSpacing: '.5px' }}>{colDef.title}</div>
                  <div style={{ font: '700 12px Helvetica,Arial,sans-serif', color: colDef.ink }}>{t('Toplam: ', 'Total: ')}{total}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {list.map((x, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input className="pcx-field-sm" value={x.text || ''} onChange={inp('forcefield', colDef.key, i, 'text')} placeholder={t('Kuvvet', 'Force')} style={{ ...S.inputSm, flex: 1 }} />
                        <select value={x.strength || ''} onChange={inp('forcefield', colDef.key, i, 'strength')} aria-label={t('Güç (1-5)', 'Strength (1-5)')} style={{ ...S.select, width: 58, flex: 'none' }}>
                          <option value="">—</option>{[1,2,3,4,5].map(v => <option key={v} value={String(v)}>{v}</option>)}
                        </select>
                        <RemoveButton onClick={() => removeC(t('kuvvet', 'force'), cc => cc.forcefield[colDef.key].splice(i, 1))} />
                      </div>
                      <div aria-hidden="true" style={{ height: 5, borderRadius: 3, background: 'var(--line-2)', overflow: 'hidden' }}>
                        <div style={{ width: ((parseInt(x.strength, 10) || 0) * 20) + '%', height: '100%', background: colDef.bar, marginLeft: colDef.key === 'restraining' ? 'auto' : 0 }} />
                      </div>
                      {colDef.key === 'restraining' ? (
                        <input className="pcx-field-sm" value={x.azaltma || ''} onChange={inp('forcefield', colDef.key, i, 'azaltma')} placeholder={t('Bu direnci nasıl zayıflatırsınız?', 'How would you weaken this resistance?')} style={{ ...S.inputSm, font: '11.5px/1.4 Helvetica,Arial,sans-serif' }} />
                      ) : null}
                    </div>
                  ))}
                </div>
                <AddButton onClick={() => updC(cc => { cc.forcefield = cc.forcefield || { driving: [], restraining: [] }; cc.forcefield[colDef.key].push(colDef.key === 'restraining' ? { text: '', strength: '', azaltma: '' } : { text: '', strength: '' }); })} style={{ marginTop: 8 }}>{t('+ Kuvvet ekle', '+ Add force')}</AddButton>
              </div>
            );
          })}
        </div>
        {(() => {
          const d = ((c.forcefield || {}).driving || []).reduce((a, x) => a + (parseInt(x.strength, 10) || 0), 0);
          const r = ((c.forcefield || {}).restraining || []).reduce((a, x) => a + (parseInt(x.strength, 10) || 0), 0);
          if (!d && !r) return null;
          return (
            <div style={{ marginTop: 10, font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: d > r ? 'var(--ok-ink)' : d < r ? 'var(--warn-ink)' : 'var(--ink-3)' }}>
              {d > r
                ? t('İtici kuvvetler önde (' + d + ' / ' + r + ') — yine de en güçlü direnci zayıflatmadan başlamayın.', 'Driving forces lead (' + d + ' vs ' + r + ') — still, do not start before weakening the strongest resistance.')
                : d < r
                  ? t('Kısıtlayıcı kuvvetler önde (' + r + ' / ' + d + ') — bu plan bu haliyle dirence çarpar; önce zayıflatma önlemlerini plana ekleyin.', 'Restraining forces lead (' + r + ' vs ' + d + ') — as is, this plan will hit resistance; add the mitigations to the plan first.')
                  : t('Kuvvetler dengede (' + d + ' / ' + r + ') — küçük bir direnç artışı planı durdurabilir.', 'Forces are balanced (' + d + ' vs ' + r + ') — a small rise in resistance could stall the plan.')}
            </div>
          );
        })()}
      </AdvancedSection>

      {/* Aksiyon planı */}
      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>{t('Aksiyon Planı', 'Action Plan')}</div>
        <div style={S.cardSub}>{t('Kararı hayata geçirecek somut adımları yazın; sorumlu ve süre atayın, etki/efora göre önceliklendirin.', 'Write the concrete steps that implement the decision; assign an owner and timing, and prioritize by impact/effort.')}</div>
        <MethodBox margin="0 0 14px">{t('Etki/Efor matrisi — yüksek etki + düşük efor "hızlı kazanım"dır, önce yapılır; yüksek etki + yüksek efor "stratejik"tir, planlanır; düşük etki + yüksek efor sorgulanmalıdır. Her aksiyonun ölçülebilir bir çıktısı ve tek bir sorumlusu olmalıdır.', "Impact/Effort matrix — high impact + low effort is a 'quick win', done first; high impact + high effort is 'strategic', planned; low impact + high effort should be questioned. Every action needs a measurable output and a single owner.")}</MethodBox>

        <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border)', borderRadius: 8, padding: '12px 14px', margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {acIdle ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 220 }}>
                {t('Rehber; kararınıza, kök nedenlerinize ve bulgularınıza bakarak önceliklendirilmiş aksiyonlar önerebilir.', 'The coach can suggest prioritized actions from your decision, root causes and findings.')}
                {ac && ac.status === 'error' ? <span style={{ color: 'var(--alert)' }}> {t('Öneri hazırlanamadı', 'Could not prepare the suggestion')}{ac.errMsg ? ' (' + ac.errMsg + ')' : ''}{t(' — tekrar deneyin.', ' — try again.')}</span> : null}
              </div>
              <HButton onClick={runActionCoach} style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.primaryHover}>{t('Rehberden aksiyon önerisi al', 'Get action suggestions from the coach')}</HButton>
            </div>
          ) : null}
          {ac && ac.status === 'busy' ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Spinner />
              <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>{t('Rehber çalışıyor — karar ve kök nedenlerinize göre aksiyonlar hazırlanıyor…', 'The coach is working — preparing actions from your decision and root causes…')}</div>
            </div>
          ) : null}
          {ac && ac.status === 'done' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px' }}>{t('REHBERİN AKSİYON ÖNERİLERİ', "COACH'S ACTION SUGGESTIONS")}</div>
              {(ac.items || []).map((it, i) => {
                const p = prioMeta(it, lang);
                const sub = [it.sorumluRol, it.sure, (it.etki && it.efor) ? t('Etki ', 'Impact ') + it.etki + t(' · Efor ', ' · Effort ') + it.efor : '', it.gerekce].filter(Boolean).join(' · ');
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
                    >{it.added ? t('Eklendi ✓', 'Added ✓') : t('Plana ekle', 'Add to plan')}</button>
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
              const p = prioMeta(a, lang);
              const late = isOverdue(a);
              return (
                <div key={i} style={{ ...S.itemCard, border: late ? '1px solid var(--alert-border)' : S.itemCard.border }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Badge>{i + 1}</Badge>
                    <textarea
                      className="pcx-field" value={a.text} onChange={inp('actions', i, 'text')}
                      placeholder={t('Aksiyon — ölçülebilir çıktısı olan somut bir iş', 'Action — a concrete task with a measurable output')}
                      aria-label={t((i + 1) + '. aksiyon tanımı', 'Action ' + (i + 1) + ' definition')}
                      style={{ ...S.textarea, flex: 1, width: 'auto', minHeight: 46 }}
                    />
                    {late ? <div style={{ flex: 'none', padding: '5px 10px', borderRadius: 20, border: '1px solid var(--alert-border)', background: 'var(--alert-soft)', color: 'var(--alert)', font: '700 10.5px Helvetica,Arial,sans-serif', marginTop: 4 }}>{t('⏰ GECİKTİ', '⏰ OVERDUE')}</div> : null}
                    <div style={{ flex: 'none', padding: '5px 10px', borderRadius: 20, border: '1px solid ' + p.border, background: p.bg, color: p.color, font: '700 10.5px Helvetica,Arial,sans-serif', marginTop: 4 }}>{p.label}</div>
                    <RemoveButton onClick={() => removeC(t('aksiyon', 'action'), cc => cc.actions.splice(i, 1))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr 1fr' : '1.4fr 1fr 1fr .7fr .7fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>{t('SORUMLU', 'OWNER')}</label>
                      <input className="pcx-field-sm" value={a.owner} onChange={inp('actions', i, 'owner')} placeholder={t('Rol / kişi', 'Role / person')} aria-label={t((i + 1) + '. aksiyonun sorumlusu', 'Action ' + (i + 1) + ' owner')} style={S.inputSm} />
                    </div>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>{t('BAŞLANGIÇ', 'START')}</label>
                      <input className="pcx-field-sm" type="date" value={a.startDate || ''} onChange={inp('actions', i, 'startDate')} aria-label={t((i + 1) + '. aksiyonun başlangıç tarihi', 'Action ' + (i + 1) + ' start date')} style={S.inputSm} />
                    </div>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>{t('TERMİN', 'DUE DATE')}</label>
                      <input className="pcx-field-sm" type="date" value={a.dueDate || ''} onChange={inp('actions', i, 'dueDate')} aria-label={t((i + 1) + '. aksiyonun termin tarihi', 'Action ' + (i + 1) + ' due date')} style={{ ...S.inputSm, borderColor: late ? 'var(--alert)' : undefined }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>{t('ETKİ (1-5)', 'IMPACT (1-5)')}</label>
                      <select value={a.etki || ''} onChange={inp('actions', i, 'etki')} aria-label={t((i + 1) + '. aksiyonun etkisi', 'Action ' + (i + 1) + ' impact')} style={S.select}>
                        <option value="">—</option>{[1, 2, 3, 4, 5].map(v => <option key={v} value={String(v)}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>{t('EFOR (1-5)', 'EFFORT (1-5)')}</label>
                      <select value={a.efor || ''} onChange={inp('actions', i, 'efor')} aria-label={t((i + 1) + '. aksiyonun eforu', 'Action ' + (i + 1) + ' effort')} style={S.select}>
                        <option value="">—</option>{[1, 2, 3, 4, 5].map(v => <option key={v} value={String(v)}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  {(a.due || '').trim() && !(a.dueDate || '').trim() ? (
                    <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)' }}>
                      {t('Eski termin kaydı: "', 'Legacy due record: "')}<strong>{a.due}</strong>{t('" — takip ve gecikme uyarısı için lütfen gerçek bir termin tarihi seçin.', '" — pick a real due date to enable tracking and overdue alerts.')}
                    </div>
                  ) : null}
                  <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>{t('HANGİ KÖK NEDENİ GİDERİYOR?', 'WHICH ROOT CAUSE DOES IT FIX?')}</label>
                      <select value={String(a.rcIdx ?? '')} onChange={inp('actions', i, 'rcIdx')} aria-label={t((i + 1) + '. aksiyonun bağlı olduğu kök neden', 'Root cause linked to action ' + (i + 1))} style={S.select}>
                        <option value="">{t('— seçilmedi —', '— not selected —')}</option>
                        {(c.rootCauses || []).map((rc, ri) => (rc.text || '').trim()
                          ? <option key={ri} value={String(ri)}>{t('KN', 'RC')}{ri + 1} — {rc.text.slice(0, 60)}</option> : null)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>{t('HANGİ BULGUYU KAPATIYOR?', 'WHICH FINDING DOES IT CLOSE?')}</label>
                      <select value={String(a.findingIdx ?? '')} onChange={inp('actions', i, 'findingIdx')} aria-label={t((i + 1) + '. aksiyonun bağlı olduğu bulgu', 'Finding linked to action ' + (i + 1))} style={S.select}>
                        <option value="">{t('— seçilmedi —', '— not selected —')}</option>
                        {(c.findings || []).map((f, fi) => (f.text || '').trim()
                          ? <option key={fi} value={String(fi)}>{t('B', 'F')}{fi + 1} — {f.text.slice(0, 60)}</option> : null)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>{t('ÖNCELİK', 'PRIORITY')}</label>
                      <select value={a.priority || ''} onChange={inp('actions', i, 'priority')} aria-label={t((i + 1) + '. aksiyonun önceliği', 'Action ' + (i + 1) + ' priority')} style={S.select}>
                        <option value="">{t('Etki/efora göre otomatik', 'Automatic from impact/effort')}</option>
                        <option value="yuksek">{t('Yüksek — hemen', 'High — do now')}</option>
                        <option value="orta">{t('Orta — planlı', 'Medium — planned')}</option>
                        <option value="dusuk">{t('Düşük — sıra gelince', 'Low — when time allows')}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 4px' }}>{t('BAŞARI ÖLÇÜTÜ', 'SUCCESS CRITERION')}</label>
                    <input
                      className="pcx-field-sm" value={a.successCriteria || ''} onChange={inp('actions', i, 'successCriteria')}
                      placeholder={t('Ne olursa bu aksiyon başarılı sayılır? (ölçülebilir)', 'What makes this action a success? (measurable)')}
                      aria-label={t((i + 1) + '. aksiyonun başarı ölçütü', 'Action ' + (i + 1) + ' success criterion')} style={S.inputSm}
                    />
                  </div>
                  {String(a.rcIdx ?? '') === '' ? (
                    <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
                      {t('Kök nedene bağlanmamış aksiyonlar izlenebilirlik denetiminde işaretlenir — bu aksiyon hangi kök nedeni gideriyor?', 'Actions not linked to a root cause are flagged in the traceability audit — which root cause does this action fix?')}
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
          >{t('+ Aksiyon ekle', '+ Add action')}</AddButton>
          {(c.actions || []).length ? (
            <HButton
              onClick={() => updC(cc => cc.actions.sort((x, y) => prioMeta(y).score - prioMeta(x).score))}

              style={{ flex: 'none', padding: '10px 14px', border: '1px solid var(--field-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={{ background: 'var(--surface-4)' }}
            >{t('Önceliğe göre sırala', 'Sort by priority')}</HButton>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
