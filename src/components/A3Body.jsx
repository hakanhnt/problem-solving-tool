// A3 tek sayfa raporu — Toyota A3 düzeni: solda Plan (arka plan, mevcut durum,
// hedef, kök neden), sağda Do/Check/Act (karşı önlem, uygulama planı, doğrulama,
// öğrenme). Store'a bağlı DEĞİLDİR; Adım 8 ve paylaşım görünümü kendi verisini geçirir.
// Yazdırmada A3 yatay sayfa hedeflenir (@page kuralını görünüm sahibi enjekte eder).

import React from 'react';
import { gapInfo, decisionMatrix, trackingBars, trackingGapText, paretoData, traceability, confidenceScore, caseMaturity, rcStatusMeta, isOverdue } from '../lib/derive.js';
import { mkT, fmtNum } from '../lib/i18n.js';
import { LogoMark, Wordmark } from '../ui/Logo.jsx';

const cut = (s, n) => { const v = (s || '').trim(); return v.length > n ? v.slice(0, n - 1) + '…' : v; };

function Box({ no, title, children, tone }) {
  return (
    <div style={{
      border: '1px solid var(--line)', borderRadius: 6, background: 'var(--surface)',
      padding: '8px 10px', breakInside: 'avoid', pageBreakInside: 'avoid',
      display: 'flex', flexDirection: 'column', gap: 5
    }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', borderBottom: '1px solid var(--line-3)', paddingBottom: 4 }}>
        <span style={{ flex: 'none', font: '700 10px/1 Helvetica,Arial,sans-serif', color: 'var(--on-pri)', background: tone || 'var(--pri)', borderRadius: 4, padding: '3px 6px' }}>{no}</span>
        <span style={{ font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)', letterSpacing: '.4px' }}>{title}</span>
      </div>
      <div style={{ font: '10.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink)', display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  );
}

const chip = (ink, bg, border) => ({ display: 'inline-block', font: '700 9px Helvetica,Arial,sans-serif', color: ink, background: bg, border: '1px solid ' + border, borderRadius: 10, padding: '1px 6px', verticalAlign: 'middle' });
const muted = { color: 'var(--muted)' };

export default function A3Body({ c, companyName, lang = 'tr' }) {
  const t = mkT(lang);
  const pct = v => (lang === 'en' ? v + '%' : '%' + v);
  const g = gapInfo(c.problem, lang);
  const M = decisionMatrix(c, lang);
  const bars = trackingBars(c);
  const pareto = paretoData(c, lang);
  const trace = traceability(c, lang);
  const conf = confidenceScore(c, lang);
  const maturity = caseMaturity(c, lang);
  const cont = c.containment || {};
  const spec = c.spec || {};

  const findings = (c.findings || []).filter(f => (f.text || '').trim());
  const whys = (c.whys || []).filter(w => (w || '').trim());
  const rootCauses = (c.rootCauses || []).filter(r => (r.text || '').trim());
  const actions = (c.actions || []).filter(a => (a.text || '').trim());
  const retro = c.retro || {};
  const reportDate = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const dims = [c.problem.geo, c.problem.time, c.problem.brand].filter(x => (x || '').trim()).join(' · ');
  const specLine = ['nerede', 'zaman', 'kirilim'].map(k => (spec[k] || {}).v).filter(x => (x || '').trim()).join(' · ');

  const STATUS_TR = { tamam: '✓', devam: '→', bekliyor: '…', gecikti: '⏰' };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '18px 22px' }}>
      {/* Başlık şeridi */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', borderBottom: '2px solid var(--pri)', paddingBottom: 8, margin: '0 0 10px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ font: '700 9.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '1.2px' }}>{t('A3 PROBLEM ÇÖZME RAPORU', 'A3 PROBLEM SOLVING REPORT')}</div>
          <div style={{ font: '700 16px/1.25 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{(c.problem.kpiName || '').trim() || (c.name || t('Problem Çözme Çalışması', 'Problem Solving Case'))}</div>
        </div>
        <div style={{ flex: 'none', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={chip('var(--pri-ink)', 'var(--pri-soft)', 'var(--pri-border-5)')}>{t('Durum: ', 'Status: ')}{maturity.label}</span>
          <span style={chip(conf.total >= 80 ? 'var(--ok-ink)' : conf.total >= 50 ? 'var(--pri-ink)' : 'var(--warn-ink)', conf.total >= 80 ? 'var(--ok-soft)' : conf.total >= 50 ? 'var(--pri-soft)' : 'var(--warn-soft)', conf.total >= 80 ? 'var(--ok-border)' : conf.total >= 50 ? 'var(--pri-border-5)' : 'var(--warn-border)')}>{t('Güven: ', 'Confidence: ')}{pct(conf.total)}</span>
          <span style={{ font: '10px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{[(companyName || '').trim(), (c.name || '').trim(), reportDate].filter(Boolean).join(' · ')}</span>
          <LogoMark size={24} />
          <Wordmark size={11.5} />
        </div>
      </div>

      {/* İki sütunlu A3 gövdesi: sol Plan, sağ Do/Check/Act */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 10, alignItems: 'start' }}>
        {/* SOL — PLAN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Box no="1" title={t('ARKA PLAN & PROBLEM', 'BACKGROUND & PROBLEM')}>
            <div>{cut(c.problem.statement, 420) || '—'}</div>
            {dims ? <div style={muted}>{cut(dims, 160)}</div> : null}
          </Box>

          <Box no="2" title={t('MEVCUT DURUM (VERİYLE)', 'CURRENT STATE (WITH DATA)')}>
            {g.hasGap ? (
              <div>
                <strong>{c.problem.kpiName || 'KPI'}:</strong> {t('hedef', 'target')} {c.problem.target}{g.direction === 'aralik' && (c.problem.targetHigh || '').trim() ? '–' + c.problem.targetHigh : ''} / {t('gerçekleşen', 'actual')} {c.problem.actual} · <span style={{ color: g.good ? 'var(--ok-ink)' : 'var(--alert)', fontWeight: 700 }}>{g.kpiGapText}</span>
              </div>
            ) : <div style={muted}>{t('Ölçülmüş KPI farkı girilmemiş.', 'No measured KPI gap entered.')}</div>}
            {findings.slice(0, 5).map((f, i) => (
              <div key={i}><strong style={{ color: 'var(--pri-soft-ink)' }}>{t('B', 'F')}{i + 1}</strong> {cut(f.text, 150)}</div>
            ))}
            {findings.length > 5 ? <div style={muted}>{t('+' + (findings.length - 5) + ' bulgu daha (tam raporda)', '+' + (findings.length - 5) + ' more findings (in full report)')}</div> : null}
            {pareto && pareto.mode === 'kpi' ? (
              <div style={muted}>{t('Pareto: açıklanan ', 'Pareto: explained ')}{pct(pareto.explainedPct)}{pareto.unexplained > 0 ? t(' · açıklanamayan ', ' · unexplained ') + pct(pareto.unexplainedPct) : ''}{pareto.overflow > 0 ? t(' · ⚠ katkılar sapmayı aşıyor', ' · ⚠ contributions exceed the gap') : ''}</div>
            ) : null}
            {specLine ? <div style={muted}>{t('VAR: ', 'IS: ')}{cut(specLine, 140)}</div> : null}
          </Box>

          <Box no="3" title={t('HEDEF', 'TARGET')}>
            {g.hasGap ? (
              <div>
                {c.problem.kpiName || 'KPI'} → <strong>{c.problem.target}{g.direction === 'aralik' && (c.problem.targetHigh || '').trim() ? '–' + c.problem.targetHigh : ''}{(c.problem.unit || '').trim() ? ' ' + c.problem.unit : ''}</strong>
                {' '}({g.direction === 'dusuk' ? t('düşük iyi', 'lower is better') : g.direction === 'yuksek' ? t('yüksek iyi', 'higher is better') : t('aralıkta kalmalı', 'must stay in range')}) · {g.remainText}
              </div>
            ) : <div style={muted}>{t('Hedef tanımlanmamış.', 'No target defined.')}</div>}
          </Box>

          <Box no="4" title={t('KÖK NEDEN ANALİZİ', 'ROOT CAUSE ANALYSIS')}>
            {whys.length ? (
              <div style={muted}>{t('5N: ', '5 Whys: ')}{whys.map((w, i) => (i + 1) + ') ' + cut(w, 60)).join(' ')}</div>
            ) : null}
            {rootCauses.map((rc, i) => {
              const st = rcStatusMeta(rc.status, lang);
              const ok = ['dogrulandi', 'test-edildi', 'destekleniyor'].includes(rc.status || 'hipotez');
              return (
                <div key={i}>
                  <strong style={{ color: 'var(--alert)' }}>{t('KN', 'RC')}{i + 1}</strong> {cut(rc.text, 150)}{' '}
                  <span style={chip(ok ? 'var(--ok-ink)' : 'var(--warn-ink)', ok ? 'var(--ok-soft)' : 'var(--warn-soft)', ok ? 'var(--ok-border)' : 'var(--warn-border)')}>{st.label.toUpperCase()}</span>
                  {(rc.findings || []).length ? <span style={muted}> ← {(rc.findings || []).map(fi => t('B', 'F') + (fi + 1)).join(',')}</span> : null}
                </div>
              );
            })}
            {!rootCauses.length ? <div style={muted}>{t('Kök neden yazılmamış.', 'No root cause written.')}</div> : null}
          </Box>
        </div>

        {/* SAĞ — DO / CHECK / ACT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Box no="5" title={t('KARŞI ÖNLEMLER & KARAR', 'COUNTERMEASURES & DECISION')} tone="var(--ok)">
            {(cont.action || '').trim() ? (
              <div style={muted}>{t('Geçici önlem', 'Containment')}{cont.removed ? t(' (kaldırıldı)', ' (removed)') : t(' (devrede)', ' (active)')}: {cut(cont.action, 120)}</div>
            ) : null}
            {(c.decision.choice || '').trim() ? <div><strong>{t('Karar:', 'Decision:')}</strong> {cut(c.decision.choice, 300)}</div> : <div style={muted}>{t('Karar yazılmamış.', 'No decision written.')}</div>}
            {M.valid && M.best ? <div style={muted}>{t('Matris: ', 'Matrix: ')}A{M.best.n} ({M.best.total}){M.second ? t(' · fark ', ' · margin ') + fmtNum(lang, M.lead) : ''}{M.sensitivity.length ? t(' · ⚠ hassas', ' · ⚠ sensitive') : ''}</div> : null}
          </Box>

          <Box no="6" title={t('UYGULAMA PLANI', 'IMPLEMENTATION PLAN')} tone="var(--ok)">
            {actions.length ? (
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <tbody>
                  {actions.slice(0, 6).map((a, i) => {
                    const late = isOverdue(a);
                    return (
                      <tr key={i}>
                        <td style={{ padding: '2px 4px 2px 0', font: '10.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', borderBottom: '1px solid var(--line-4)' }}>{cut(a.text, 90)}</td>
                        <td style={{ padding: '2px 4px', font: '10px/1.4 Helvetica,Arial,sans-serif', color: 'var(--muted)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--line-4)' }}>{cut(a.owner, 20)}</td>
                        <td style={{ padding: '2px 0 2px 4px', font: '10px/1.4 Helvetica,Arial,sans-serif', color: late ? 'var(--alert)' : 'var(--ink-3)', whiteSpace: 'nowrap', textAlign: 'right', borderBottom: '1px solid var(--line-4)' }}>
                          {(a.dueDate || a.due || '').trim()} {late ? '⏰' : (STATUS_TR[a.status] || '')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : <div style={muted}>{t('Aksiyon planlanmamış.', 'No actions planned.')}</div>}
            {actions.length > 6 ? <div style={muted}>{t('+' + (actions.length - 6) + ' aksiyon daha (tam raporda)', '+' + (actions.length - 6) + ' more actions (in full report)')}</div> : null}
          </Box>

          <Box no="7" title={t('DOĞRULAMA — KPI İZLEME', 'VERIFICATION — KPI TRACKING')} tone="var(--ok)">
            {bars.length ? (
              <>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', padding: '4px 0 0' }}>
                  {bars.slice(-8).map((tb, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 'none', minWidth: 34 }}>
                      <div style={{ font: '700 9.5px Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{tb.value}</div>
                      <div style={{ width: 20, height: Math.max(6, Math.round(parseInt(tb.h, 10) * 0.45)) + 'px', background: tb.bg, borderRadius: '3px 3px 1px 1px' }} />
                      <div style={{ font: '8.5px/1.2 Helvetica,Arial,sans-serif', color: 'var(--muted)', textAlign: 'center', maxWidth: 48 }}>{cut(tb.label, 12)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ font: '10px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{trackingGapText(c, lang)}</div>
              </>
            ) : <div style={muted}>{t('Henüz KPI ölçümü girilmemiş — karşı önlem doğrulanmadı.', 'No KPI measurements entered yet — countermeasure not verified.')}</div>}
          </Box>

          <Box no="8" title={t('ÖĞRENME & STANDARTLAŞTIRMA', 'LEARNING & STANDARDIZATION')} tone="var(--ok)">
            {(retro.worked || '').trim() ? <div><strong>{t('İşe yaradı mı:', 'Did it work:')}</strong> {cut(retro.worked, 160)}</div> : null}
            {(retro.lessons || '').trim() ? <div><strong>{t('Öğrenmeler:', 'Lessons:')}</strong> {cut(retro.lessons, 220)}</div> : null}
            {!(retro.worked || '').trim() && !(retro.lessons || '').trim() ? <div style={muted}>{t('Retrospektif henüz yazılmamış.', 'No retrospective written yet.')}</div> : null}
          </Box>
        </div>
      </div>

      {/* Alt şerit */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--line-3)', marginTop: 10, paddingTop: 6, font: '9.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
        <span>{t('İzlenebilirlik: ', 'Traceability: ')}{trace.issues.length === 0 ? t('✓ kopukluk yok', '✓ no gaps') : t(trace.issues.length + ' boşluk (tam raporda listelenir)', trace.issues.length + ' gaps (listed in full report)')}</span>
        <span>·</span>
        <span>{t('Doğrulanmamış kök nedenler raporda hipotez olarak işaretlidir', 'Unverified root causes are marked as hypotheses in the report')}</span>
        <span style={{ marginLeft: 'auto' }}>{t('Bu A3 özeti tam çalışma raporunun sıkıştırılmış görünümüdür — ProblemLab ile hazırlandı', 'This A3 summary is a condensed view of the full case report — prepared with ProblemLab')}</span>
      </div>
    </div>
  );
}
