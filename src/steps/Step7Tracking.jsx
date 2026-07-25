import React from 'react';
import { useStore } from '../lib/store.jsx';
import { trackingBars, trackingGapText } from '../lib/derive.js';
import { Card, GuidanceBox, MethodBox, AddButton, RemoveButton, S } from '../ui/primitives.jsx';
import { DAILY_HABITS } from '../lib/thinking.js';

const QUESTIONS = [
  'Aksiyonlar gerçekten ilerliyor mu, yoksa sadece listede mi duruyor?',
  'KPI trendi hedefe kapanıyor mu? Kapanmıyorsa kök neden mi, karşı önlem mi yanlıştı?',
  'Sonuç iyi diye kararı doğru mu sayıyorum — süreç de doğru muydu? (sonuç yanlılığı)',
  'Bu kararı bugün, bildiklerimle yeniden alsam yine aynı kararı alır mıydım?',
  'İşe yarayan neyi standarda bağlayacağız; yaramayan neyi durduracağız?'
];

const STATUS_META = {
  tamam: ['Tamamlandı', 'var(--ok-soft)', 'var(--ok-ink)', 'var(--ok-border)'],
  devam: ['Devam ediyor', 'var(--pri-soft)', 'var(--pri)', 'var(--pri-border-2)'],
  gecikti: ['Gecikti', 'var(--alert-soft)', 'var(--alert)', 'var(--alert-border)'],
  bekliyor: ['Bekliyor', 'var(--surface-4)', 'var(--ink-4)', 'var(--line-strong)']
};

export default function Step7Tracking() {
  const { c, updC, inp, removeC } = useStore();
  const cont = c.containment || {};
  const actions = c.actions || [];
  const hasActions = actions.some(a => (a.text || '').trim());
  const bars = trackingBars(c);
  const hasBars = (c.tracking || []).some(x => isFinite(parseFloat(x.value)));

  return (
    <div>
      <GuidanceBox items={QUESTIONS} />

      {(cont.action || '').trim() ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: cont.removed ? 'var(--ok-soft)' : 'var(--warn-soft)', border: '1px solid ' + (cont.removed ? 'var(--ok-border)' : 'var(--warn-border)'), borderRadius: 10, padding: '12px 16px', margin: '0 0 16px' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ font: '700 12px Helvetica,Arial,sans-serif', color: cont.removed ? 'var(--ok-ink)' : 'var(--warn-ink)', letterSpacing: '.4px', margin: '0 0 3px' }}>
              {cont.removed ? '✓ GEÇİCİ ÖNLEM KALDIRILDI' : '⏳ GEÇİCİ ÖNLEM HÂLÂ DEVREDE'}
            </div>
            <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{cont.action}</div>
            {!cont.removed ? (
              <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 3 }}>
                Geçici önlem çözüm değildir ve maliyet üretir — KPI trendi kalıcı çözümün çalıştığını doğruladığında kaldırın{(cont.until || '').trim() ? ' (' + cont.until + ')' : ''}.
              </div>
            ) : null}
          </div>
          <button
            onClick={() => updC(cc => { cc.containment.removed = !cc.containment.removed; })}
            style={{ flex: 'none', padding: '8px 14px', border: '1px solid ' + (cont.removed ? 'var(--field-border)' : 'var(--ok)'), borderRadius: 8, background: cont.removed ? 'var(--surface)' : 'var(--ok)', color: cont.removed ? 'var(--ink-3)' : 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
          >{cont.removed ? 'Yeniden devreye al' : 'Kaldırıldı olarak işaretle'}</button>
        </div>
      ) : null}

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>Aksiyon Durumu</div>
        <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 12px' }}>Adım 6'daki aksiyon planının ilerlemesini işaretleyin.</div>

        {hasActions ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actions.map((a, i) => {
              if (!(a.text || '').trim()) return null;
              const m = STATUS_META[a.status || ''] || ['Durum seçin', 'var(--surface-4)', 'var(--muted)', 'var(--line-strong)'];
              const meta = [a.owner, a.due].filter(Boolean).join(' · ');
              return (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', border: '1px solid var(--line-2)', borderRadius: 8, padding: '10px 12px', background: 'var(--surface-2)' }}>
                  <div style={{ flex: 'none', background: 'var(--pri)', color: 'var(--on-pri)', borderRadius: 5, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 7px' }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '600 12.5px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{a.text}</div>
                    <div style={{ font: '11px/1.4 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 2 }}>{meta}</div>
                  </div>
                  <div style={{ flex: 'none', padding: '4px 10px', borderRadius: 20, border: '1px solid ' + m[3], background: m[1], color: m[2], font: '700 10.5px Helvetica,Arial,sans-serif' }}>{m[0]}</div>
                  <select
                    value={a.status || ''} onChange={inp('actions', i, 'status')}
                    style={{ flex: 'none', width: 130, boxSizing: 'border-box', padding: '7px 9px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12px Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
                  >
                    <option value="">Durum seçin…</option>
                    <option value="bekliyor">Bekliyor</option>
                    <option value="devam">Devam ediyor</option>
                    <option value="tamam">Tamamlandı</option>
                    <option value="gecikti">Gecikti</option>
                  </select>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', background: 'var(--surface-3)', border: '1px dashed var(--field-border)', borderRadius: 8, padding: '12px 14px' }}>
            Henüz aksiyon yok — önce <strong>Adım 6</strong>'da aksiyon planınızı oluşturun.
          </div>
        )}
      </Card>

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>KPI İzleme</div>
        <div style={S.cardSub}>{(c.problem.kpiName || 'KPI') + ' · Hedef: ' + (c.problem.target || '—')} — dönem dönem ölçüm girin; trend hedefe kapanıyor mu görün.</div>
        <MethodBox margin="0 0 14px">Karşı önlemin işe yarayıp yaramadığını sadece KPI söyler. Trend hedefe kapanmıyorsa kök neden ya da karşı önlem yanlıştır — 5. adıma dönüp analizi güncelleyin (PDCA).</MethodBox>

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
              <div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ok-ink)' }}><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--ok)', borderRadius: 2, marginRight: 5 }} />Hedefte</div>
              <div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)' }}><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--pri-bar)', borderRadius: 2, marginRight: 5 }} />Hedef dışı</div>
              <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--alert)' }}>{trackingGapText(c)}</div>
            </div>
          </>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '0 0 10px' }}>
          {(c.tracking || []).map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input className="pcx-field-sm" value={t.label} onChange={inp('tracking', i, 'label')} placeholder="Dönem — örn. Ağustos, 34. hafta" style={{ ...S.inputSm, flex: 1.4 }} />
              <input className="pcx-field-sm" value={t.value} onChange={inp('tracking', i, 'value')} placeholder="Ölçülen değer" style={{ ...S.inputSm, flex: 1 }} />
              <RemoveButton onClick={() => removeC('KPI ölçümü', cc => cc.tracking.splice(i, 1))} />
            </div>
          ))}
        </div>
        <AddButton onClick={() => updC(cc => { cc.tracking = cc.tracking || []; cc.tracking.push({ label: '', value: '' }); })}>+ Ölçüm ekle</AddButton>
      </Card>

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>Retrospektif</div>
        <div style={S.cardSub}>Döngüyü dürüstçe kapatın — bu cevaplar bir sonraki probleminizde sizi daha iyi yapacak.</div>
        <MethodBox margin="0 0 14px">Retrospektifte başarıyı da başarısızlığı da sahiplenin; işe yarayan karşı önlemi standarda bağlayın, yaramayanı belirti tedavisi olarak işaretleyip analize dönün.</MethodBox>

        <label style={S.label}>Kök neden tespitimiz doğru muydu? Neyi gözden kaçırmışız?</label>
        <textarea className="pcx-field" value={(c.retro && c.retro.valid) || ''} onChange={inp('retro', 'valid')} style={{ ...S.textarea, minHeight: 52, margin: '0 0 12px' }} />

        <label style={S.label}>Karşı önlemler işe yaradı mı? KPI hedefe kapanıyor mu?</label>
        <textarea className="pcx-field" value={(c.retro && c.retro.worked) || ''} onChange={inp('retro', 'worked')} style={{ ...S.textarea, minHeight: 52, margin: '0 0 12px' }} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', margin: '0 0 6px' }}>
          <label style={{ ...S.label, margin: 0 }}>Karar sonrası refleksiyon — süreç mi doğruydu, yoksa sadece sonuç mu iyi?</label>
          <span style={{ font: '11px Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 20, padding: '2px 8px' }}>→ Sonuç yanlılığına karşı</span>
        </div>
        <textarea
          className="pcx-field" value={(c.retro && c.retro.process) || ''} onChange={inp('retro', 'process')}
          placeholder="Bu kararı bugün, bildiklerimle yeniden alsam yine aynı kararı alır mıydım? İyi sonuç şansa mı, doğru sürece mi dayanıyor?"
          style={{ ...S.textarea, minHeight: 52, margin: '0 0 12px' }}
        />

        <label style={S.label}>Öğrendiklerimiz — standarda bağlanacaklar, bir dahaki sefere farklı yapacaklarımız</label>
        <textarea className="pcx-field" value={(c.retro && c.retro.lessons) || ''} onChange={inp('retro', 'lessons')} style={{ ...S.textarea, minHeight: 64 }} />

        <div style={{ border: '1px solid var(--line-2)', borderRadius: 8, background: 'var(--surface-2)', padding: '11px 13px', marginTop: 14 }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px', margin: '0 0 7px' }}>DÖNGÜYÜ AYAKTA TUTAN GÜNLÜK ALIŞKANLIKLAR</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {DAILY_HABITS.map((h, i) => (
              <div key={i}>
                <div style={{ font: '600 11.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{h.ad} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>→ {h.against}</span></div>
                <div style={{ font: '11px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink-4)' }}>{h.not}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
