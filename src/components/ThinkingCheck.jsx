// Karar öncesi düşünme kontrolü: 3 soru + düşünme yanılgısı taraması + meta katman.
// Kaynak: "Düşünme Yanılgıları (Cognitive Bias)" kurum dokümanının pratik rehber bölümü.

import React from 'react';
import { useStore } from '../lib/store.jsx';
import { PRE_DECISION_QUESTIONS, META_QUESTIONS, MEETING_MOVES, LEADER_MOVES } from '../lib/thinking.js';
import { Card, MethodBox, HButton, Spinner, S } from '../ui/primitives.jsx';

const SEVERITY = {
  yüksek: { bg: 'var(--alert-soft)', color: 'var(--alert)', border: 'var(--alert-border)' },
  orta: { bg: 'var(--warn-soft)', color: 'var(--warn-ink)', border: 'var(--warn-border)' },
  düşük: { bg: 'var(--pri-soft)', color: 'var(--pri)', border: 'var(--pri-border-2)' }
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
        <div style={{ flex: 'none', padding: '4px 9px', borderRadius: 20, border: '1px solid ' + (answered === 3 ? 'var(--ok-border)' : 'var(--line-strong)'), background: answered === 3 ? 'var(--ok-soft)' : 'var(--surface-4)', color: answered === 3 ? 'var(--ok-ink)' : 'var(--muted)', font: '700 10.5px Helvetica,Arial,sans-serif' }}>
          {answered}/3 yanıtlandı
        </div>
      </div>
      <div style={S.cardSub}>Karar vermeden önce kendinize sorulacak üç soru — düşünce hatalarını erken yakalamanın en ucuz yolu.</div>
      <MethodBox margin="0 0 14px">Hata çoğu zaman düşünmemekten değil, çok hızlı ve farkında olmadan düşünmekten gelir. Her sağlıklı düşünme yöntemi belirli bir yanılgıya karşı denge mekanizmasıdır; bu üç soru en sık üç yanılgıyı hedefler.</MethodBox>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {PRE_DECISION_QUESTIONS.map((q, i) => (
          <div key={q.key}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', margin: '0 0 4px' }}>
              <span style={{ font: '700 12px Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>{i + 1}. {q.title}</span>
              <span style={{ font: '11px Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 20, padding: '2px 8px' }}>→ {q.against}</span>
            </div>
            <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 6px' }}>{q.hint}</div>
            <textarea
              className="pcx-field" value={th[q.key] || ''} onChange={inp('thinking', q.key)} placeholder={q.ph}
              style={{ ...S.textarea, minHeight: 52 }}
            />
          </div>
        ))}
      </div>

      {/* Yanılgı taraması */}
      <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border)', borderRadius: 8, padding: '12px 14px', margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {idle ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 220 }}>
              Rehber tüm çalışmanızı okuyup hangi düşünme yanılgılarının izini taşıdığını kendi cümlelerinizden alıntılarla gösterebilir.
              {scan && scan.status === 'error' ? <span style={{ color: 'var(--alert)' }}> Tarama yapılamadı, tekrar deneyin.</span> : null}
            </div>
            <HButton
              onClick={runBiasScan}
              style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={S.primaryHover}
            >🧠 Düşünme yanılgısı taraması</HButton>
          </div>
        ) : null}

        {scan && scan.status === 'busy' ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Spinner />
            <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>Çalışmanız yanılgı kataloğuna karşı taranıyor…</div>
          </div>
        ) : null}

        {scan && scan.status === 'done' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px' }}>DÜŞÜNME YANILGISI TARAMASI</div>
            {scan.ozet ? <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{scan.ozet}</div> : null}
            {(scan.items || []).map((it, i) => {
              const sev = SEVERITY[(it.ciddiyet || '').toLowerCase()] || SEVERITY.orta;
              return (
                <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '11px 13px' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 5px' }}>
                    <span style={{ padding: '4px 9px', borderRadius: 20, border: '1px solid ' + sev.border, background: sev.bg, color: sev.color, font: '700 10.5px Helvetica,Arial,sans-serif' }}>{it.yanilgi}</span>
                    {it.yontem ? <span style={{ font: '11px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)' }}>panzehir: {it.yontem}</span> : null}
                  </div>
                  {it.kanit ? <div style={{ font: '12px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', borderLeft: '2px solid var(--pri-border-4)', paddingLeft: 9, margin: '0 0 5px' }}>{it.kanit}</div> : null}
                  {it.risk ? <div style={{ font: '12px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink-4)', margin: '0 0 5px' }}>{it.risk}</div> : null}
                  {it.soru ? <div style={{ font: '600 12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>❯ {it.soru}</div> : null}
                </div>
              );
            })}
            {!(scan.items || []).length ? (
              <div style={{ background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 8, padding: '10px 12px', font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ok-ink)' }}>
                Belirgin bir yanılgı izi bulunamadı. Yine de aşağıdaki farkındalık sorularını bir kez daha geçin.
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: 8 }}>
              <HButton onClick={runBiasScan} style={{ padding: '7px 12px', border: '1px solid var(--pri-border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--pri)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.ghostHover}>Yeniden tara</HButton>
              <HButton onClick={() => updC(cc => { delete cc.biasScan; })} style={{ padding: '7px 12px', border: 'none', background: 'transparent', color: 'var(--muted)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ color: 'var(--ink-3)' }}>Kapat</HButton>
            </div>
          </div>
        ) : null}
      </div>

      {/* Meta katman + toplantı hamleleri + lider davranışları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12, marginTop: 14 }}>
        <div style={{ border: '1px solid var(--line-2)', borderRadius: 8, background: 'var(--surface-2)', padding: '11px 13px' }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px', margin: '0 0 7px' }}>DÜŞÜNME FARKINDALIĞI</div>
          <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {META_QUESTIONS.map((q, i) => <li key={i} style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{q}</li>)}
          </ul>
          <div style={{ font: '600 11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--alert)', marginTop: 8 }}>Kural: hızlı düşündüğünüzü fark ettiğiniz an yavaşlayın.</div>
        </div>
        <div style={{ border: '1px solid var(--line-2)', borderRadius: 8, background: 'var(--surface-2)', padding: '11px 13px' }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px', margin: '0 0 7px' }}>TOPLANTIDA MİKRO MÜDAHALELER</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {MEETING_MOVES.map((m, i) => (
              <div key={i}>
                <div style={{ font: '600 11.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{m.ad} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>→ {m.against}</span></div>
                <div style={{ font: '11px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink-4)' }}>{m.not}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ border: '1px solid var(--line-2)', borderRadius: 8, background: 'var(--surface-2)', padding: '11px 13px' }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px', margin: '0 0 7px' }}>LİDER DAVRANIŞLARI</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {LEADER_MOVES.map((m, i) => (
              <div key={i}>
                <div style={{ font: '600 11.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{m.ad}</div>
                <div style={{ font: '11px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink-4)' }}>{m.not}</div>
              </div>
            ))}
          </div>
          <div style={{ font: '600 11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', marginTop: 8 }}>Sistemi lider kurar; ama liderin davranışı sistemden güçlüdür.</div>
        </div>
      </div>
    </Card>
  );
}
