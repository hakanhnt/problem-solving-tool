import React from 'react';
import { useStore } from '../lib/store.jsx';
import { HButton, Spinner } from '../ui/primitives.jsx';

export default function CoachPanel() {
  const { c, step, goStep, ensureCoach, coachRefresh, applyCoachItem } = useStore();
  const aiReady = (c.problem.statement || '').trim().length > 0;

  if (step >= 2 && step <= 6 && !aiReady) {
    return (
      <div style={{ background: '#fdf6ec', border: '1px solid #ecd9b8', borderRadius: 10, padding: '14px 18px', margin: '0 0 20px', font: '13px/1.55 Helvetica,Arial,sans-serif', color: '#7a6231' }}>
        Rehberin sizi probleminize göre yönlendirebilmesi için önce{' '}
        <a href="#" onClick={e => { e.preventDefault(); goStep(1); }} style={{ color: '#35506e', fontWeight: 700 }}>Adım 1'de problem tanımınızı</a>{' '}
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
    <div style={{ background: '#f2f6fb', border: '1px solid #b9cbe0', borderRadius: 12, margin: '0 0 22px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: '#e3ecf5', borderBottom: '1px solid #c9d8e8' }}>
        <div style={{ flex: 'none', width: 22, height: 22, borderRadius: '50%', background: '#35506e', color: '#fff', font: '700 10px/22px Helvetica,Arial,sans-serif', textAlign: 'center' }}>R</div>
        <div style={{ font: '700 13px Helvetica,Arial,sans-serif', color: '#2c4159' }}>Rehber · Probleminize göre bu adımı birlikte dolduralım</div>
        {busy ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <Spinner size={14} border={2} track="#c9d8e8" />
            <div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: '#35506e', animation: 'pcxpulse 1.6s ease-in-out infinite' }}>Rehber çalışıyor…</div>
          </div>
        ) : null}
        {done ? (
          <HButton
            onClick={() => coachRefresh(step)}
            style={{ marginLeft: 'auto', border: '1px solid #b9cbe0', background: '#fff', color: '#35506e', borderRadius: 6, padding: '5px 10px', font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: '#eef2f7' }}
          >Yeniden öner</HButton>
        ) : null}
      </div>

      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {idle ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ font: '13px/1.55 Helvetica,Arial,sans-serif', color: '#3e4a5a', flex: 1, minWidth: 240 }}>
              {step === 1
                ? 'Probleminizi kendi cümlelerinizle yazdıktan sonra rehber ifadenizi metodolojiye göre netleştirir: çözüm/neden dilini ayıklar, ölçülebilir hale getirir ve boyut + KPI önerileri hazırlar.'
                : 'Bu adımda ne yazacağınızdan emin değilseniz, rehber problem tanımınıza ve önceki adımlardaki çalışmanıza bakarak size aday girdiler hazırlar.'}
            </div>
            <HButton
              onClick={() => ensureCoach(true)}
              style={{ flex: 'none', padding: '9px 16px', border: '1px solid #35506e', borderRadius: 8, background: '#35506e', color: '#fff', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={{ background: '#2a4159' }}
            >{step === 1 ? 'İfademi netleştir ve öneri hazırla' : 'Probleminize göre öneri hazırla'}</HButton>
          </div>
        ) : null}

        {busy ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#fff', border: '1px solid #d8e2ee', borderRadius: 8, padding: '14px 16px' }}>
            <Spinner size={20} border={3} />
            <div>
              <div style={{ font: '700 13px Helvetica,Arial,sans-serif', color: '#2c4159' }}>Rehber çalışıyor</div>
              <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: '#5f7897' }}>Problem tanımınız ve önceki adımlardaki çalışmanız inceleniyor; bu adım için aday girdiler hazırlanıyor. Bu birkaç saniye sürebilir.</div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ font: '13px/1.5 Helvetica,Arial,sans-serif', color: '#8c4a35', flex: 1, minWidth: 240 }}>
              Öneriler hazırlanırken bir hata oluştu ({ck.errMsg || ''}). Genellikle geçicidir — tekrar deneyin.
            </div>
            <HButton
              onClick={() => coachRefresh(step)}
              style={{ flex: 'none', padding: '8px 14px', border: '1px solid #35506e', borderRadius: 8, background: '#fff', color: '#35506e', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={{ background: '#eef2f7' }}
            >Tekrar dene</HButton>
          </div>
        ) : null}

        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ font: '13px/1.6 Helvetica,Arial,sans-serif', color: '#3e4a5a' }}>{ck.intro}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(ck.items || []).map((it, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#fff', border: '1px solid #d8e2ee', borderRadius: 8, padding: '11px 13px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ flex: 'none', font: '700 9.5px Helvetica,Arial,sans-serif', letterSpacing: '.6px', color: '#5f7897', background: '#e8eef6', borderRadius: 4, padding: '3px 6px' }}>{it.tag}</span>
                      <span style={{ font: '600 13px/1.4 Helvetica,Arial,sans-serif', color: '#26241f' }}>{it.title}</span>
                    </div>
                    {it.sub ? <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: '#6d6860', marginTop: 4 }}>{it.sub}</div> : null}
                  </div>
                  <button
                    onClick={() => applyCoachItem(step, i)}
                    style={{
                      flex: 'none',
                      border: '1px solid ' + (it.added ? '#cfe0cf' : '#35506e'),
                      background: it.added ? '#eef4ee' : '#35506e',
                      color: it.added ? '#4a6741' : '#fff',
                      borderRadius: 6, padding: '7px 12px', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer'
                    }}
                  >{it.added ? 'Eklendi ✓' : (it.btn || 'Forma ekle')}</button>
                </div>
              ))}
            </div>
            {(ck.questions || []).length ? (
              <div style={{ background: '#fff', border: '1px solid #d8e2ee', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: '#5f7897', letterSpacing: '.8px', margin: '0 0 8px' }}>DOĞRULAMAK İÇİN KENDİNİZE / PAYDAŞLARINIZA SORUN</div>
                <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {ck.questions.map((q, i) => <li key={i} style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: '#3e4a5a' }}>{q}</li>)}
                </ul>
              </div>
            ) : null}
            <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: '#8a857c' }}>Bu öneriler kesin doğrular değil, hipotezlerdir — işi yapanlarla ve veriyle doğrulayın; probleminize uymayanları eklemeyin, eklediklerinizi kendi tespitlerinizle düzenleyin.</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
