import React from 'react';
import { useStore } from '../lib/store.jsx';
import { HButton, Spinner } from '../ui/primitives.jsx';

/** Öneri kartının dayanağı — kullanıcı verisinden mi, referanstan mı, salt yöntemden mi geliyor? */
function basisMeta(it, c, t) {
  if (it.kind === 'statement' || it.kind === 'dim' || it.kind === 'kpi') {
    return { label: t('Sizin girdinizden türetildi', 'Derived from your input'), tone: 'ok', tip: t('Yazdığınız problem ifadesi ve alanlarınız yeniden düzenlendi; yeni bilgi eklenmedi.', 'Your problem statement and fields were reorganized; no new information was added.') };
  }
  if ((c.references || []).length) {
    return { label: t('Yöntem + eklediğiniz referanslar', 'Method + your added references'), tone: 'pri', tip: t('Metodolojiye ve Adım 1\'de eklediğiniz referanslara dayanır; verinizle doğrulanması gerekir.', 'Based on the methodology and the references you added in Step 1; it must be validated with your data.') };
  }
  return { label: t('Genel metodolojiden — doğrulanmamış varsayım', 'From general methodology — unvalidated assumption'), tone: 'warn', tip: t('Sizin verinizde karşılığı olmayabilir; yalnızca yöntemin tipik örüntülerine dayanır. Kabul etmeden önce doğrulayın.', 'It may have no counterpart in your data; it relies only on the method\'s typical patterns. Validate before accepting.') };
}

const TONES = {
  ok: { bg: 'var(--ok-soft)', border: 'var(--ok-border)', ink: 'var(--ok-ink)' },
  pri: { bg: 'var(--pri-soft)', border: 'var(--pri-border-5)', ink: 'var(--pri-ink)' },
  warn: { bg: 'var(--warn-soft)', border: 'var(--warn-border)', ink: 'var(--warn-ink)' }
};

/** Öneride kullanıcının verisinde bulunmayan sayı var mı? (uydurma sayı uyarısı) */
function inventedNumbers(text, c) {
  const nums = String(text || '').match(/\d+[.,]?\d*/g) || [];
  if (!nums.length) return [];
  const haystack = JSON.stringify({ p: c.problem, f: c.findings, d: c.drivers, da: c.driverAnalysis, t: c.tracking, r: (c.references || []).map(x => x.text) });
  return [...new Set(nums.filter(n => n.length > 1 && haystack.indexOf(n) < 0))];
}

export default function CoachPanel() {
  const { c, step, upd, goStep, ensureCoach, coachRefresh, coachMore, applyCoachItem, t, lang } = useStore();
  const aiReady = (c.problem.statement || '').trim().length > 0;
  const [preview, setPreview] = React.useState(null);   // { idx, draft }

  if (step >= 2 && step <= 6 && !aiReady) {
    return (
      <div style={{ background: 'var(--warn-soft-3)', border: '1px solid var(--warn-border-3)', borderRadius: 10, padding: '14px 18px', margin: '0 0 20px', font: '13px/1.55 Helvetica,Arial,sans-serif', color: 'var(--warn-ink-2)' }}>
        {t("Rehberin sizi probleminize göre yönlendirebilmesi için önce", 'For the coach to guide you based on your problem, write')}{' '}
        <a href="#" onClick={e => { e.preventDefault(); goStep(1); }} style={{ color: 'var(--pri)', fontWeight: 700 }}>{t("Adım 1'de problem tanımınızı", 'your problem definition in Step 1')}</a>{' '}
        {t("yazın. Tanım girildikten sonra rehber bu adım için aday girdiler önerecek ve doğrulamanız için sizi yönlendirecek.", 'first. Once the definition is entered, the coach will suggest candidate inputs for this step and guide you through validating them.')}
      </div>
    );
  }

  if (!(step >= 1 && step <= 6 && aiReady)) return null;

  const ck = (c.coach && c.coach[step]) || null;
  const status = ck ? ck.status : 'idle';
  const idle = !ck || status === 'idle';
  const busy = status === 'busy';
  const error = status === 'error';
  const done = status === 'done';

  return (
    <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border)', borderRadius: 12, margin: '0 0 22px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: 'var(--pri-soft-3)', borderBottom: '1px solid var(--pri-border-3)' }}>
        <div style={{ flex: 'none', width: 22, height: 22, borderRadius: '50%', background: 'var(--pri)', color: 'var(--on-pri)', font: '700 10px/22px Helvetica,Arial,sans-serif', textAlign: 'center' }}>{t('R', 'C')}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '700 13px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>{t('Rehber · Probleminize göre bu adımı birlikte dolduralım', 'Coach · Let\'s fill in this step together based on your problem')}</div>
          <div style={{ font: '600 10.5px Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', marginTop: 2 }}>{t('Taslak / hipotez — veriyle doğrulayın', 'Draft / hypothesis — validate with data')}</div>
        </div>
        {busy ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <Spinner size={14} border={2} track="var(--pri-border-3)" />
            <div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--pri)', animation: 'pcxpulse 1.6s ease-in-out infinite' }}>{t('Rehber çalışıyor…', 'Coach is working…')}</div>
          </div>
        ) : null}
        {done ? (
          <HButton
            onClick={() => coachRefresh(step)}
            style={{ marginLeft: 'auto', border: '1px solid var(--pri-border)', background: 'var(--surface)', color: 'var(--pri)', borderRadius: 6, padding: '5px 10px', font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--pri-soft)' }}
          >{t('Yeniden öner', 'Suggest again')}</HButton>
        ) : null}
      </div>

      {/* Durum ekran okuyucuya da duyurulur — görsel gösterge tek başına yeterli değil */}
      <div className="pcx-sr-only" role="status" aria-live="polite">
        {busy ? t('Rehber çalışıyor, öneriler hazırlanıyor.', 'The coach is working; suggestions are being prepared.') : null}
        {done ? (ck.items || []).length + t(' öneri hazır. Her öneri bir hipotezdir, veriyle doğrulayın.', ' suggestions ready. Each suggestion is a hypothesis — validate with data.') : null}
        {error ? t('Öneriler hazırlanamadı: ', 'Suggestions could not be prepared: ') + (ck.errMsg || t('bilinmeyen hata', 'unknown error')) + t('. Tekrar deneyebilirsiniz.', '. You can try again.') : null}
      </div>

      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {idle ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ font: '13px/1.55 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 240 }}>
              {step === 1
                ? t('Probleminizi kendi cümlelerinizle yazdıktan sonra rehber ifadenizi metodolojiye göre netleştirir: çözüm/neden dilini ayıklar, ölçülebilir hale getirir ve boyut + KPI önerileri hazırlar.', 'After you write your problem in your own words, the coach refines your statement per the methodology: it removes solution/cause language, makes it measurable, and prepares dimension + KPI suggestions.')
                : t('Bu adımda ne yazacağınızdan emin değilseniz, rehber problem tanımınıza ve önceki adımlardaki çalışmanıza bakarak size aday girdiler hazırlar.', 'If you are unsure what to write in this step, the coach looks at your problem definition and your work in previous steps to prepare candidate inputs for you.')}
            </div>
            <HButton
              onClick={() => ensureCoach(true)}
              style={{ flex: 'none', padding: '9px 16px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={{ background: 'var(--pri-hover)' }}
            >{step === 1 ? t('İfademi netleştir ve öneri hazırla', 'Refine my statement and prepare suggestions') : t('Probleminize göre öneri hazırla', 'Prepare suggestions for your problem')}</HButton>
          </div>
        ) : null}

        {busy ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '14px 16px' }}>
            <Spinner size={20} border={3} />
            <div>
              <div style={{ font: '700 13px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>{t('Rehber çalışıyor', 'Coach is working')}</div>
              <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)' }}>
                {ck && ck.chars
                  ? t('Öneriler üretiliyor — şu ana kadar ', 'Generating suggestions — ') + ck.chars.toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR') + t(' karakter geldi…', ' characters received so far…')
                  : t('Problem tanımınız ve önceki adımlardaki çalışmanız inceleniyor; bu adım için aday girdiler hazırlanıyor.', 'Reviewing your problem definition and your work in previous steps; preparing candidate inputs for this step.')}
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ font: '13px/1.5 Helvetica,Arial,sans-serif', color: 'var(--alert)', flex: 1, minWidth: 240 }}>
              {t('Öneriler hazırlanırken bir hata oluştu (', 'An error occurred while preparing suggestions (')}{ck.errMsg || ''}{t('). Genellikle geçicidir — tekrar deneyin.', '). It is usually temporary — try again.')}
            </div>
            <HButton
              onClick={() => coachRefresh(step)}
              style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--surface)', color: 'var(--pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={{ background: 'var(--pri-soft)' }}
            >{t('Tekrar dene', 'Try again')}</HButton>
            {/^Ayarlar|anahtar|API adresi/i.test(ck.errMsg || '') ? (
              <HButton
                onClick={() => upd(n => { n.showSettings = true; })}
                style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                hover={{ background: 'var(--pri-hover)' }}
              >{t('⚙ Ayarları aç', '⚙ Open settings')}</HButton>
            ) : null}
          </div>
        ) : null}

        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ font: '13px/1.6 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{ck.intro}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(ck.items || []).map((it, i) => {
                const bm = basisMeta(it, c, t);
                const tone = TONES[bm.tone];
                const invented = inventedNumbers((it.title || '') + ' ' + (it.sub || ''), c);
                // Mevcut içeriğin üzerine yazacak öneriler önce karşılaştırmalı gösterilir.
                const current = it.kind === 'statement' ? (c.problem.statement || '').trim()
                  : it.kind === 'decision' ? [(c.decision.choice || '').trim(), (c.decision.rationale || '').trim()].filter(Boolean).join('\n\n')
                    : '';
                const overwrites = !!current && (it.kind === 'statement' || it.kind === 'decision');
                const open = preview && preview.idx === i;
                return (
                  <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '11px 13px' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ flex: 'none', font: '700 9.5px Helvetica,Arial,sans-serif', letterSpacing: '.6px', color: 'var(--pri-soft-ink)', background: 'var(--tag-bg)', borderRadius: 4, padding: '3px 6px' }}>{it.tag}</span>
                          <span title={bm.tip} style={{ flex: 'none', font: '600 9.5px Helvetica,Arial,sans-serif', letterSpacing: '.3px', color: tone.ink, background: tone.bg, border: '1px solid ' + tone.border, borderRadius: 20, padding: '2px 8px' }}>{bm.label}</span>
                          <span style={{ font: '600 13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{it.title}</span>
                        </div>
                        {it.sub ? <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-4)', marginTop: 4 }}>{it.sub}</div> : null}
                        {invented.length ? (
                          <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', marginTop: 4 }}>
                            {t('⚠ Örnek değer: ', '⚠ Example value: ')}{invented.join(', ')}{t(' — bu sayı(lar) sizin verinizde yok, yer tutucudur. Gerçek ölçümünüzle değiştirin.', ' — these number(s) are not in your data; they are placeholders. Replace them with your real measurements.')}
                          </div>
                        ) : null}
                      </div>
                      <button
                        onClick={() => {
                          if (it.added) return;
                          if (overwrites) setPreview(open ? null : { idx: i, draft: it.kind === 'statement' ? String(it.payload) : (it.payload.choice || '') + '\n\n' + (it.payload.rationale || '') });
                          else applyCoachItem(step, i);
                        }}
                        aria-expanded={overwrites ? !!open : undefined}
                        style={{
                          flex: 'none',
                          border: '1px solid ' + (it.added ? 'var(--ok-border)' : 'var(--pri)'),
                          background: it.added ? 'var(--ok-soft)' : (open ? 'var(--surface)' : 'var(--pri)'),
                          color: it.added ? 'var(--ok)' : (open ? 'var(--pri)' : 'var(--on-pri)'),
                          borderRadius: 6, padding: '7px 12px', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer'
                        }}
                      >{it.added ? t('Eklendi ✓', 'Added ✓') : (overwrites ? (open ? t('Kapat', 'Close') : t('Karşılaştır ve karar ver', 'Compare and decide')) : (it.btn || t('Forma ekle', 'Add to form')))}</button>
                    </div>

                    {open ? (
                      <div style={{ marginTop: 10, borderTop: '1px solid var(--line-3)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ background: 'var(--alert-soft)', border: '1px solid var(--alert-border)', borderRadius: 6, padding: '8px 10px', font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--alert)' }}>
                          {t('Bu öneri mevcut metninizin ', 'This suggestion ')}<strong>{t('üzerine yazar', 'overwrites')}</strong>{t('. Kabul ederseniz Ctrl+Z ya da "Geri al" ile eski hâline dönebilirsiniz.', ' your current text. If you accept it, you can restore the previous version with Ctrl+Z or "Undo".')}
                        </div>
                        <div>
                          <div style={{ font: '700 10px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.6px', margin: '0 0 4px' }}>{t('ŞU ANKİ METNİNİZ', 'YOUR CURRENT TEXT')}</div>
                          <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 6, padding: '8px 10px', whiteSpace: 'pre-wrap' }}>{current}</div>
                        </div>
                        <div>
                          <label htmlFor={'pcx-coach-draft-' + i} style={{ display: 'block', font: '700 10px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.6px', margin: '0 0 4px' }}>{t('ÖNERİLEN METİN — eklemeden önce düzenleyebilirsiniz', 'SUGGESTED TEXT — you can edit it before applying')}</label>
                          <textarea
                            id={'pcx-coach-draft-' + i}
                            value={preview.draft}
                            onChange={e => { const v = e.target.value; setPreview(p => ({ ...p, draft: v })); }}
                            style={{ width: '100%', boxSizing: 'border-box', minHeight: 110, padding: '8px 10px', border: '1px solid var(--pri-border-4)', borderRadius: 6, font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none', resize: 'vertical' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <HButton
                            onClick={() => {
                              const d = preview.draft;
                              const payload = it.kind === 'statement'
                                ? d
                                : { choice: d.split('\n\n')[0] || d, rationale: d.split('\n\n').slice(1).join('\n\n') };
                              applyCoachItem(step, i, payload);
                              setPreview(null);
                            }}
                            style={{ padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 7, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                            hover={{ background: 'var(--pri-hover)' }}
                          >{t('Kabul et ve uygula', 'Accept and apply')}</HButton>
                          <HButton
                            onClick={() => setPreview(null)}
                            style={{ padding: '8px 14px', border: '1px solid var(--field-border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                            hover={{ background: 'var(--surface-4)' }}
                          >{t('Reddet', 'Reject')}</HButton>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Ek tur: mevcut öneriler korunur, öncekilerden farklı yeni adaylar istenir */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {ck.moreBusy ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>
                  <Spinner size={14} border={2} />{t('Öncekilerden farklı ek öneriler hazırlanıyor…', 'Preparing additional suggestions different from the previous ones…')}
                </div>
              ) : (
                <HButton
                  onClick={() => coachMore(step)}
                  title={t('Öncekilerden farklı ek öneriler istenir; mevcut öneriler silinmez', 'Requests additional suggestions different from the previous ones; existing suggestions are kept')}
                  style={{ padding: '8px 14px', border: '1px dashed var(--pri)', borderRadius: 8, background: 'var(--surface)', color: 'var(--pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                  hover={{ background: 'var(--pri-soft)' }}
                >{t('+ Daha fazla öneri', '+ More suggestions')}</HButton>
              )}
              {ck.moreErr ? <span style={{ font: '12px Helvetica,Arial,sans-serif', color: 'var(--alert)' }}>{t('Ek öneri alınamadı (', 'Could not get additional suggestions (')}{ck.moreErr}{t(') — tekrar deneyin.', ') — try again.')}</span> : null}
              {ck.moreEmpty ? <span style={{ font: '12px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t('Rehber öncekilerden farklı yeni aday bulamadı.', 'The coach could not find new candidates different from the previous ones.')}</span> : null}
            </div>

            {(ck.questions || []).length ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px', margin: '0 0 8px' }}>{t('DOĞRULAMAK İÇİN KENDİNİZE / PAYDAŞLARINIZA SORUN', 'ASK YOURSELF / YOUR STAKEHOLDERS TO VALIDATE')}</div>
                <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {ck.questions.map((q, i) => <li key={i} style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{q}</li>)}
                </ul>
              </div>
            ) : null}
            <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t('Bu öneriler kesin doğrular değil, hipotezlerdir — işi yapanlarla ve veriyle doğrulayın; probleminize uymayanları eklemeyin, eklediklerinizi kendi tespitlerinizle düzenleyin.', 'These suggestions are hypotheses, not established facts — validate them with the people doing the work and with data; do not add ones that do not fit your problem, and edit the ones you add with your own findings.')}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
