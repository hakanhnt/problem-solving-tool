import React from 'react';
import { useStore } from '../lib/store.jsx';
import { HButton, Spinner } from '../ui/primitives.jsx';

/** Öneri kartının dayanağı — kullanıcı verisinden mi, referanstan mı, salt yöntemden mi geliyor? */
function basisMeta(it, c) {
  if (it.kind === 'statement' || it.kind === 'dim' || it.kind === 'kpi') {
    return { label: 'Sizin girdinizden türetildi', tone: 'ok', tip: 'Yazdığınız problem ifadesi ve alanlarınız yeniden düzenlendi; yeni bilgi eklenmedi.' };
  }
  if ((c.references || []).length) {
    return { label: 'Yöntem + eklediğiniz referanslar', tone: 'pri', tip: 'Metodolojiye ve Adım 1\'de eklediğiniz referanslara dayanır; verinizle doğrulanması gerekir.' };
  }
  return { label: 'Genel metodolojiden — doğrulanmamış varsayım', tone: 'warn', tip: 'Sizin verinizde karşılığı olmayabilir; yalnızca yöntemin tipik örüntülerine dayanır. Kabul etmeden önce doğrulayın.' };
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
  const { c, step, upd, goStep, ensureCoach, coachRefresh, applyCoachItem } = useStore();
  const aiReady = (c.problem.statement || '').trim().length > 0;
  const [preview, setPreview] = React.useState(null);   // { idx, draft }

  if (step >= 2 && step <= 6 && !aiReady) {
    return (
      <div style={{ background: 'var(--warn-soft-3)', border: '1px solid var(--warn-border-3)', borderRadius: 10, padding: '14px 18px', margin: '0 0 20px', font: '13px/1.55 Helvetica,Arial,sans-serif', color: 'var(--warn-ink-2)' }}>
        Rehberin sizi probleminize göre yönlendirebilmesi için önce{' '}
        <a href="#" onClick={e => { e.preventDefault(); goStep(1); }} style={{ color: 'var(--pri)', fontWeight: 700 }}>Adım 1'de problem tanımınızı</a>{' '}
        yazın. Tanım girildikten sonra rehber bu adım için aday girdiler önerecek ve doğrulamanız için sizi yönlendirecek.
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
        <div style={{ flex: 'none', width: 22, height: 22, borderRadius: '50%', background: 'var(--pri)', color: 'var(--on-pri)', font: '700 10px/22px Helvetica,Arial,sans-serif', textAlign: 'center' }}>R</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '700 13px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>Rehber · Probleminize göre bu adımı birlikte dolduralım</div>
          <div style={{ font: '600 10.5px Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', marginTop: 2 }}>Taslak / hipotez — veriyle doğrulayın</div>
        </div>
        {busy ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <Spinner size={14} border={2} track="var(--pri-border-3)" />
            <div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--pri)', animation: 'pcxpulse 1.6s ease-in-out infinite' }}>Rehber çalışıyor…</div>
          </div>
        ) : null}
        {done ? (
          <HButton
            onClick={() => coachRefresh(step)}
            style={{ marginLeft: 'auto', border: '1px solid var(--pri-border)', background: 'var(--surface)', color: 'var(--pri)', borderRadius: 6, padding: '5px 10px', font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--pri-soft)' }}
          >Yeniden öner</HButton>
        ) : null}
      </div>

      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {idle ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ font: '13px/1.55 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 240 }}>
              {step === 1
                ? 'Probleminizi kendi cümlelerinizle yazdıktan sonra rehber ifadenizi metodolojiye göre netleştirir: çözüm/neden dilini ayıklar, ölçülebilir hale getirir ve boyut + KPI önerileri hazırlar.'
                : 'Bu adımda ne yazacağınızdan emin değilseniz, rehber problem tanımınıza ve önceki adımlardaki çalışmanıza bakarak size aday girdiler hazırlar.'}
            </div>
            <HButton
              onClick={() => ensureCoach(true)}
              style={{ flex: 'none', padding: '9px 16px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={{ background: 'var(--pri-hover)' }}
            >{step === 1 ? 'İfademi netleştir ve öneri hazırla' : 'Probleminize göre öneri hazırla'}</HButton>
          </div>
        ) : null}

        {busy ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '14px 16px' }}>
            <Spinner size={20} border={3} />
            <div>
              <div style={{ font: '700 13px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>Rehber çalışıyor</div>
              <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)' }}>
                {ck && ck.chars
                  ? 'Öneriler üretiliyor — şu ana kadar ' + ck.chars.toLocaleString('tr-TR') + ' karakter geldi…'
                  : 'Problem tanımınız ve önceki adımlardaki çalışmanız inceleniyor; bu adım için aday girdiler hazırlanıyor.'}
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ font: '13px/1.5 Helvetica,Arial,sans-serif', color: 'var(--alert)', flex: 1, minWidth: 240 }}>
              Öneriler hazırlanırken bir hata oluştu ({ck.errMsg || ''}). Genellikle geçicidir — tekrar deneyin.
            </div>
            <HButton
              onClick={() => coachRefresh(step)}
              style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--surface)', color: 'var(--pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={{ background: 'var(--pri-soft)' }}
            >Tekrar dene</HButton>
            {/^Ayarlar|anahtar|API adresi/i.test(ck.errMsg || '') ? (
              <HButton
                onClick={() => upd(n => { n.showSettings = true; })}
                style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                hover={{ background: 'var(--pri-hover)' }}
              >⚙ Ayarları aç</HButton>
            ) : null}
          </div>
        ) : null}

        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ font: '13px/1.6 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{ck.intro}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(ck.items || []).map((it, i) => {
                const bm = basisMeta(it, c);
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
                            ⚠ Örnek değer: {invented.join(', ')} — bu sayı(lar) sizin verinizde yok, yer tutucudur. Gerçek ölçümünüzle değiştirin.
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
                      >{it.added ? 'Eklendi ✓' : (overwrites ? (open ? 'Kapat' : 'Karşılaştır ve karar ver') : (it.btn || 'Forma ekle'))}</button>
                    </div>

                    {open ? (
                      <div style={{ marginTop: 10, borderTop: '1px solid var(--line-3)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ background: 'var(--alert-soft)', border: '1px solid var(--alert-border)', borderRadius: 6, padding: '8px 10px', font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--alert)' }}>
                          Bu öneri mevcut metninizin <strong>üzerine yazar</strong>. Kabul ederseniz Ctrl+Z ya da "Geri al" ile eski hâline dönebilirsiniz.
                        </div>
                        <div>
                          <div style={{ font: '700 10px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.6px', margin: '0 0 4px' }}>ŞU ANKİ METNİNİZ</div>
                          <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 6, padding: '8px 10px', whiteSpace: 'pre-wrap' }}>{current}</div>
                        </div>
                        <div>
                          <label htmlFor={'pcx-coach-draft-' + i} style={{ display: 'block', font: '700 10px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.6px', margin: '0 0 4px' }}>ÖNERİLEN METİN — eklemeden önce düzenleyebilirsiniz</label>
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
                          >Kabul et ve uygula</HButton>
                          <HButton
                            onClick={() => setPreview(null)}
                            style={{ padding: '8px 14px', border: '1px solid var(--field-border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                            hover={{ background: 'var(--surface-4)' }}
                          >Reddet</HButton>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {(ck.questions || []).length ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px', margin: '0 0 8px' }}>DOĞRULAMAK İÇİN KENDİNİZE / PAYDAŞLARINIZA SORUN</div>
                <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {ck.questions.map((q, i) => <li key={i} style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{q}</li>)}
                </ul>
              </div>
            ) : null}
            <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>Bu öneriler kesin doğrular değil, hipotezlerdir — işi yapanlarla ve veriyle doğrulayın; probleminize uymayanları eklemeyin, eklediklerinizi kendi tespitlerinizle düzenleyin.</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
