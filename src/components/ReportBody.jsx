// Yazdırılabilir rapor gövdesi. Store'a bağlı DEĞİLDİR: Adım 8 kendi verisini,
// paylaşım görünümü (SharedView) ise linkten çözülen veriyi geçirir.

import React from 'react';
import { prioMeta } from '../lib/store.jsx';
import { gapInfo, decisionMatrix, trackingBars, paretoData, traceability, confidenceScore, caseMaturity, rcStatusMeta, isOverdue } from '../lib/derive.js';
import { PRE_DECISION_QUESTIONS } from '../lib/thinking.js';

const secTitle = { font: '700 12px Helvetica,Arial,sans-serif', color: 'var(--pri)', letterSpacing: '.6px', borderBottom: '1px solid var(--line-3)', paddingBottom: 5, margin: '0 0 8px' };
const body = { font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink)' };
const td = { padding: '6px 9px', border: '1px solid var(--line)', font: '12px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink)' };
const th = { ...td, background: 'var(--pri-soft)', color: 'var(--pri-ink)', fontWeight: 700, textAlign: 'left' };

export default function ReportBody({ c, principles, sections, companyName, summaryText }) {
  const on = k => !sections || sections[k] !== false;
  const g = gapInfo(c.problem);
  const { hasGap, kpiGapText } = g;
  const M = decisionMatrix(c);
  const trace = traceability(c);
  const conf = confidenceScore(c);
  const maturity = caseMaturity(c);
  const bars = trackingBars(c);
  const pareto = paretoData(c);
  const spec = c.spec || {};
  const SPEC_LABELS = [['nerede', 'Nerede'], ['zaman', 'Ne zaman'], ['kirilim', 'Kırılımda'], ['buyukluk', 'Büyüklük']];
  const specRows = SPEC_LABELS.filter(([k]) => ((spec[k] || {}).v || '').trim() || ((spec[k] || {}).y || '').trim());
  const cont = c.containment || {};

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

      {/* Tek sayfalık yönetici özeti — raporun en başında, tek bakışta durum */}
      <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '14px 16px', margin: '0 0 20px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 8px' }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px' }}>YÖNETİCİ ÖZETİ</div>
          <span style={{ font: '600 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)', background: 'var(--pri-soft)', border: '1px solid var(--pri-border-5)', borderRadius: 20, padding: '3px 9px' }}>Durum: {maturity.label}</span>
          <span title="Çalışmanın bütünlüğünü ölçer; bilimsel doğruluk garantisi değildir." style={{ font: '600 10.5px Helvetica,Arial,sans-serif', color: conf.total >= 80 ? 'var(--ok-ink)' : conf.total >= 50 ? 'var(--pri-ink)' : 'var(--warn-ink)', background: conf.total >= 80 ? 'var(--ok-soft)' : conf.total >= 50 ? 'var(--pri-soft)' : 'var(--warn-soft)', border: '1px solid ' + (conf.total >= 80 ? 'var(--ok-border)' : conf.total >= 50 ? 'var(--pri-border-5)' : 'var(--warn-border)'), borderRadius: 20, padding: '3px 9px' }}>
            Analiz güven seviyesi: %{conf.total} · {conf.label}
          </span>
        </div>

        <table style={{ borderCollapse: 'collapse', width: '100%', margin: '0 0 8px' }}>
          <tbody>
            {[
              ['Problem', (c.problem.statement || '').trim() || '—'],
              ['KPI durumu', hasGap ? (c.problem.kpiName || 'KPI') + ': hedef ' + (c.problem.target || '—') + ' / gerçekleşen ' + (c.problem.actual || '—') + ' · ' + kpiGapText : 'Ölçülmüş KPI farkı girilmemiş'],
              ['Ana kök neden(ler)', rootCauses.length
                ? rootCauses.map((rc, i) => 'KN' + (i + 1) + ' (' + rcStatusMeta(rc.status).label.toLowerCase() + ')').join(' · ')
                : 'Kök neden yazılmamış'],
              ['Karar', (c.decision.choice || '').trim() || 'Karar yazılmamış'],
              ['Aksiyonlar', actions.length
                ? actions.length + ' aksiyon · ' + actions.filter(a => a.status === 'tamam').length + ' tamam · ' + actions.filter(a => isOverdue(a)).length + ' gecikmiş'
                : 'Aksiyon planlanmamış'],
              ['Sonuç', trackRows.length ? 'Son ölçüm: ' + (trackRows[trackRows.length - 1].value || '—') + ' (' + (trackRows[trackRows.length - 1].label || 'son dönem') + ')' : 'Henüz KPI ölçümü girilmemiş']
            ].map(([k, v]) => (
              <tr key={k}>
                <td style={{ ...td, border: 'none', padding: '3px 8px 3px 0', width: 148, verticalAlign: 'top', fontWeight: 700, color: 'var(--pri-soft-ink)' }}>{k}</td>
                <td style={{ ...td, border: 'none', padding: '3px 0' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {(() => {
          const warn = [];
          const hypo = rootCauses.filter(rc => !['dogrulandi', 'test-edildi', 'destekleniyor'].includes(rc.status || 'hipotez'));
          if (hypo.length) warn.push(hypo.length + ' kök neden hâlâ hipotez (veriyle doğrulanmadı)');
          const lateN = actions.filter(a => isOverdue(a)).length;
          if (lateN) warn.push(lateN + ' aksiyonun termini geçti');
          const openN = actions.filter(a => a.status !== 'tamam').length;
          if (openN) warn.push(openN + ' aksiyon henüz tamamlanmadı');
          if (pareto && pareto.mode === 'kpi' && pareto.overflow > 0) warn.push('Bulgu katkıları KPI sapmasını aşıyor — veri tutarsızlığı');
          else if (pareto && pareto.mode === 'kpi' && pareto.unexplainedPct >= 30) warn.push('KPI sapmasında bulgularla açıklanmayan pay %' + pareto.unexplainedPct);
          if (trace.issues.length) warn.push(trace.issues.length + ' izlenebilirlik boşluğu var');
          if (!warn.length) return null;
          return (
            <div style={{ background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 6, padding: '9px 12px', font: '12px/1.6 Helvetica,Arial,sans-serif', color: 'var(--warn-ink-3)' }}>
              <strong>Bu raporu okurken dikkat:</strong> {warn.join(' · ')}.
            </div>
          );
        })()}

        {summary ? (
          <div style={{ font: '13px/1.65 Helvetica,Arial,sans-serif', color: 'var(--ink)', whiteSpace: 'pre-wrap', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--pri-border-4)' }}>{summary}</div>
        ) : null}
      </div>

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

            {specRows.length ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>VAR / YOK BELİRTİMİ</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead><tr><th style={th}> </th><th style={th}>VAR</th><th style={th}>YOK</th></tr></thead>
                    <tbody>
                      {specRows.map(([k, label]) => (
                        <tr key={k}>
                          <td style={{ ...td, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</td>
                          <td style={td}>{(spec[k] || {}).v || '—'}</td>
                          <td style={td}>{(spec[k] || {}).y || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(spec.degisiklik || '').trim() ? (
                  <div style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink)', marginTop: 6 }}><strong>Değişiklik analizi:</strong> {spec.degisiklik}</div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {drivers.length && on('driver') ? (
          <div>
            <div style={secTitle}>2 · İŞ SÜRÜCÜSÜ HARİTASI</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {drivers.map((d, i) => (
                <div key={i} style={body}><strong>{d.name}</strong>{(d.note || '').trim() ? <span style={{ color: 'var(--ink-4)' }}> — {d.note}</span> : null}</div>
              ))}
            </div>
          </div>
        ) : null}

        {da.length && on('analiz') ? (
          <div>
            <div style={secTitle}>3 · İŞ SÜRÜCÜSÜ ANALİZİ</div>
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
            {pareto ? (
              <div style={{ marginTop: 8, font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>
                <strong>Pareto:</strong>{' '}
                {pareto.mode === 'kpi' ? (
                  <>KPI sapması {String(pareto.gap).replace('.', ',')}{pareto.unit ? ' ' + pareto.unit : ''}; bulgularla açıklanan {String(pareto.explained).replace('.', ',')}{pareto.unit ? ' ' + pareto.unit : ''} (%{pareto.explainedPct})
                    {pareto.unexplained > 0 ? <>, açıklanamayan {String(pareto.unexplained).replace('.', ',')}{pareto.unit ? ' ' + pareto.unit : ''} (%{pareto.unexplainedPct})</> : null}.
                    {' '}Öncelikli bulgular: {pareto.vital.join(' + ')} ({pareto.bars.map(b => b.label + ' %' + b.pctOfGap).join(' · ')} — sapmaya oranla).
                    {pareto.overflow > 0 ? <span style={{ color: 'var(--alert)' }}> ⚠ Katkı toplamı KPI sapmasını {String(pareto.overflow).replace('.', ',')}{pareto.unit ? ' ' + pareto.unit : ''} aşıyor; veriler gözden geçirilmeli.</span> : null}
                  </>
                ) : (
                  <>KPI sapması girilmediği için yalnızca bulguların iç dağılımı: {pareto.vital.join(' + ')} → kümülatif pay %{pareto.vitalPct} ({pareto.bars.map(b => b.label + ' %' + b.pctInternal).join(' · ')}).</>
                )}
              </div>
            ) : null}
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
                    <div style={body}>
                      {rc.text}
                      {(() => {
                        const st = rcStatusMeta(rc.status);
                        const unverified = !['dogrulandi', 'test-edildi', 'destekleniyor'].includes(rc.status || 'hipotez');
                        return (
                          <span style={{
                            marginLeft: 6, display: 'inline-block', borderRadius: 20, padding: '1px 8px',
                            font: '700 10px Helvetica,Arial,sans-serif',
                            background: unverified ? 'var(--warn-soft)' : 'var(--ok-soft)',
                            border: '1px solid ' + (unverified ? 'var(--warn-border)' : 'var(--ok-border)'),
                            color: unverified ? 'var(--warn-ink)' : 'var(--ok-ink)'
                          }}>{unverified ? st.label.toUpperCase() + ' — DOĞRULANMADI' : st.label.toUpperCase()}</span>
                        );
                      })()}
                    </div>
                    {(rc.findings || []).length ? (
                      <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', marginTop: 3 }}>
                        Açıkladığı bulgular: {(rc.findings || []).map(fi => 'B' + (fi + 1)).join(', ')}
                      </div>
                    ) : null}
                    {(rc.evidence || '').trim() ? (
                      <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', marginTop: 2 }}>Kanıt: {rc.evidence}</div>
                    ) : null}
                    {(rc.testResult || '').trim() ? (
                      <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ok-ink)', marginTop: 2 }}>Test sonucu: {rc.testResult}</div>
                    ) : (rc.testPlan || '').trim() ? (
                      <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 2 }}>Planlanan test: {rc.testPlan}</div>
                    ) : null}
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
                <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>KARAR MATRİSİ (1–5 · ağırlıklı toplam)</div>
                {!M.valid ? (
                  <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--alert)', background: 'var(--alert-soft)', border: '1px solid var(--alert-border)', borderRadius: 6, padding: '7px 10px', margin: '0 0 6px' }}>
                    ⚠ Kriter ağırlıkları toplamı %{String(M.wsum).replace('.', ',')} ({M.wDelta > 0 ? String(M.wDelta).replace('.', ',') + ' eksik' : String(-M.wDelta).replace('.', ',') + ' fazla'}) — aşağıdaki puanlar taslaktır, karara dayanak sayılmamalıdır.
                  </div>
                ) : null}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={th}>Alternatif</th>
                        {M.head.map((h, i) => <th key={i} style={{ ...th, textAlign: 'center' }}>{h.name}<br /><span style={{ fontWeight: 400 }}>%{h.weight} · {h.yon === 'dusuk' ? 'düşük iyi' : 'yüksek iyi'}</span></th>)}
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
                {M.valid && M.best && M.second ? (
                  <div style={{ font: '11.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', marginTop: 5 }}>
                    A{M.best.n} ile A{M.second.n} arasındaki fark {String(M.lead).replace('.', ',')} puan
                    {M.influential ? <> · sonucu en çok belirleyen kriter: <strong>{M.influential.name}</strong></> : null}
                    {M.sensitivity.length ? <span style={{ color: 'var(--warn-ink)' }}> · hassasiyet: {M.sensitivity.map(s => '"' + s.name + '" çıkarılırsa kazanan ' + s.newWinner).join('; ')}</span> : null}
                  </div>
                ) : null}
                {(c.criteria || []).some(cr => (cr.source || '').trim()) ? (
                  <div style={{ font: '11.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 4 }}>
                    Puanlama kaynağı: {(c.criteria || []).filter(cr => (cr.source || '').trim()).map(cr => (cr.name || 'Kriter') + ' — ' + cr.source).join(' · ')}
                  </div>
                ) : null}
              </div>
            ) : null}

            {(cont.action || '').trim() ? (
              <div style={{ margin: '0 0 10px', font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>
                <strong style={{ color: cont.removed ? 'var(--ok-ink)' : 'var(--warn-ink)' }}>Geçici önlem{cont.removed ? ' (kaldırıldı)' : ' (devrede)'}:</strong> {cont.action}
                {(cont.owner || '').trim() ? <span style={{ color: 'var(--muted)' }}> — {cont.owner}</span> : null}
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
                const late = isOverdue(a);
                const STATUS_TR = { tamam: 'tamamlandı', devam: 'devam ediyor', bekliyor: 'bekliyor', gecikti: 'gecikti' };
                const meta = [
                  a.owner,
                  (a.dueDate || '').trim() ? 'termin ' + a.dueDate : (a.due || ''),
                  STATUS_TR[a.status] || '',
                  p.score > -100 ? p.label : ''
                ].filter(Boolean).join(' · ');
                return (
                  <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <div style={{ flex: 'none', background: late ? 'var(--alert)' : 'var(--pri)', color: 'var(--on-pri)', borderRadius: 4, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 6px', marginTop: 2 }}>{i + 1}</div>
                    <div style={body}>
                      {a.text}{meta ? <span style={{ color: 'var(--muted)' }}> ({meta})</span> : null}
                      {late ? <span style={{ color: 'var(--alert)', fontWeight: 700 }}> ⏰ TERMİN GEÇTİ{(a.delayReason || '').trim() ? ' — ' + a.delayReason : ''}</span> : null}
                      {a.status !== 'tamam' && !late ? <span style={{ color: 'var(--warn-ink)' }}> — tamamlanmadı</span> : null}
                      {(a.successCriteria || '').trim() ? <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>Başarı ölçütü: {a.successCriteria}{(a.evidence || '').trim() ? ' · Kanıt: ' + a.evidence : ''}</div> : null}
                    </div>
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

        {trace.rows.length ? (
          <div>
            <div style={secTitle}>İZLENEBİLİRLİK — BULGU → KÖK NEDEN → AKSİYON → KPI</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={th}>Bulgu</th><th style={th}>Kök neden</th><th style={th}>Aksiyon</th><th style={{ ...th, textAlign: 'center' }}>KPI izleniyor</th>
                  </tr>
                </thead>
                <tbody>
                  {trace.rows.map(r => (
                    <tr key={r.finding}>
                      <td style={td}><strong>{r.finding}</strong> · {(r.findingText || '').slice(0, 70)}{(r.findingText || '').length > 70 ? '…' : ''}</td>
                      <td style={{ ...td, color: r.rcs.length ? 'var(--ink)' : 'var(--alert)' }}>{r.rcs.length ? r.rcs.join(', ') : 'bağlanmamış'}</td>
                      <td style={{ ...td, color: r.actions.length ? 'var(--ink)' : 'var(--warn-ink)' }}>{r.actions.length ? r.actions.map(t => (t || '').slice(0, 48)).join(' · ') : 'aksiyon yok'}</td>
                      <td style={{ ...td, textAlign: 'center' }}>{r.kpiTracked ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {trace.issues.length ? (
              <div style={{ marginTop: 8, background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 6, padding: '9px 12px' }}>
                <div style={{ font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', letterSpacing: '.4px', margin: '0 0 4px' }}>TUTARLILIK BOŞLUKLARI ({trace.issues.length})</div>
                <ul style={{ margin: 0, paddingLeft: 18, font: '12px/1.6 Helvetica,Arial,sans-serif', color: 'var(--warn-ink-3)' }}>
                  {trace.issues.map((is, i) => <li key={i}>{is.text}</li>)}
                </ul>
              </div>
            ) : (
              <div style={{ marginTop: 8, font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ok-ink)' }}>✓ Zincirde kopukluk bulunmadı: her bulgu bir kök nedene, her kök neden bir aksiyona bağlı ve sonuç KPI ile izleniyor.</div>
            )}
            <div style={{ marginTop: 10 }}>
              <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 5px' }}>ANALİZ GÜVEN SEVİYESİ — %{conf.total} ({conf.label})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {conf.checks.map((ch, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', font: '11.5px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>
                    <span style={{ flex: 'none', width: 210 }}>{ch.label}</span>
                    <span style={{ flex: 1, maxWidth: 200, height: 7, background: 'var(--surface-4)', borderRadius: 4, overflow: 'hidden' }}>
                      <span style={{ display: 'block', width: ch.pct + '%', height: '100%', background: ch.pct >= 80 ? 'var(--ok)' : ch.pct >= 50 ? 'var(--pri-bar)' : 'var(--warn-border)' }} />
                    </span>
                    <span style={{ flex: 'none', width: 40, textAlign: 'right' }}>%{ch.pct}</span>
                  </div>
                ))}
              </div>
              <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 5 }}>
                Bu gösterge çalışmanın <strong>bütünlüğünü</strong> ölçer (kanıt, test, bağlantı, doğrulama) — analizin bilimsel doğruluğunu garanti etmez.
              </div>
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
