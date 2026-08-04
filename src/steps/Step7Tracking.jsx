import React from 'react';
import { useStore } from '../lib/store.jsx';
import { trackingBars, trackingGapText, isOverdue } from '../lib/derive.js';
import { Card, GuidanceBox, MethodBox, AddButton, RemoveButton, HButton, Spinner, S } from '../ui/primitives.jsx';
import { DAILY_HABITS } from '../lib/thinking.js';

const QUESTIONS = t => [
  t('Aksiyonlar gerçekten ilerliyor mu, yoksa sadece listede mi duruyor?', 'Are the actions actually moving forward, or just sitting on the list?'),
  t('KPI trendi hedefe kapanıyor mu? Kapanmıyorsa kök neden mi, karşı önlem mi yanlıştı?', 'Is the KPI trend closing toward the target? If not, was the root cause or the countermeasure wrong?'),
  t('Sonuç iyi diye kararı doğru mu sayıyorum — süreç de doğru muydu? (sonuç yanlılığı)', 'Am I calling the decision right just because the outcome is good — was the process right too? (outcome bias)'),
  t('Bu kararı bugün, bildiklerimle yeniden alsam yine aynı kararı alır mıydım?', 'If I made this decision again today with what I know now, would I make the same call?'),
  t('İşe yarayan neyi standarda bağlayacağız; yaramayan neyi durduracağız?', "Which of what worked will we turn into a standard, and which of what didn't will we stop?")
];

const STATUS_META = t => ({
  tamam: [t('Tamamlandı', 'Completed'), 'var(--ok-soft)', 'var(--ok-ink)', 'var(--ok-border)'],
  devam: [t('Devam ediyor', 'In progress'), 'var(--pri-soft)', 'var(--pri)', 'var(--pri-border-2)'],
  gecikti: [t('Gecikti', 'Delayed'), 'var(--alert-soft)', 'var(--alert)', 'var(--alert-border)'],
  bekliyor: [t('Bekliyor', 'Waiting'), 'var(--surface-4)', 'var(--ink-4)', 'var(--line-strong)']
});

// DAILY_HABITS ile sıra sıra eşleşen İngilizce karşılıklar (TR verisi thinking.js'te kalır).
const DAILY_HABITS_EN = [
  { ad: 'No interpreting without observing', against: 'Representativeness bias', not: 'Cut sentences that start with "I think"; replace them with "here is the data I saw/heard".' },
  { ad: 'Reframing the problem', against: 'Status quo bias', not: 'Ask on every problem: what are we actually trying to solve — is this really the problem?' },
  { ad: 'Short post-decision reflection', against: 'Outcome bias', not: 'A good outcome does not make the decision right: was the process right, would I make the same call today?' }
];

export default function Step7Tracking() {
  const { c, updC, inp, removeC, runTrackingCoach, applyTrackingPlan, runRetroCoach, applyRetroCoach, t, lang } = useStore();
  const aiReady = (c.problem.statement || '').trim().length > 0;
  const tc = c.trackingCoach;
  const rc = c.retroCoach;
  const cont = c.containment || {};
  const actions = c.actions || [];
  const hasActions = actions.some(a => (a.text || '').trim());
  const bars = trackingBars(c, lang);
  const hasBars = (c.tracking || []).some(x => isFinite(parseFloat(x.value)));
  const statusMeta = STATUS_META(t);

  return (
    <div>
      <GuidanceBox items={QUESTIONS(t)} />

      {(cont.action || '').trim() ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: cont.removed ? 'var(--ok-soft)' : 'var(--warn-soft)', border: '1px solid ' + (cont.removed ? 'var(--ok-border)' : 'var(--warn-border)'), borderRadius: 10, padding: '12px 16px', margin: '0 0 16px' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ font: '700 12px Helvetica,Arial,sans-serif', color: cont.removed ? 'var(--ok-ink)' : 'var(--warn-ink)', letterSpacing: '.4px', margin: '0 0 3px' }}>
              {cont.removed ? t('✓ GEÇİCİ ÖNLEM KALDIRILDI', '✓ CONTAINMENT REMOVED') : t('⏳ GEÇİCİ ÖNLEM HÂLÂ DEVREDE', '⏳ CONTAINMENT STILL IN PLACE')}
            </div>
            <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{cont.action}</div>
            {!cont.removed ? (
              <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 3 }}>
                {t('Geçici önlem çözüm değildir ve maliyet üretir — KPI trendi kalıcı çözümün çalıştığını doğruladığında kaldırın', 'Containment is not a solution and generates cost — remove it once the KPI trend confirms the permanent fix is working')}{(cont.until || '').trim() ? ' (' + cont.until + ')' : ''}.
              </div>
            ) : null}
          </div>
          <button
            onClick={() => updC(cc => { cc.containment.removed = !cc.containment.removed; })}
            style={{ flex: 'none', padding: '8px 14px', border: '1px solid ' + (cont.removed ? 'var(--field-border)' : 'var(--ok)'), borderRadius: 8, background: cont.removed ? 'var(--surface)' : 'var(--ok)', color: cont.removed ? 'var(--ink-3)' : 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
          >{cont.removed ? t('Yeniden devreye al', 'Reinstate') : t('Kaldırıldı olarak işaretle', 'Mark as removed')}</button>
        </div>
      ) : null}

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>{t('Aksiyon Durumu', 'Action Status')}</div>
        <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 12px' }}>{t("Adım 6'daki aksiyon planının ilerlemesini işaretleyin.", 'Track the progress of the action plan from Step 6.')}</div>

        {hasActions ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actions.map((a, i) => {
              if (!(a.text || '').trim()) return null;
              const late = isOverdue(a);
              const m = late
                ? [t('Termin geçti', 'Past due'), 'var(--alert-soft)', 'var(--alert)', 'var(--alert-border)']
                : (statusMeta[a.status || ''] || [t('Durum seçin', 'Select status'), 'var(--surface-4)', 'var(--muted)', 'var(--line-strong)']);
              const meta = [a.owner, (a.dueDate || '').trim() ? t('Termin: ', 'Due: ') + a.dueDate : (a.due || ''), (a.successCriteria || '').trim() ? t('Ölçüt: ', 'Criterion: ') + a.successCriteria : ''].filter(Boolean).join(' · ');
              return (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap', border: '1px solid ' + (late ? 'var(--alert-border)' : 'var(--line-2)'), borderRadius: 8, padding: '10px 12px', background: late ? 'var(--alert-soft)' : 'var(--surface-2)' }}>
                  <div style={{ flex: 'none', background: 'var(--pri)', color: 'var(--on-pri)', borderRadius: 5, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 7px', marginTop: 3 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ font: '600 12.5px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{a.text}</div>
                    <div style={{ font: '11px/1.4 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 2 }}>{meta}</div>
                  </div>
                  <div style={{ flex: 'none', padding: '4px 10px', borderRadius: 20, border: '1px solid ' + m[3], background: late ? 'var(--surface)' : m[1], color: m[2], font: '700 10.5px Helvetica,Arial,sans-serif', marginTop: 3 }}>{late ? '⏰ ' + m[0] : m[0]}</div>
                  <select
                    value={a.status || ''} onChange={inp('actions', i, 'status')}
                    aria-label={t((i + 1) + '. aksiyonun ilerleme durumu', 'Progress status of action ' + (i + 1))}
                    style={{ flex: 'none', width: 130, boxSizing: 'border-box', padding: '7px 9px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12px Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
                  >
                    <option value="">{t('Durum seçin…', 'Select status…')}</option>
                    <option value="bekliyor">{t('Bekliyor', 'Waiting')}</option>
                    <option value="devam">{t('Devam ediyor', 'In progress')}</option>
                    <option value="tamam">{t('Tamamlandı', 'Completed')}</option>
                    <option value="gecikti">{t('Gecikti', 'Delayed')}</option>
                  </select>
                  {late || a.status === 'gecikti' ? (
                    <input
                      className="pcx-field-sm" value={a.delayReason || ''} onChange={inp('actions', i, 'delayReason')}
                      placeholder={t('Gecikme nedeni — neyi bekliyoruz?', 'Reason for delay — what are we waiting on?')}
                      aria-label={t((i + 1) + '. aksiyonun gecikme nedeni', 'Reason for delay of action ' + (i + 1))}
                      style={{ ...S.inputSm, flex: '1 1 100%' }}
                    />
                  ) : null}
                  {a.status === 'tamam' ? (
                    <input
                      className="pcx-field-sm" value={a.evidence || ''} onChange={inp('actions', i, 'evidence')}
                      placeholder={t('Tamamlandı kanıtı — başarı ölçütü karşılandı mı?', 'Completion evidence — was the success criterion met?')}
                      aria-label={t((i + 1) + '. aksiyonun tamamlanma kanıtı', 'Completion evidence of action ' + (i + 1))}
                      style={{ ...S.inputSm, flex: '1 1 100%' }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', background: 'var(--surface-3)', border: '1px dashed var(--field-border)', borderRadius: 8, padding: '12px 14px' }}>
            {t('Henüz aksiyon yok — önce ', 'No actions yet — first build your action plan in ')}<strong>{t('Adım 6', 'Step 6')}</strong>{t("'da aksiyon planınızı oluşturun.", '.')}
          </div>
        )}
      </Card>

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>{t('KPI İzleme', 'KPI Tracking')}</div>
        <div style={S.cardSub}>{(c.problem.kpiName || 'KPI') + t(' · Hedef: ', ' · Target: ') + (c.problem.target || '—')}{t(' — dönem dönem ölçüm girin; trend hedefe kapanıyor mu görün.', ' — enter measurements period by period; see whether the trend is closing toward the target.')}</div>
        <MethodBox margin="0 0 14px">{t('Karşı önlemin işe yarayıp yaramadığını sadece KPI söyler. Trend hedefe kapanmıyorsa kök neden ya da karşı önlem yanlıştır — 5. adıma dönüp analizi güncelleyin (PDCA).', 'Only the KPI tells you whether the countermeasure worked. If the trend is not closing toward the target, the root cause or the countermeasure is wrong — go back to Step 5 and update the analysis (PDCA).')}</MethodBox>

        {/* Rehberden trend değerlendirmesi — analizdir, form doldurmaz */}
        {aiReady ? (
          <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border)', borderRadius: 8, padding: '12px 14px', margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!tc || tc.status === 'error' ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 220 }}>
                  {hasBars
                    ? t('Rehber; ölçümlerinize, aksiyon durumlarınıza ve geçici önleme bakarak trendin hedefe kapanıp kapanmadığını değerlendirir, erken uyarı sinyallerini işaretler.', 'The Coach reviews your measurements, action statuses and containment to assess whether the trend is closing toward the target, and flags early warning signals.')
                    : t('Henüz ölçüm yok. Rehber; KPI tanımınıza ve kök nedenlerinize bakarak ölçüm sıklığı, dönem satırları ve izlenecek ara metrikleri içeren bir izleme planı önerebilir.', 'No measurements yet. Based on your KPI definition and root causes, the Coach can suggest a tracking plan with measurement frequency, period rows and intermediate metrics to watch.')}
                  {tc && tc.status === 'error' ? <span style={{ color: 'var(--alert)' }}>{t(' Değerlendirme yapılamadı', ' Assessment failed')}{tc.errMsg ? ' (' + tc.errMsg + ')' : ''}{t(' — tekrar deneyin.', ' — try again.')}</span> : null}
                </div>
                <HButton onClick={runTrackingCoach} style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: 'var(--pri-hover)' }}>{hasBars ? t('Rehberden trend değerlendirmesi al', 'Get trend assessment from Coach') : t('Rehberden izleme planı al', 'Get tracking plan from Coach')}</HButton>
              </div>
            ) : null}
            {tc && tc.status === 'busy' ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Spinner />
                <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>{hasBars ? t('Trend ve aksiyon durumları değerlendiriliyor…', 'Assessing trend and action statuses…') : t('KPI tanımınıza göre izleme planı hazırlanıyor…', 'Preparing a tracking plan based on your KPI definition…')}</div>
              </div>
            ) : null}
            {tc && tc.status === 'done' && tc.mode !== 'plan' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(() => {
                  const M = {
                    kapaniyor: { label: t('✓ Trend hedefe kapanıyor', '✓ Trend is closing toward the target'), bg: 'var(--ok-soft)', border: 'var(--ok-border)', ink: 'var(--ok-ink)' },
                    belirsiz: { label: t('? Trend henüz belirsiz', '? Trend still unclear'), bg: 'var(--warn-soft)', border: 'var(--warn-border)', ink: 'var(--warn-ink)' },
                    kapanmiyor: { label: t('⚠ Trend hedefe kapanmıyor', '⚠ Trend is not closing toward the target'), bg: 'var(--alert-soft)', border: 'var(--alert-border)', ink: 'var(--alert)' }
                  }[tc.durum] || { label: '?', bg: 'var(--warn-soft)', border: 'var(--warn-border)', ink: 'var(--warn-ink)' };
                  return <div style={{ alignSelf: 'flex-start', font: '700 12px Helvetica,Arial,sans-serif', color: M.ink, background: M.bg, border: '1px solid ' + M.border, borderRadius: 20, padding: '5px 12px' }}>{M.label} <span style={{ fontWeight: 400 }}>{t('— YZ değerlendirmesi, kesin hüküm değil', '— AI assessment, not a final verdict')}</span></div>;
                })()}
                {tc.yorum ? <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{tc.yorum}</div> : null}
                {(tc.uyarilar || []).length ? (
                  <div>
                    <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', letterSpacing: '.6px', margin: '0 0 4px' }}>{t('ERKEN UYARILAR', 'EARLY WARNINGS')}</div>
                    <ul style={{ margin: 0, padding: '0 0 0 18px' }}>{tc.uyarilar.map((u, i) => <li key={i} style={{ font: '12px/1.55 Helvetica,Arial,sans-serif', color: 'var(--warn-ink-3)' }}>{u}</li>)}</ul>
                  </div>
                ) : null}
                {(tc.oneriler || []).length ? (
                  <div>
                    <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.6px', margin: '0 0 4px' }}>{t('ÖNERİLEN SONRAKİ ADIMLAR', 'SUGGESTED NEXT STEPS')}</div>
                    <ul style={{ margin: 0, padding: '0 0 0 18px' }}>{tc.oneriler.map((o, i) => <li key={i} style={{ font: '12px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{o}</li>)}</ul>
                  </div>
                ) : null}
                {(tc.sorular || []).length ? (
                  <ul style={{ margin: 0, padding: '0 0 0 18px' }}>{tc.sorular.map((q, i) => <li key={i} style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{q}</li>)}</ul>
                ) : null}
                <div style={{ display: 'flex', gap: 8 }}>
                  <HButton onClick={runTrackingCoach} style={{ padding: '7px 12px', border: '1px solid var(--pri-border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--pri)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.ghostHover}>{t('Yeniden değerlendir', 'Reassess')}</HButton>
                  <HButton onClick={() => updC(cc => { delete cc.trackingCoach; })} style={{ padding: '7px 12px', border: 'none', background: 'transparent', color: 'var(--muted)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ color: 'var(--ink-3)' }}>{t('Kapat', 'Close')}</HButton>
                </div>
              </div>
            ) : null}

            {tc && tc.status === 'done' && tc.mode === 'plan' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px' }}>{t('İZLEME PLANI ÖNERİSİ — değerleri siz ölçersiniz', 'TRACKING PLAN SUGGESTION — you measure the values')}</div>
                {tc.giris ? <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{tc.giris}</div> : null}
                {tc.siklik ? <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}><strong>{t('Ölçüm sıklığı:', 'Measurement frequency:')}</strong> {tc.siklik}</div> : null}
                {(tc.donemler || []).length ? (
                  <div>
                    <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.6px', margin: '0 0 5px' }}>{t('ÖNERİLEN DÖNEM SATIRLARI', 'SUGGESTED PERIOD ROWS')}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {tc.donemler.map((d, i) => <span key={i} style={{ font: '600 11.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)', background: 'var(--pri-soft)', border: '1px solid var(--pri-border-5)', borderRadius: 20, padding: '4px 11px' }}>{d}</span>)}
                    </div>
                  </div>
                ) : null}
                {(tc.araMetrikler || []).length ? (
                  <div>
                    <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.6px', margin: '0 0 4px' }}>{t("ANA KPI'IN YANINDA İZLENECEK ARA METRİKLER", 'INTERMEDIATE METRICS TO TRACK ALONGSIDE THE MAIN KPI')}</div>
                    <ul style={{ margin: 0, padding: '0 0 0 18px' }}>{tc.araMetrikler.map((m, i) => <li key={i} style={{ font: '12px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{m}</li>)}</ul>
                  </div>
                ) : null}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(tc.donemler || []).length ? (
                    <HButton
                      onClick={applyTrackingPlan}
                      disabled={tc.applied}
                      style={{ padding: '8px 14px', border: '1px solid ' + (tc.applied ? 'var(--ok-border)' : 'var(--pri)'), borderRadius: 8, background: tc.applied ? 'var(--ok-soft)' : 'var(--pri)', color: tc.applied ? 'var(--ok)' : 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: tc.applied ? 'default' : 'pointer' }}
                      hover={tc.applied ? {} : { background: 'var(--pri-hover)' }}
                    >{tc.applied ? t('Eklendi ✓', 'Added ✓') : t('Dönem satırlarını ekle', 'Add period rows')}</HButton>
                  ) : null}
                  <HButton onClick={runTrackingCoach} style={{ padding: '8px 14px', border: '1px solid var(--pri-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.ghostHover}>{t('Yeniden öner', 'Suggest again')}</HButton>
                  <HButton onClick={() => updC(cc => { delete cc.trackingCoach; })} style={{ padding: '8px 14px', border: 'none', background: 'transparent', color: 'var(--muted)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ color: 'var(--ink-3)' }}>{t('Kapat', 'Close')}</HButton>
                </div>
                {(tc.sorular || []).length ? (
                  <ul style={{ margin: 0, padding: '0 0 0 18px' }}>{tc.sorular.map((q, i) => <li key={i} style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{q}</li>)}</ul>
                ) : null}
                <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t('Satırlar boş eklenir — değerleri gerçek ölçümlerinizle siz doldurursunuz; YZ ölçüm değeri üretmez. İlk satır baz çizgisi (mevcut durum) olmalıdır.', 'Rows are added empty — you fill in the values with your real measurements; the AI does not generate measurement values. The first row should be the baseline (current state).')}</div>
              </div>
            ) : null}
          </div>
        ) : null}

        {hasBars ? (
          <>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', border: '1px solid var(--line-2)', borderRadius: 8, background: 'var(--surface-2)', padding: '16px 16px 10px', margin: '0 0 8px', overflowX: 'auto' }}>
              {bars.map((tb, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 'none', minWidth: 56 }}>
                  <div style={{ font: '700 12px Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{tb.value}</div>
                  <div style={{ width: 34, height: tb.h, background: tb.bg, borderRadius: '5px 5px 2px 2px' }} />
                  <div style={{ font: '10.5px/1.3 Helvetica,Arial,sans-serif', color: 'var(--muted)', textAlign: 'center', maxWidth: 76 }}>{tb.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', margin: '0 0 12px', flexWrap: 'wrap' }}>
              <div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ok-ink)' }}><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--ok)', borderRadius: 2, marginRight: 5 }} />{t('Hedefte', 'On target')}</div>
              <div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)' }}><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--pri-bar)', borderRadius: 2, marginRight: 5 }} />{t('Hedef dışı', 'Off target')}</div>
              <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--alert)' }}>{trackingGapText(c, lang)}</div>
            </div>
          </>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '0 0 10px' }}>
          {(c.tracking || []).map((tr, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input className="pcx-field-sm" value={tr.label} onChange={inp('tracking', i, 'label')} placeholder={t('Dönem — örn. Ağustos, 34. hafta', 'Period — e.g. August, week 34')} style={{ ...S.inputSm, flex: 1.4 }} />
              <input className="pcx-field-sm" value={tr.value} onChange={inp('tracking', i, 'value')} placeholder={t('Ölçülen değer', 'Measured value')} style={{ ...S.inputSm, flex: 1 }} />
              <RemoveButton onClick={() => removeC(t('KPI ölçümü', 'KPI measurement'), cc => cc.tracking.splice(i, 1))} />
            </div>
          ))}
        </div>
        <AddButton onClick={() => updC(cc => { cc.tracking = cc.tracking || []; cc.tracking.push({ label: '', value: '' }); })}>{t('+ Ölçüm ekle', '+ Add measurement')}</AddButton>
      </Card>

      {/* Tetik çizgileri (tripwires) — kriz anında değil, sakin kafayla önceden verilen kararlar */}
      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>{t('Tetik çizgileri', 'Tripwires')}</div>
        <div style={S.cardSub}>{t('"X gerçekleşirse, önceden anlaştığımız Z devreye girer." Tepkiyi kriz anında değil, şimdi — sakin kafayla — kararlaştırın.', '"If X happens, the pre-agreed Z kicks in." Decide the response now, with a clear head — not in the middle of the crisis.')}</div>
        <MethodBox margin="0 0 14px">{t('Tetik çizgisi ölçülebilir bir koşul + tarih + önceden kararlaştırılmış tepkidir. Kontrol tarihi geldiğinde koşula bakın: gerçekleştiyse tepkiyi tartışmadan uygulayın, gerçekleşmediyse çizgiyi kapatın. Sürüklenmeyi (kaynayan kurbağa) önler.', 'A tripwire is a measurable condition + a date + a pre-agreed response. When the check date arrives, look at the condition: if it fired, execute the response without re-debating; if not, close the line. It prevents drift (the boiling frog).')}</MethodBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '0 0 10px' }}>
          {(c.tripwires || []).map((tw, i) => {
            const overdue = (tw.checkDate || '') && !tw.status && tw.checkDate < new Date().toISOString().slice(0, 10);
            return (
              <div key={i} style={{ border: '1px solid ' + (tw.status === 'tetiklendi' ? 'var(--alert-border)' : overdue ? 'var(--warn-border)' : 'var(--line-2)'), borderRadius: 8, padding: '10px 12px', background: tw.status === 'tetiklendi' ? 'var(--alert-soft-2)' : 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    className="pcx-field-sm" value={tw.condition || ''} onChange={inp('tripwires', i, 'condition')}
                    placeholder={t('Koşul — örn. KPI 2 ay içinde 500\'ün altına inmezse', 'Condition — e.g. if the KPI is not below 500 within 2 months')}
                    aria-label={t((i + 1) + '. tetik koşulu', 'Trip condition ' + (i + 1))}
                    style={{ ...S.inputSm, flex: '2 1 260px' }}
                  />
                  <input
                    className="pcx-field-sm" type="date" value={tw.checkDate || ''} onChange={inp('tripwires', i, 'checkDate')}
                    aria-label={t((i + 1) + '. tetik kontrol tarihi', 'Trip check date ' + (i + 1))}
                    style={{ ...S.inputSm, flex: 'none', width: 140 }}
                  />
                  <select
                    className="pcx-field-sm" value={tw.status || ''} onChange={inp('tripwires', i, 'status')}
                    aria-label={t((i + 1) + '. tetik durumu', 'Trip status ' + (i + 1))}
                    style={{ ...S.select, flex: 'none', width: 190, font: '12px Helvetica,Arial,sans-serif' }}
                  >
                    <option value="">{t('İzleniyor', 'Watching')}</option>
                    <option value="tetiklendi">{t('Tetiklendi — tepki devrede', 'Fired — response active')}</option>
                    <option value="temiz">{t('Gerçekleşmedi / kapandı', 'Did not fire / closed')}</option>
                  </select>
                  <RemoveButton onClick={() => removeC(t('tetik çizgisi', 'tripwire'), cc => cc.tripwires.splice(i, 1))} />
                </div>
                <input
                  className="pcx-field-sm" value={tw.response || ''} onChange={inp('tripwires', i, 'response')}
                  placeholder={t('Önceden kararlaştırılan tepki — örn. kapsam daraltılır, B planına geçilir, eskalasyon yapılır', 'Pre-agreed response — e.g. narrow the scope, switch to plan B, escalate')}
                  aria-label={t((i + 1) + '. tetik tepkisi', 'Trip response ' + (i + 1))}
                  style={{ ...S.inputSm, width: '100%', boxSizing: 'border-box' }}
                />
                {overdue ? <div style={{ font: '600 11.5px Helvetica,Arial,sans-serif', color: 'var(--warn-ink)' }}>{t('⏰ Kontrol tarihi geçti — koşula bakın: tetiklendi mi, kapandı mı?', '⏰ Check date has passed — evaluate the condition: did it fire or close?')}</div> : null}
              </div>
            );
          })}
        </div>
        <AddButton onClick={() => updC(cc => { cc.tripwires = cc.tripwires || []; cc.tripwires.push({ condition: '', response: '', checkDate: '', status: '' }); })}>{t('+ Tetik çizgisi ekle', '+ Add tripwire')}</AddButton>
      </Card>

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>{t('Retrospektif', 'Retrospective')}</div>
        <div style={S.cardSub}>{t('Döngüyü dürüstçe kapatın — bu cevaplar bir sonraki probleminizde sizi daha iyi yapacak.', 'Close the loop honestly — these answers will make you better on your next problem.')}</div>
        <MethodBox margin="0 0 14px">{t('Retrospektifte başarıyı da başarısızlığı da sahiplenin; işe yarayan karşı önlemi standarda bağlayın, yaramayanı belirti tedavisi olarak işaretleyip analize dönün.', 'Own both success and failure in the retrospective; turn the countermeasure that worked into a standard, mark the one that did not as symptom treatment and return to the analysis.')}</MethodBox>

        {/* Rehberden retrospektif taslağı — yalnız boş alanlara aktarılır */}
        {aiReady ? (
          <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border)', borderRadius: 8, padding: '12px 14px', margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!rc || rc.status === 'error' ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 220 }}>
                  {t('Rehber; kök neden doğrulama durumlarına, KPI trendine ve aksiyonlara bakarak dört retrospektif sorusu için dürüst taslaklar hazırlayabilir.', 'The Coach can prepare honest drafts for the four retrospective questions based on root cause verification statuses, the KPI trend and the actions.')}
                  {rc && rc.status === 'error' ? <span style={{ color: 'var(--alert)' }}>{t(' Taslak hazırlanamadı', ' Draft could not be prepared')}{rc.errMsg ? ' (' + rc.errMsg + ')' : ''}{t(' — tekrar deneyin.', ' — try again.')}</span> : null}
                </div>
                <HButton onClick={runRetroCoach} style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: 'var(--pri-hover)' }}>{t('Rehberden retrospektif taslağı al', 'Get retrospective draft from Coach')}</HButton>
              </div>
            ) : null}
            {rc && rc.status === 'busy' ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Spinner />
                <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>{t('Çalışmanın bütünü değerlendirilip taslak yazılıyor…', 'Reviewing the whole case and writing the draft…')}</div>
              </div>
            ) : null}
            {rc && rc.status === 'done' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px' }}>{t('RETROSPEKTİF TASLAĞI — dürüst başlangıç noktası; kendi cümlelerinizle düzenleyin', 'RETROSPECTIVE DRAFT — an honest starting point; edit in your own words')}</div>
                {rc.giris ? <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{rc.giris}</div> : null}
                {[['valid', t('Kök neden tespiti doğru muydu?', 'Was the root cause identification correct?')], ['worked', t('Karşı önlemler işe yaradı mı?', 'Did the countermeasures work?')], ['process', t('Süreç mi doğruydu, sonuç mu iyi?', 'Was the process right, or just the outcome good?')], ['lessons', t('Öğrendiklerimiz', 'What we learned')]].map(([k, lb]) => (
                  ((rc.draft || {})[k] || '').trim() ? (
                    <div key={k} style={{ background: 'var(--surface)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '9px 12px' }}>
                      <div style={{ font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', margin: '0 0 3px' }}>{lb}</div>
                      <div style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{rc.draft[k]}</div>
                    </div>
                  ) : null
                ))}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <HButton
                    onClick={applyRetroCoach}
                    disabled={rc.applied}
                    style={{ padding: '8px 14px', border: '1px solid ' + (rc.applied ? 'var(--ok-border)' : 'var(--pri)'), borderRadius: 8, background: rc.applied ? 'var(--ok-soft)' : 'var(--pri)', color: rc.applied ? 'var(--ok)' : 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: rc.applied ? 'default' : 'pointer' }}
                    hover={rc.applied ? {} : { background: 'var(--pri-hover)' }}
                  >{rc.applied ? t('Aktarıldı ✓', 'Applied ✓') : t('Boş alanlara aktar', 'Apply to empty fields')}</HButton>
                  <HButton onClick={runRetroCoach} style={{ padding: '8px 14px', border: '1px solid var(--pri-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.ghostHover}>{t('Yeniden öner', 'Suggest again')}</HButton>
                  <HButton onClick={() => updC(cc => { delete cc.retroCoach; })} style={{ padding: '8px 14px', border: 'none', background: 'transparent', color: 'var(--muted)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ color: 'var(--ink-3)' }}>{t('Kapat', 'Close')}</HButton>
                </div>
                {(rc.sorular || []).length ? (
                  <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {rc.sorular.map((q, i) => <li key={i} style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{q}</li>)}
                  </ul>
                ) : null}
                <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t('Aktarım yalnız boş alanlara yapılır — yazdıklarınız ezilmez. Retrospektif sizin dürüst değerlendirmenizdir; taslağı olduğu gibi bırakmayın.', 'Applied only to empty fields — nothing you wrote is overwritten. The retrospective is your honest assessment; do not leave the draft as is.')}</div>
              </div>
            ) : null}
          </div>
        ) : null}

        <label style={S.label}>{t('Kök neden tespitimiz doğru muydu? Neyi gözden kaçırmışız?', 'Was our root cause identification correct? What did we miss?')}</label>
        <textarea className="pcx-field" value={(c.retro && c.retro.valid) || ''} onChange={inp('retro', 'valid')} style={{ ...S.textarea, minHeight: 52, margin: '0 0 12px' }} />

        <label style={S.label}>{t('Karşı önlemler işe yaradı mı? KPI hedefe kapanıyor mu?', 'Did the countermeasures work? Is the KPI closing toward the target?')}</label>
        <textarea className="pcx-field" value={(c.retro && c.retro.worked) || ''} onChange={inp('retro', 'worked')} style={{ ...S.textarea, minHeight: 52, margin: '0 0 12px' }} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', margin: '0 0 6px' }}>
          <label style={{ ...S.label, margin: 0 }}>{t('Karar sonrası refleksiyon — süreç mi doğruydu, yoksa sadece sonuç mu iyi?', 'Post-decision reflection — was the process right, or just the outcome good?')}</label>
          <span style={{ font: '11px Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 20, padding: '2px 8px' }}>{t('→ Sonuç yanlılığına karşı', '→ Guards against outcome bias')}</span>
        </div>
        <textarea
          className="pcx-field" value={(c.retro && c.retro.process) || ''} onChange={inp('retro', 'process')}
          placeholder={t('Bu kararı bugün, bildiklerimle yeniden alsam yine aynı kararı alır mıydım? İyi sonuç şansa mı, doğru sürece mi dayanıyor?', 'If I made this decision again today with what I know now, would I make the same call? Is the good outcome due to luck or a sound process?')}
          style={{ ...S.textarea, minHeight: 52, margin: '0 0 12px' }}
        />

        <label style={S.label}>{t('Öğrendiklerimiz — standarda bağlanacaklar, bir dahaki sefere farklı yapacaklarımız', 'What we learned — what to standardize, and what we will do differently next time')}</label>
        <textarea className="pcx-field" value={(c.retro && c.retro.lessons) || ''} onChange={inp('retro', 'lessons')} style={{ ...S.textarea, minHeight: 64 }} />

        <div style={{ border: '1px solid var(--line-2)', borderRadius: 8, background: 'var(--surface-2)', padding: '11px 13px', marginTop: 14 }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px', margin: '0 0 7px' }}>{t('DÖNGÜYÜ AYAKTA TUTAN GÜNLÜK ALIŞKANLIKLAR', 'DAILY HABITS THAT KEEP THE LOOP ALIVE')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {DAILY_HABITS.map((h, i) => {
              const e = DAILY_HABITS_EN[i] || h;
              return (
                <div key={i}>
                  <div style={{ font: '600 11.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{t(h.ad, e.ad)} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>→ {t(h.against, e.against)}</span></div>
                  <div style={{ font: '11px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink-4)' }}>{t(h.not, e.not)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
