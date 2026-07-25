// Yazdırılabilir rapor gövdesi. Store'a bağlı DEĞİLDİR: Adım 8 kendi verisini,
// paylaşım görünümü (SharedView) ise linkten çözülen veriyi geçirir.

import React from 'react';
import { prioMeta } from '../lib/store.jsx';
import { gapInfo, decisionMatrix, trackingBars } from '../lib/derive.js';
import { PRE_DECISION_QUESTIONS } from '../lib/thinking.js';

const secTitle = { font: '700 12px Helvetica,Arial,sans-serif', color: 'var(--pri)', letterSpacing: '.6px', borderBottom: '1px solid var(--line-3)', paddingBottom: 5, margin: '0 0 8px' };
const body = { font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink)' };
const td = { padding: '6px 9px', border: '1px solid var(--line)', font: '12px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink)' };
const th = { ...td, background: 'var(--pri-soft)', color: 'var(--pri-ink)', fontWeight: 700, textAlign: 'left' };

export default function ReportBody({ c, principles, sections, companyName, summaryText }) {
  const on = k => !sections || sections[k] !== false;
  const { hasGap, kpiGapText } = gapInfo(c.problem);
  const M = decisionMatrix(c);
  const bars = trackingBars(c);

  const metaParts = [(companyName || '').trim(), (c.name || '').trim()].filter(Boolean);
  const metaLine = metaParts.length ? metaParts.join(' · ') + ' · ' : '';
  const reportDate = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  const dims = [
    { label: 'Yer / Birim', value: c.problem.geo },
    { label: 'Dönem', value: c.problem.time },
    { label: 'Segment / Kırılım', value: c.problem.brand }
  ].filter(d => (d.value || '').trim());

  const drivers = (c.drivers || []).filter(d => (d.name || '').trim());
  const da = (c.driverAnalysis || []).filter(d => (d.driver || '').trim() || (d.component || '').trim());
  const findings = (c.findings || []).filter(f => (f.text || '').trim());
  const whys = (c.whys || []).map((w, i) => ({ n: (i + 1) + '.', text: w || '' })).filter(w => w.text.trim());
  const rootCauses = (c.rootCauses || []).filter(r => (r.text || '').trim());
  const alts = (c.alternatives || []).filter(a => (a.name || '').trim());
  const actions = (c.actions || []).filter(a => (a.text || '').trim());
  const refs = c.references || [];
  const thk = c.thinking || {};
  const thinkingRows = PRE_DECISION_QUESTIONS.filter(q => (thk[q.key] || '').trim());
  const scanItems = (c.biasScan && c.biasScan.status === 'done' && (c.biasScan.items || [])) || [];
  const trackRows = (c.tracking || []).filter(t => (t.label || '').trim() || (t.value || '').trim());
  const retro = c.retro || {};
  const RETRO_ROWS = [
    { key: 'valid', label: 'Kök neden tespiti doğru muydu?' },
    { key: 'worked', label: 'Karşı önlemler işe yaradı mı?' },
    { key: 'process', label: 'Karar sonrası refleksiyon (süreç mi, sonuç mu?)' },
    { key: 'lessons', label: 'Öğrendiklerimiz / standarda bağlananlar' }
  ].filter(r => (retro[r.key] || '').trim());

  const hasScores = M.rows.some(r => r.cells.some(cell => String(cell.value).trim() !== ''));
  const summary = (summaryText || (c.report && c.report.status === 'done' && c.report.text) || '').trim();

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '34px 40px' }}>
      <div style={{ borderBottom: '2px solid var(--pri)', paddingBottom: 14, margin: '0 0 20px' }}>
        <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '1.2px', margin: '0 0 6px' }}>PROBLEM ÇÖZME ÇALIŞMA RAPORU</div>
        <div style={{ font: '700 21px/1.3 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{(c.problem.kpiName || '').trim() || 'Problem Çözme Çalışması'}</div>
        <div style={{ font: '12px Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 5 }}>{metaLine}{reportDate}</div>
      </div>

      {summary ? (
        <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '14px 16px', margin: '0 0 20px' }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px', margin: '0 0 6px' }}>YÖNETİCİ ÖZETİ</div>
          <div style={{ font: '13px/1.65 Helvetica,Arial,sans-serif', color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{summary}</div>
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {on('tanim') ? (
          <div>
            <div style={secTitle}>1 · PROBLEM TANIMI</div>
            <div style={{ font: '13.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{(c.problem.statement || '').trim() || '—'}</div>
            {dims.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 8 }}>
                {dims.map(d => <div key={d.label} style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}><strong>{d.label}:</strong> {d.value}</div>)}
              </div>
            ) : null}
            {hasGap ? (
              <div style={{ marginTop: 10, display: 'inline-block', background: 'var(--alert-soft)', border: '1px solid var(--alert-border)', borderRadius: 6, padding: '6px 11px', font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--alert)' }}>
                {(c.problem.kpiName || 'KPI') + ': hedef ' + (c.problem.target || '—') + ' / gerçekleşen ' + (c.problem.actual || '—')} · {kpiGapText}
              </div>
            ) : null}
          </div>
        ) : null}

        {drivers.length && on('driver') ? (
          <div>
            <div style={secTitle}>2 · DRIVER HARİTASI</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {drivers.map((d, i) => (
                <div key={i} style={body}><strong>{d.name}</strong>{(d.note || '').trim() ? <span style={{ color: 'var(--ink-4)' }}> — {d.note}</span> : null}</div>
              ))}
            </div>
          </div>
        ) : null}

        {da.length && on('analiz') ? (
          <div>
            <div style={secTitle}>3 · DRIVER ANALİZİ</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {da.map((d, i) => (
                <div key={i} style={body}>
                  <strong>{(d.driver ? d.driver + ' → ' : '') + (d.component || '')}</strong>
                  {(d.issue || '').trim() ? <span style={{ color: 'var(--ink-4)' }}> — {d.issue}</span> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {findings.length && on('bulgu') ? (
          <div>
            <div style={secTitle}>4 · DOĞRULANMIŞ BULGULAR</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {findings.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <div style={{ flex: 'none', background: 'var(--pri)', color: 'var(--on-pri)', borderRadius: 4, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 6px', marginTop: 2 }}>B{i + 1}</div>
                  <div style={body}>{f.text}{(f.evidence || '').trim() ? <span style={{ color: 'var(--muted)' }}> (Kanıt: {f.evidence})</span> : null}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {whys.length && on('kok') ? (
          <div>
            <div style={secTitle}>5 · KÖK NEDEN ANALİZİ (5 NEDEN)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {whys.map((w, i) => <div key={i} style={body}><strong style={{ color: 'var(--pri-soft-ink)' }}>{w.n}</strong> {w.text}</div>)}
            </div>
          </div>
        ) : null}

        {rootCauses.length && on('kok') ? (
          <div>
            <div style={secTitle}>KÖK NEDENLER VE GELİŞİM ALANLARI</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rootCauses.map((rc, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <div style={{ flex: 'none', background: 'var(--alert)', color: 'var(--on-pri)', borderRadius: 4, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 6px', marginTop: 2 }}>KN{i + 1}</div>
                  <div>
                    <div style={body}>{rc.text}</div>
                    {(rc.principles || []).length ? (
                      <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', marginTop: 3 }}>
                        Prensipler: {(rc.principles || []).map(pi => (pi + 1) + '. ' + ((principles || [])[pi] || '')).join(' · ')}
                      </div>
                    ) : null}
                    {(rc.competency || '').trim() ? (
                      <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 2 }}>Yetkinlik gelişim alanı: {rc.competency}</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {alts.length && on('karar') ? (
          <div>
            <div style={secTitle}>6 · ALTERNATİFLER VE KARAR</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 12px' }}>
              {alts.map((a, i) => (
                <div key={i} style={body}><strong>A{i + 1}</strong> · {a.name}{(a.method || '').trim() ? <span style={{ color: 'var(--muted)' }}> ({a.method})</span> : null}</div>
              ))}
            </div>

            {hasScores && (c.criteria || []).length ? (
              <div style={{ margin: '0 0 12px' }}>
                <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>KARAR MATRİSİ (0–5 · ağırlıklı toplam)</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={th}>Alternatif</th>
                        {M.head.map((h, i) => <th key={i} style={{ ...th, textAlign: 'center' }}>{h.name}<br /><span style={{ fontWeight: 400 }}>%{h.weight}</span></th>)}
                        <th style={{ ...th, textAlign: 'center' }}>Puan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {M.rows.map(r => {
                        const best = M.best && M.best.n === r.n;
                        return (
                          <tr key={r.n} style={best ? { background: 'var(--ok-soft)' } : null}>
                            <td style={td}><strong>A{r.n}</strong> · {r.name}</td>
                            {r.cells.map(cell => <td key={cell.key} style={{ ...td, textAlign: 'center' }}>{String(cell.value).trim() || '—'}</td>)}
                            <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: best ? 'var(--ok)' : 'var(--pri)' }}>{r.total}{best ? ' ★' : ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {(c.decision.choice || '').trim() ? (
              <div style={{ background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--ok)', letterSpacing: '.8px', margin: '0 0 6px' }}>KARAR</div>
                <div style={{ font: '600 13px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{c.decision.choice}</div>
                {(c.decision.rationale || '').trim() ? <div style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ok-ink)', marginTop: 6 }}>{c.decision.rationale}</div> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {actions.length && on('karar') ? (
          <div>
            <div style={secTitle}>AKSİYON PLANI</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {actions.map((a, i) => {
                const p = prioMeta(a);
                const meta = [a.owner, a.due, p.score > -100 ? p.label : ''].filter(Boolean).join(' · ');
                return (
                  <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <div style={{ flex: 'none', background: 'var(--pri)', color: 'var(--on-pri)', borderRadius: 4, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 6px', marginTop: 2 }}>{i + 1}</div>
                    <div style={body}>{a.text}{meta ? <span style={{ color: 'var(--muted)' }}> ({meta})</span> : null}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {(trackRows.length || RETRO_ROWS.length) && on('izleme') ? (
          <div>
            <div style={secTitle}>7 · İZLEME VE RETROSPEKTİF</div>

            {bars.length ? (
              <div style={{ margin: '0 0 10px' }}>
                <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>
                  KPI TRENDİ — {(c.problem.kpiName || 'KPI')}{(c.problem.target || '').trim() ? ' · hedef ' + c.problem.target : ''}
                </div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', border: '1px solid var(--line-2)', borderRadius: 8, background: 'var(--surface-2)', padding: '14px 14px 8px', overflowX: 'auto' }}>
                  {bars.map((tb, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 'none', minWidth: 52 }}>
                      <div style={{ font: '700 11.5px Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{tb.value}</div>
                      <div style={{ width: 30, height: tb.h, background: tb.bg, borderRadius: '5px 5px 2px 2px' }} />
                      <div style={{ font: '10px/1.3 Helvetica,Arial,sans-serif', color: 'var(--muted)', textAlign: 'center', maxWidth: 70 }}>{tb.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : trackRows.length ? (
              <div style={{ ...body, margin: '0 0 8px' }}>
                <strong>KPI ölçümleri:</strong> {trackRows.map(t => (t.label || '—') + ': ' + (t.value || '—')).join(' · ')}
                {(c.problem.target || '').trim() ? <span style={{ color: 'var(--muted)' }}> (hedef {c.problem.target})</span> : null}
              </div>
            ) : null}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {RETRO_ROWS.map(r => (
                <div key={r.key}>
                  <div style={{ font: '600 12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>{r.label}</div>
                  <div style={body}>{retro[r.key]}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {(thinkingRows.length || scanItems.length) && on('dusunme') ? (
          <div>
            <div style={secTitle}>DÜŞÜNME KONTROLÜ</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {thinkingRows.map(q => (
                <div key={q.key}>
                  <div style={{ font: '600 12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>{q.title}</div>
                  <div style={body}>{thk[q.key]}</div>
                </div>
              ))}
              {scanItems.length ? (
                <div style={{ marginTop: 2 }}>
                  <div style={{ font: '600 12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri)', margin: '0 0 3px' }}>Tespit edilen düşünme yanılgıları</div>
                  {scanItems.map((it, i) => (
                    <div key={i} style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>
                      <strong>{it.yanilgi}</strong>{it.yontem ? <span style={{ color: 'var(--muted)' }}> (panzehir: {it.yontem})</span> : null}
                      {it.soru ? <span style={{ color: 'var(--ink-3)' }}> — {it.soru}</span> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {refs.length && on('referans') ? (
          <div>
            <div style={secTitle}>REFERANSLAR</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {refs.map((r, i) => (
                <div key={r.id || i} style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>
                  <strong style={{ color: 'var(--pri-soft-ink)' }}>R{i + 1}</strong> · {r.title || 'Referans'}
                  {(r.url || '').trim() ? <span style={{ color: 'var(--muted)' }}> — {r.url}</span> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
