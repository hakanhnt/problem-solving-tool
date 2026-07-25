import React from 'react';
import { useStore } from '../lib/store.jsx';
import { trackingBars, trackingGapText } from '../lib/derive.js';
import { Card, MethodBox, AddButton, RemoveButton, S } from '../ui/primitives.jsx';

const STATUS_META = {
  tamam: ['Tamamlandı', '#eef4ee', '#3d5a3d', '#cfe0cf'],
  devam: ['Devam ediyor', '#eef2f7', '#35506e', '#c9d4e2'],
  gecikti: ['Gecikti', '#f6e9e5', '#8c4a35', '#e5c8bf'],
  bekliyor: ['Bekliyor', '#f1efeb', '#6d6860', '#e0ddd7']
};

export default function Step7Tracking() {
  const { c, updC, inp } = useStore();
  const actions = c.actions || [];
  const hasActions = actions.some(a => (a.text || '').trim());
  const bars = trackingBars(c);
  const hasBars = (c.tracking || []).some(x => isFinite(parseFloat(x.value)));

  return (
    <div>
      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>Aksiyon Durumu</div>
        <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: '#8a857c', margin: '0 0 12px' }}>Adım 6'daki aksiyon planının ilerlemesini işaretleyin.</div>

        {hasActions ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actions.map((a, i) => {
              if (!(a.text || '').trim()) return null;
              const m = STATUS_META[a.status || ''] || ['Durum seçin', '#f1efeb', '#8a857c', '#e0ddd7'];
              const meta = [a.owner, a.due].filter(Boolean).join(' · ');
              return (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', border: '1px solid #e8e5df', borderRadius: 8, padding: '10px 12px', background: '#fbfaf8' }}>
                  <div style={{ flex: 'none', background: '#35506e', color: '#fff', borderRadius: 5, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 7px' }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '600 12.5px/1.45 Helvetica,Arial,sans-serif', color: '#26241f' }}>{a.text}</div>
                    <div style={{ font: '11px/1.4 Helvetica,Arial,sans-serif', color: '#8a857c', marginTop: 2 }}>{meta}</div>
                  </div>
                  <div style={{ flex: 'none', padding: '4px 10px', borderRadius: 20, border: '1px solid ' + m[3], background: m[1], color: m[2], font: '700 10.5px Helvetica,Arial,sans-serif' }}>{m[0]}</div>
                  <select
                    value={a.status || ''} onChange={inp('actions', i, 'status')}
                    style={{ flex: 'none', width: 130, boxSizing: 'border-box', padding: '7px 9px', border: '1px solid #d6d3ce', borderRadius: 6, font: '12px Helvetica,Arial,sans-serif', color: '#26241f', background: '#fff', outline: 'none' }}
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
          <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: '#8a857c', background: '#f7f6f3', border: '1px dashed #d6d3ce', borderRadius: 8, padding: '12px 14px' }}>
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
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', border: '1px solid #e8e5df', borderRadius: 8, background: '#fbfaf8', padding: '16px 16px 10px', margin: '0 0 8px', overflowX: 'auto' }}>
              {bars.map((tb, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 'none', minWidth: 56 }}>
                  <div style={{ font: '700 12px Helvetica,Arial,sans-serif', color: '#26241f' }}>{tb.value}</div>
                  <div style={{ width: 34, height: tb.h, background: tb.bg, borderRadius: '5px 5px 2px 2px' }} />
                  <div style={{ font: '10.5px/1.3 Helvetica,Arial,sans-serif', color: '#8a857c', textAlign: 'center', maxWidth: 76 }}>{tb.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', margin: '0 0 12px', flexWrap: 'wrap' }}>
              <div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: '#3d5a3d' }}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#4a6741', borderRadius: 2, marginRight: 5 }} />Hedefte</div>
              <div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: '#5f7897' }}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#8fb0d4', borderRadius: 2, marginRight: 5 }} />Hedef dışı</div>
              <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: '#8c4a35' }}>{trackingGapText(c)}</div>
            </div>
          </>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '0 0 10px' }}>
          {(c.tracking || []).map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input className="pcx-field-sm" value={t.label} onChange={inp('tracking', i, 'label')} placeholder="Dönem — örn. Ağustos, 34. hafta" style={{ ...S.inputSm, flex: 1.4 }} />
              <input className="pcx-field-sm" value={t.value} onChange={inp('tracking', i, 'value')} placeholder="Ölçülen değer" style={{ ...S.inputSm, flex: 1 }} />
              <RemoveButton onClick={() => updC(cc => cc.tracking.splice(i, 1))} />
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

        <label style={S.label}>Öğrendiklerimiz — standarda bağlanacaklar, bir dahaki sefere farklı yapacaklarımız</label>
        <textarea className="pcx-field" value={(c.retro && c.retro.lessons) || ''} onChange={inp('retro', 'lessons')} style={{ ...S.textarea, minHeight: 64 }} />
      </Card>
    </div>
  );
}
