// Karar öncesi düşünme kontrolü: 3 soru + düşünme yanılgısı taraması + meta katman.
// Kaynak: "Düşünme Yanılgıları (Cognitive Bias)" kurum dokümanının pratik rehber bölümü.

import React from 'react';
import { useStore } from '../lib/store.jsx';
import { PRE_DECISION_QUESTIONS, META_QUESTIONS, MEETING_MOVES } from '../lib/thinking.js';
import { Card, MethodBox, HButton, Spinner, S } from '../ui/primitives.jsx';

const SEVERITY = {
  yüksek: { bg: '#f6e9e5', color: '#8c4a35', border: '#e5c8bf' },
  orta: { bg: '#faf3e3', color: '#8c6a35', border: '#eaddb8' },
  düşük: { bg: '#eef2f7', color: '#35506e', border: '#c9d4e2' }
};

export default function ThinkingCheck() {
  const { c, inp, updC, runBiasScan } = useStore();
  const scan = c.biasScan;
  const idle = !scan || scan.status === 'idle' || scan.status === 'error';
  const th = c.thinking || {};
  const answered = PRE_DECISION_QUESTIONS.filter(q => (th[q.key] || '').trim()).length;

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 4px' }}>
        <div style={S.cardTitle}>Karar Öncesi Düşünme Kontrolü</div>
        <div style={{ flex: 'none', padding: '4px 9px', borderRadius: 20, border: '1px solid ' + (answered === 3 ? '#cfe0cf' : '#e0ddd7'), background: answered === 3 ? '#eef4ee' : '#f1efeb', color: answered === 3 ? '#3d5a3d' : '#8a857c', font: '700 10.5px Helvetica,Arial,sans-serif' }}>
          {answered}/3 yanıtlandı
        </div>
      </div>
      <div style={S.cardSub}>Karar vermeden önce kendinize sorulacak üç soru — düşünce hatalarını erken yakalamanın en ucuz yolu.</div>
      <MethodBox margin="0 0 14px">Hata çoğu zaman düşünmemekten değil, çok hızlı ve farkında olmadan düşünmekten gelir. Her sağlıklı düşünme yöntemi belirli bir yanılgıya karşı denge mekanizmasıdır; bu üç soru en sık üç yanılgıyı hedefler.</MethodBox>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {PRE_DECISION_QUESTIONS.map((q, i) => (
          <div key={q.key}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', margin: '0 0 4px' }}>
              <span style={{ font: '700 12px Helvetica,Arial,sans-serif', color: '#35506e' }}>{i + 1}. {q.title}</span>
              <span style={{ font: '11px Helvetica,Arial,sans-serif', color: '#8c6a35', background: '#faf3e3', border: '1px solid #eaddb8', borderRadius: 20, padding: '2px 8px' }}>→ {q.against}</span>
            </div>
            <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: '#8a857c', margin: '0 0 6px' }}>{q.hint}</div>
            <textarea
              className="pcx-field" value={th[q.key] || ''} onChange={inp('thinking', q.key)} placeholder={q.ph}
              style={{ ...S.textarea, minHeight: 52 }}
            />
          </div>
        ))}
      </div>

      {/* Yanılgı taraması */}
      <div style={{ background: '#f2f6fb', border: '1px solid #b9cbe0', borderRadius: 8, padding: '12px 14px', margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {idle ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: '#3e4a5a', flex: 1, minWidth: 220 }}>
              Rehber tüm çalışmanızı okuyup hangi düşünme yanılgılarının izini taşıdığını kendi cümlelerinizden alıntılarla gösterebilir.
              {scan && scan.status === 'error' ? <span style={{ color: '#8c4a35' }}> Tarama yapılamadı, tekrar deneyin.</span> : null}
            </div>
            <HButton
              onClick={runBiasScan}
              style={{ flex: 'none', padding: '8px 14px', border: '1px solid #35506e', borderRadius: 8, background: '#35506e', color: '#fff', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={S.primaryHover}
            >🧠 Düşünme yanılgısı taraması</HButton>
          </div>
        ) : null}

        {scan && scan.status === 'busy' ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Spinner />
            <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: '#2c4159' }}>Çalışmanız yanılgı kataloğuna karşı taranıyor…</div>
          </div>
        ) : null}

        {scan && scan.status === 'done' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: '#5f7897', letterSpacing: '.8px' }}>DÜŞÜNME YANILGISI TARAMASI</div>
            {scan.ozet ? <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: '#3e4a5a' }}>{scan.ozet}</div> : null}
            {(scan.items || []).map((it, i) => {
              const sev = SEVERITY[(it.ciddiyet || '').toLowerCase()] || SEVERITY.orta;
              return (
                <div key={i} style={{ background: '#fff', border: '1px solid #d8e2ee', borderRadius: 8, padding: '11px 13px' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 5px' }}>
                    <span style={{ padding: '4px 9px', borderRadius: 20, border: '1px solid ' + sev.border, background: sev.bg, color: sev.color, font: '700 10.5px Helvetica,Arial,sans-serif' }}>{it.yanilgi}</span>
                    {it.yontem ? <span style={{ font: '11px Helvetica,Arial,sans-serif', color: '#5f7897' }}>panzehir: {it.yontem}</span> : null}
                  </div>
                  {it.kanit ? <div style={{ font: '12px/1.55 Helvetica,Arial,sans-serif', color: '#57534b', borderLeft: '2px solid #d8e2ee', paddingLeft: 9, margin: '0 0 5px' }}>{it.kanit}</div> : null}
                  {it.risk ? <div style={{ font: '12px/1.55 Helvetica,Arial,sans-serif', color: '#6d6860', margin: '0 0 5px' }}>{it.risk}</div> : null}
                  {it.soru ? <div style={{ font: '600 12.5px/1.55 Helvetica,Arial,sans-serif', color: '#26241f' }}>❯ {it.soru}</div> : null}
                </div>
              );
            })}
            {!(scan.items || []).length ? (
              <div style={{ background: '#eef4ee', border: '1px solid #cfe0cf', borderRadius: 8, padding: '10px 12px', font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: '#3d5a3d' }}>
                Belirgin bir yanılgı izi bulunamadı. Yine de aşağıdaki farkındalık sorularını bir kez daha geçin.
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: 8 }}>
              <HButton onClick={runBiasScan} style={{ padding: '7px 12px', border: '1px solid #b9cbe0', borderRadius: 7, background: '#fff', color: '#35506e', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.ghostHover}>Yeniden tara</HButton>
              <HButton onClick={() => updC(cc => { delete cc.biasScan; })} style={{ padding: '7px 12px', border: 'none', background: 'transparent', color: '#8a857c', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ color: '#57534b' }}>Kapat</HButton>
            </div>
          </div>
        ) : null}
      </div>

      {/* Meta katman + toplantı hamleleri */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
        <div style={{ border: '1px solid #e8e5df', borderRadius: 8, background: '#fbfaf8', padding: '11px 13px' }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: '#8a857c', letterSpacing: '.8px', margin: '0 0 7px' }}>DÜŞÜNME FARKINDALIĞI</div>
          <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {META_QUESTIONS.map((q, i) => <li key={i} style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: '#57534b' }}>{q}</li>)}
          </ul>
          <div style={{ font: '600 11.5px/1.5 Helvetica,Arial,sans-serif', color: '#8c4a35', marginTop: 8 }}>Kural: hızlı düşündüğünüzü fark ettiğiniz an yavaşlayın.</div>
        </div>
        <div style={{ border: '1px solid #e8e5df', borderRadius: 8, background: '#fbfaf8', padding: '11px 13px' }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: '#8a857c', letterSpacing: '.8px', margin: '0 0 7px' }}>TOPLANTIDA MİKRO MÜDAHALELER</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {MEETING_MOVES.map((m, i) => (
              <div key={i}>
                <div style={{ font: '600 11.5px/1.4 Helvetica,Arial,sans-serif', color: '#26241f' }}>{m.ad} <span style={{ fontWeight: 400, color: '#8a857c' }}>→ {m.against}</span></div>
                <div style={{ font: '11px/1.45 Helvetica,Arial,sans-serif', color: '#6d6860' }}>{m.not}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
