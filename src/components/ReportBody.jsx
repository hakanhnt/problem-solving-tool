// Yazdırılabilir rapor gövdesi. Store'a bağlı DEĞİLDİR: Adım 8 kendi verisini,
// paylaşım görünümü (SharedView) ise linkten çözülen veriyi geçirir.
// Dil bilgisi `lang` prop'u ile gelir (varsayılan 'tr').

import React from 'react';
import { prioMeta } from '../lib/store.jsx';
import { gapInfo, decisionMatrix, trackingBars, paretoData, traceability, confidenceScore, caseMaturity, rcStatusMeta, isOverdue } from '../lib/derive.js';
import { PRE_DECISION_QUESTIONS } from '../lib/thinking.js';
import { mkT, fmtNum } from '../lib/i18n.js';
import { fishboneCatsFor } from '../lib/defaults.js';
import { LogoMark, Wordmark } from '../ui/Logo.jsx';

const secTitle = { font: '700 12px Helvetica,Arial,sans-serif', color: 'var(--pri)', letterSpacing: '.6px', borderBottom: '1px solid var(--line-3)', paddingBottom: 5, margin: '0 0 8px' };
const body = { font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink)' };
const td = { padding: '6px 9px', border: '1px solid var(--line)', font: '12px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink)' };
const th = { ...td, background: 'var(--pri-soft)', color: 'var(--pri-ink)', fontWeight: 700, textAlign: 'left' };

// prioMeta store'dan dil bilgisiz gelir — görünen etiketi burada çeviririz.
const PRIO_LABELS_EN = {
  'Yüksek öncelik': 'High priority', 'Orta öncelik': 'Medium priority', 'Düşük öncelik': 'Low priority',
  'Puanlayın': 'Score it', 'Hızlı kazanım': 'Quick win', 'Stratejik': 'Strategic',
  'Ara kazanım': 'Modest win', 'Sorgulanmalı': 'Questionable'
};

// PRE_DECISION_QUESTIONS başlıklarının İngilizce karşılıkları (anahtara göre).
const PDQ_TITLES_EN = {
  assume: 'What am I assuming right now?',
  alt: 'What other explanation is possible?',
  cost: 'Who will pay the price of this decision, and when?'
};

export default function ReportBody({ c, principles, sections, companyName, summaryText, lang = 'tr' }) {
  const t = mkT(lang);
  const pct = v => (lang === 'en' ? v + '%' : '%' + v);
  const on = k => !sections || sections[k] !== false;
  const g = gapInfo(c.problem, lang);
  const { hasGap, kpiGapText } = g;
  const M = decisionMatrix(c, lang);
  const trace = traceability(c, lang);
  const conf = confidenceScore(c, lang);
  const maturity = caseMaturity(c, lang);
  const bars = trackingBars(c);
  const pareto = paretoData(c, lang);
  const spec = c.spec || {};
  const SPEC_LABELS = [['nerede', t('Nerede', 'Where')], ['zaman', t('Ne zaman', 'When')], ['kirilim', t('Kırılımda', 'In which breakdown')], ['buyukluk', t('Büyüklük', 'Magnitude')]];
  const specRows = SPEC_LABELS.filter(([k]) => ((spec[k] || {}).v || '').trim() || ((spec[k] || {}).y || '').trim());
  const cont = c.containment || {};

  const metaParts = [(companyName || '').trim(), (c.name || '').trim()].filter(Boolean);
  const metaLine = metaParts.length ? metaParts.join(' · ') + ' · ' : '';
  const reportDate = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  const dims = [
    { label: t('Yer / Birim', 'Location / Unit'), value: c.problem.geo },
    { label: t('Dönem', 'Period'), value: c.problem.time },
    { label: t('Segment / Kırılım', 'Segment / Breakdown'), value: c.problem.brand }
  ].filter(d => (d.value || '').trim());

  const drivers = (c.drivers || []).filter(d => (d.name || '').trim());
  const sipocRows = (c.sipoc || []).filter(r => [r.s, r.i, r.p, r.o, r.c].some(x => (x || '').trim()));
  const fb = c.fishbone || {};
  const FB_LABELS = fishboneCatsFor(lang).map(cat => [cat.key, cat.title]);
  const fbRows = FB_LABELS.filter(([k]) => (fb[k] || '').trim());
  const chains = (c.whyChains || []).filter(ch => (ch.whys || []).some(w => (w || '').trim()));
  const pmItems = (c.premortem && c.premortem.status === 'done' && (c.premortem.items || [])) || [];
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
    { key: 'valid', label: t('Kök neden tespiti doğru muydu?', 'Was the root cause identification correct?') },
    { key: 'worked', label: t('Karşı önlemler işe yaradı mı?', 'Did the countermeasures work?') },
    { key: 'process', label: t('Karar sonrası refleksiyon (süreç mi, sonuç mu?)', 'Post-decision reflection (process or outcome?)') },
    { key: 'lessons', label: t('Öğrendiklerimiz / standarda bağlananlar', 'Lessons learned / items standardized') }
  ].filter(r => (retro[r.key] || '').trim());

  const hasScores = M.rows.some(r => r.cells.some(cell => String(cell.value).trim() !== ''));
  const summary = (summaryText || (c.report && c.report.status === 'done' && c.report.text) || '').trim();

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '34px 40px' }}>
      <div style={{ borderBottom: '2px solid var(--pri)', paddingBottom: 14, margin: '0 0 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '1.2px', margin: '0 0 6px' }}>{t('PROBLEM ÇÖZME ÇALIŞMA RAPORU', 'PROBLEM-SOLVING CASE REPORT')}</div>
          <div style={{ font: '700 21px/1.3 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{(c.problem.kpiName || '').trim() || t('Problem Çözme Çalışması', 'Problem-Solving Case')}</div>
          <div style={{ font: '12px Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 5 }}>{metaLine}{reportDate}</div>
        </div>
        <div style={{ flex: 'none', display: 'flex', gap: 8, alignItems: 'center', paddingTop: 2 }}>
          <LogoMark size={30} />
          <Wordmark size={14} />
        </div>
      </div>

      {/* Tek sayfalık yönetici özeti — raporun en başında, tek bakışta durum */}
      <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '14px 16px', margin: '0 0 20px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 8px' }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px' }}>{t('YÖNETİCİ ÖZETİ', 'EXECUTIVE SUMMARY')}</div>
          <span style={{ font: '600 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)', background: 'var(--pri-soft)', border: '1px solid var(--pri-border-5)', borderRadius: 20, padding: '3px 9px' }}>{t('Durum: ', 'Status: ')}{maturity.label}</span>
          <span title={t('Çalışmanın bütünlüğünü ölçer; bilimsel doğruluk garantisi değildir.', 'Measures the integrity of the case; it is not a guarantee of scientific correctness.')} style={{ font: '600 10.5px Helvetica,Arial,sans-serif', color: conf.total >= 80 ? 'var(--ok-ink)' : conf.total >= 50 ? 'var(--pri-ink)' : 'var(--warn-ink)', background: conf.total >= 80 ? 'var(--ok-soft)' : conf.total >= 50 ? 'var(--pri-soft)' : 'var(--warn-soft)', border: '1px solid ' + (conf.total >= 80 ? 'var(--ok-border)' : conf.total >= 50 ? 'var(--pri-border-5)' : 'var(--warn-border)'), borderRadius: 20, padding: '3px 9px' }}>
            {t('Analiz güven seviyesi: ', 'Analysis confidence level: ')}{pct(conf.total)} · {conf.label}
          </span>
        </div>

        <table style={{ borderCollapse: 'collapse', width: '100%', margin: '0 0 8px' }}>
          <tbody>
            {[
              [t('Problem', 'Problem'), (c.problem.statement || '').trim() || '—'],
              [t('KPI durumu', 'KPI status'), hasGap ? (c.problem.kpiName || 'KPI') + t(': hedef ', ': target ') + (c.problem.target || '—') + t(' / gerçekleşen ', ' / actual ') + (c.problem.actual || '—') + ' · ' + kpiGapText : t('Ölçülmüş KPI farkı girilmemiş', 'No measured KPI gap entered')],
              [t('Ana kök neden(ler)', 'Main root cause(s)'), rootCauses.length
                ? rootCauses.map((rc, i) => t('KN', 'RC') + (i + 1) + ' (' + rcStatusMeta(rc.status, lang).label.toLowerCase() + ')').join(' · ')
                : t('Kök neden yazılmamış', 'No root cause written')],
              [t('Karar', 'Decision'), (c.decision.choice || '').trim() || t('Karar yazılmamış', 'No decision written')],
              [t('Aksiyonlar', 'Actions'), actions.length
                ? actions.length + t(' aksiyon · ', ' actions · ') + actions.filter(a => a.status === 'tamam').length + t(' tamam · ', ' done · ') + actions.filter(a => isOverdue(a)).length + t(' gecikmiş', ' overdue')
                : t('Aksiyon planlanmamış', 'No actions planned')],
              [t('Sonuç', 'Outcome'), trackRows.length ? t('Son ölçüm: ', 'Latest measurement: ') + (trackRows[trackRows.length - 1].value || '—') + ' (' + (trackRows[trackRows.length - 1].label || t('son dönem', 'latest period')) + ')' : t('Henüz KPI ölçümü girilmemiş', 'No KPI measurements entered yet')]
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
          if (hypo.length) warn.push(hypo.length + t(' kök neden hâlâ hipotez (veriyle doğrulanmadı)', ' root cause(s) still a hypothesis (not verified with data)'));
          const lateN = actions.filter(a => isOverdue(a)).length;
          if (lateN) warn.push(lateN + t(' aksiyonun termini geçti', ' action(s) past their due date'));
          const openN = actions.filter(a => a.status !== 'tamam').length;
          if (openN) warn.push(openN + t(' aksiyon henüz tamamlanmadı', ' action(s) not yet completed'));
          if (pareto && pareto.mode === 'kpi' && pareto.overflow > 0) warn.push(t('Bulgu katkıları KPI sapmasını aşıyor — veri tutarsızlığı', 'Finding contributions exceed the KPI gap — data inconsistency'));
          else if (pareto && pareto.mode === 'kpi' && pareto.unexplainedPct >= 30) warn.push(t('KPI sapmasında bulgularla açıklanmayan pay ', 'Share of the KPI gap unexplained by findings: ') + pct(pareto.unexplainedPct));
          if (trace.issues.length) warn.push(trace.issues.length + t(' izlenebilirlik boşluğu var', ' traceability gap(s)'));
          if (!warn.length) return null;
          return (
            <div style={{ background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 6, padding: '9px 12px', font: '12px/1.6 Helvetica,Arial,sans-serif', color: 'var(--warn-ink-3)' }}>
              <strong>{t('Bu raporu okurken dikkat:', 'Note while reading this report:')}</strong> {warn.join(' · ')}.
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
            <div style={secTitle}>{t('1 · PROBLEM TANIMI', '1 · PROBLEM DEFINITION')}</div>
            <div style={{ font: '13.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{(c.problem.statement || '').trim() || '—'}</div>
            {dims.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 8 }}>
                {dims.map(d => <div key={d.label} style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}><strong>{d.label}:</strong> {d.value}</div>)}
              </div>
            ) : null}
            {hasGap ? (
              <div style={{ marginTop: 10, display: 'inline-block', background: 'var(--alert-soft)', border: '1px solid var(--alert-border)', borderRadius: 6, padding: '6px 11px', font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--alert)' }}>
                {(c.problem.kpiName || 'KPI') + t(': hedef ', ': target ') + (c.problem.target || '—') + t(' / gerçekleşen ', ' / actual ') + (c.problem.actual || '—')} · {kpiGapText}
              </div>
            ) : null}

            {specRows.length ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>{t('VAR / YOK BELİRTİMİ', 'IS / IS-NOT SPECIFICATION')}</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead><tr><th style={th}> </th><th style={th}>{t('VAR', 'IS')}</th><th style={th}>{t('YOK', 'IS-NOT')}</th></tr></thead>
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
                  <div style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink)', marginTop: 6 }}><strong>{t('Değişiklik analizi:', 'Change analysis:')}</strong> {spec.degisiklik}</div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {drivers.length && on('driver') ? (
          <div>
            <div style={secTitle}>{t('2 · İŞ SÜRÜCÜSÜ HARİTASI', '2 · BUSINESS DRIVER MAP')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {drivers.map((d, i) => (
                <div key={i} style={body}><strong>{d.name}</strong>{(d.note || '').trim() ? <span style={{ color: 'var(--ink-4)' }}> — {d.note}</span> : null}</div>
              ))}
            </div>
          </div>
        ) : null}

        {da.length && on('analiz') ? (
          <div>
            <div style={secTitle}>{t('3 · İŞ SÜRÜCÜSÜ ANALİZİ', '3 · BUSINESS DRIVER ANALYSIS')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {da.map((d, i) => (
                <div key={i} style={body}>
                  <strong>{(d.driver ? d.driver + ' → ' : '') + (d.component || '')}</strong>
                  {(d.issue || '').trim() ? <span style={{ color: 'var(--ink-4)' }}> — {d.issue}</span> : null}
                </div>
              ))}
            </div>
            {sipocRows.length ? (
              <div style={{ marginTop: 10 }}>
                <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>{t('SIPOC (TEDARİKÇİ → GİRDİ → SÜREÇ → ÇIKTI → MÜŞTERİ)', 'SIPOC (SUPPLIER → INPUT → PROCESS → OUTPUT → CUSTOMER)')}</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead><tr>{[t('Tedarikçi', 'Supplier'), t('Girdi', 'Input'), t('Süreç', 'Process'), t('Çıktı', 'Output'), t('Müşteri', 'Customer')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {sipocRows.map((r, i) => (
                        <tr key={i}>{['s', 'i', 'p', 'o', 'c'].map(k => <td key={k} style={td}>{(r[k] || '').trim() || '—'}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {findings.length && on('bulgu') ? (
          <div>
            <div style={secTitle}>{t('4 · DOĞRULANMIŞ BULGULAR', '4 · VERIFIED FINDINGS')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {findings.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <div style={{ flex: 'none', background: 'var(--pri)', color: 'var(--on-pri)', borderRadius: 4, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 6px', marginTop: 2 }}>{t('B', 'F')}{i + 1}</div>
                  <div style={body}>{f.text}{(f.evidence || '').trim() ? <span style={{ color: 'var(--muted)' }}> ({t('Kanıt: ', 'Evidence: ')}{f.evidence})</span> : null}</div>
                </div>
              ))}
            </div>
            {pareto ? (
              <div style={{ marginTop: 8, font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>
                <strong>Pareto:</strong>{' '}
                {pareto.mode === 'kpi' ? (
                  <>{t('KPI sapması ', 'KPI gap ')}{fmtNum(lang, pareto.gap)}{pareto.unit ? ' ' + pareto.unit : ''}{t('; bulgularla açıklanan ', '; explained by findings ')}{fmtNum(lang, pareto.explained)}{pareto.unit ? ' ' + pareto.unit : ''} ({pct(pareto.explainedPct)})
                    {pareto.unexplained > 0 ? <>{t(', açıklanamayan ', ', unexplained ')}{fmtNum(lang, pareto.unexplained)}{pareto.unit ? ' ' + pareto.unit : ''} ({pct(pareto.unexplainedPct)})</> : null}.
                    {' '}{t('Öncelikli bulgular: ', 'Vital few findings: ')}{pareto.vital.join(' + ')} ({pareto.bars.map(b => b.label + ' ' + pct(b.pctOfGap)).join(' · ')}{t(' — sapmaya oranla', ' — relative to the gap')}).
                    {pareto.overflow > 0 ? <span style={{ color: 'var(--alert)' }}> ⚠ {t('Katkı toplamı KPI sapmasını ', 'Total contributions exceed the KPI gap by ')}{fmtNum(lang, pareto.overflow)}{pareto.unit ? ' ' + pareto.unit : ''}{t(' aşıyor; veriler gözden geçirilmeli.', '; the data should be reviewed.')}</span> : null}
                  </>
                ) : (
                  <>{t('KPI sapması girilmediği için yalnızca bulguların iç dağılımı: ', 'No KPI gap entered, so only the internal distribution of findings: ')}{pareto.vital.join(' + ')}{t(' → kümülatif pay ', ' → cumulative share ')}{pct(pareto.vitalPct)} ({pareto.bars.map(b => b.label + ' ' + pct(b.pctInternal)).join(' · ')}).</>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {(whys.length || chains.length || fbRows.length) && on('kok') ? (
          <div>
            <div style={secTitle}>{t('5 · KÖK NEDEN ANALİZİ (5 NEDEN)', '5 · ROOT CAUSE ANALYSIS (5 WHYS)')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {whys.map((w, i) => <div key={i} style={body}><strong style={{ color: 'var(--pri-soft-ink)' }}>{w.n}</strong> {w.text}</div>)}
            </div>
            {chains.map((ch, ci) => (
              <div key={ci} style={{ marginTop: 8, paddingLeft: 10, borderLeft: '3px solid var(--pri-border)' }}>
                <div style={{ font: '600 12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', margin: '0 0 3px' }}>{(ch.label || '').trim() || t('Alternatif neden dalı ', 'Alternative cause branch ') + (ci + 1)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {(ch.whys || []).map((w, i) => (w || '').trim() ? <div key={i} style={body}><strong style={{ color: 'var(--pri-soft-ink)' }}>{i + 1}.</strong> {w}</div> : null)}
                </div>
              </div>
            ))}
            {fbRows.length ? (
              <div style={{ marginTop: 10 }}>
                <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>{t('BALIK KILÇIĞI (ISHIKAWA) KATEGORİLERİ', 'FISHBONE (ISHIKAWA) CATEGORIES')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {fbRows.map(([k, label]) => (
                    <div key={k} style={body}><strong style={{ color: 'var(--pri-soft-ink)' }}>{label}:</strong> {fb[k]}</div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {rootCauses.length && on('kok') ? (
          <div>
            <div style={secTitle}>{t('KÖK NEDENLER VE GELİŞİM ALANLARI', 'ROOT CAUSES AND DEVELOPMENT AREAS')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rootCauses.map((rc, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <div style={{ flex: 'none', background: 'var(--alert)', color: 'var(--on-pri)', borderRadius: 4, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 6px', marginTop: 2 }}>{t('KN', 'RC')}{i + 1}</div>
                  <div>
                    <div style={body}>
                      {rc.text}
                      {(() => {
                        const st = rcStatusMeta(rc.status, lang);
                        const unverified = !['dogrulandi', 'test-edildi', 'destekleniyor'].includes(rc.status || 'hipotez');
                        return (
                          <span style={{
                            marginLeft: 6, display: 'inline-block', borderRadius: 20, padding: '1px 8px',
                            font: '700 10px Helvetica,Arial,sans-serif',
                            background: unverified ? 'var(--warn-soft)' : 'var(--ok-soft)',
                            border: '1px solid ' + (unverified ? 'var(--warn-border)' : 'var(--ok-border)'),
                            color: unverified ? 'var(--warn-ink)' : 'var(--ok-ink)'
                          }}>{unverified ? st.label.toUpperCase() + t(' — DOĞRULANMADI', ' — NOT VERIFIED') : st.label.toUpperCase()}</span>
                        );
                      })()}
                    </div>
                    {(rc.findings || []).length ? (
                      <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', marginTop: 3 }}>
                        {t('Açıkladığı bulgular: ', 'Explains findings: ')}{(rc.findings || []).map(fi => t('B', 'F') + (fi + 1)).join(', ')}
                      </div>
                    ) : null}
                    {(rc.evidence || '').trim() ? (
                      <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', marginTop: 2 }}>{t('Kanıt: ', 'Evidence: ')}{rc.evidence}</div>
                    ) : null}
                    {(rc.testResult || '').trim() ? (
                      <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ok-ink)', marginTop: 2 }}>{t('Test sonucu: ', 'Test result: ')}{rc.testResult}</div>
                    ) : (rc.testPlan || '').trim() ? (
                      <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 2 }}>{t('Planlanan test: ', 'Planned test: ')}{rc.testPlan}</div>
                    ) : null}
                    {(rc.explainsSpec || '').trim() ? (
                      <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', marginTop: 2 }}>{t('VAR/YOK desenini açıklıyor mu: ', 'Explains the IS / IS-NOT pattern: ')}{rc.explainsSpec}</div>
                    ) : null}
                    {(rc.kpiExpected || '').trim() ? (
                      <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', marginTop: 2 }}>{t('Giderilirse beklenen etki: ', 'Expected impact if resolved: ')}{rc.kpiExpected}</div>
                    ) : null}
                    {(rc.principles || []).length ? (
                      <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', marginTop: 3 }}>
                        {t('Prensipler: ', 'Principles: ')}{(rc.principles || []).map(pi => (pi + 1) + '. ' + ((principles || [])[pi] || '')).join(' · ')}
                      </div>
                    ) : null}
                    {(rc.competency || '').trim() ? (
                      <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 2 }}>{t('Yetkinlik gelişim alanı: ', 'Competency development area: ')}{rc.competency}</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {alts.length && on('karar') ? (
          <div>
            <div style={secTitle}>{t('6 · ALTERNATİFLER VE KARAR', '6 · ALTERNATIVES AND DECISION')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 12px' }}>
              {alts.map((a, i) => (
                <div key={i} style={body}><strong>A{i + 1}</strong> · {a.name}{(a.method || '').trim() ? <span style={{ color: 'var(--muted)' }}> ({a.method})</span> : null}{(a.note || '').trim() ? <span style={{ color: 'var(--ink-4)' }}> — {a.note}</span> : null}</div>
              ))}
            </div>

            {hasScores && (c.criteria || []).length ? (
              <div style={{ margin: '0 0 12px' }}>
                <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>{t('KARAR MATRİSİ (1–5 · ağırlıklı toplam)', 'DECISION MATRIX (1–5 · weighted total)')}</div>
                {!M.valid ? (
                  <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--alert)', background: 'var(--alert-soft)', border: '1px solid var(--alert-border)', borderRadius: 6, padding: '7px 10px', margin: '0 0 6px' }}>
                    ⚠ {t('Kriter ağırlıkları toplamı ', 'Criterion weights sum to ')}{pct(fmtNum(lang, M.wsum))} ({M.wDelta > 0 ? fmtNum(lang, M.wDelta) + t(' eksik', ' missing') : fmtNum(lang, -M.wDelta) + t(' fazla', ' extra')}){t(' — aşağıdaki puanlar taslaktır, karara dayanak sayılmamalıdır.', ' — the scores below are drafts and must not be used to justify the decision.')}
                  </div>
                ) : null}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={th}>{t('Alternatif', 'Alternative')}</th>
                        {M.head.map((h, i) => <th key={i} style={{ ...th, textAlign: 'center' }}>{h.name}<br /><span style={{ fontWeight: 400 }}>{pct(h.weight)} · {h.yon === 'dusuk' ? t('düşük iyi', 'lower is better') : t('yüksek iyi', 'higher is better')}</span></th>)}
                        <th style={{ ...th, textAlign: 'center' }}>{t('Puan', 'Score')}</th>
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
                    {t('A' + M.best.n + ' ile A' + M.second.n + ' arasındaki fark ' + fmtNum(lang, M.lead) + ' puan', 'Gap between A' + M.best.n + ' and A' + M.second.n + ': ' + fmtNum(lang, M.lead) + ' points')}
                    {M.influential ? <>{t(' · sonucu en çok belirleyen kriter: ', ' · most decisive criterion: ')}<strong>{M.influential.name}</strong></> : null}
                    {M.sensitivity.length ? <span style={{ color: 'var(--warn-ink)' }}>{t(' · hassasiyet: ', ' · sensitivity: ')}{M.sensitivity.map(s => t('"' + s.name + '" çıkarılırsa kazanan ' + s.newWinner, 'if "' + s.name + '" is removed, the winner becomes ' + s.newWinner)).join('; ')}</span> : null}
                  </div>
                ) : null}
                {(c.criteria || []).some(cr => (cr.source || '').trim()) ? (
                  <div style={{ font: '11.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 4 }}>
                    {t('Puanlama kaynağı: ', 'Scoring source: ')}{(c.criteria || []).filter(cr => (cr.source || '').trim()).map(cr => (cr.name || t('Kriter', 'Criterion')) + ' — ' + cr.source).join(' · ')}
                  </div>
                ) : null}
              </div>
            ) : null}

            {(cont.action || '').trim() ? (
              <div style={{ margin: '0 0 10px', font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>
                <strong style={{ color: cont.removed ? 'var(--ok-ink)' : 'var(--warn-ink)' }}>{t('Geçici önlem', 'Containment')}{cont.removed ? t(' (kaldırıldı)', ' (removed)') : t(' (devrede)', ' (active)')}:</strong> {cont.action}
                {(cont.owner || '').trim() ? <span style={{ color: 'var(--muted)' }}> — {cont.owner}</span> : null}
                {(cont.until || '').trim() ? <span style={{ color: 'var(--muted)' }}> · {t('Kaldırma koşulu: ', 'Removal condition: ')}{cont.until}</span> : null}
              </div>
            ) : null}
            {(c.decision.choice || '').trim() ? (
              <div style={{ background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--ok)', letterSpacing: '.8px', margin: '0 0 6px' }}>{t('KARAR', 'DECISION')}</div>
                <div style={{ font: '600 13px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{c.decision.choice}</div>
                {(c.decision.rationale || '').trim() ? <div style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ok-ink)', marginTop: 6 }}>{c.decision.rationale}</div> : null}
              </div>
            ) : null}

            {pmItems.length ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>{t('PRE-MORTEM — ÖNGÖRÜLEN BAŞARISIZLIK SENARYOLARI', 'PRE-MORTEM — ANTICIPATED FAILURE SCENARIOS')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {pmItems.map((it, i) => (
                    <div key={i} style={body}>
                      <strong>{it.baslik}</strong>{(it.hikaye || '').trim() ? <span style={{ color: 'var(--ink-4)' }}> — {it.hikaye}</span> : null}
                      {(it.sinyal || '').trim() ? <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)' }}>{t('Erken sinyal: ', 'Early signal: ')}{it.sinyal}</div> : null}
                      {(it.onlem || '').trim() ? <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ok-ink)' }}>{t('Önleyici tedbir: ', 'Preventive measure: ')}{it.onlem}{it.added ? t(' (aksiyon planına eklendi)', ' (added to the action plan)') : ''}</div> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {actions.length && on('karar') ? (
          <div>
            <div style={secTitle}>{t('AKSİYON PLANI', 'ACTION PLAN')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {actions.map((a, i) => {
                const p = prioMeta(a);
                const late = isOverdue(a);
                const STATUS_TR = { tamam: t('tamamlandı', 'completed'), devam: t('devam ediyor', 'in progress'), bekliyor: t('bekliyor', 'waiting'), gecikti: t('gecikti', 'delayed') };
                const meta = [
                  a.owner,
                  (a.startDate || '').trim() ? t('başlangıç ', 'start ') + a.startDate : '',
                  (a.dueDate || '').trim() ? t('termin ', 'due ') + a.dueDate : (a.due || ''),
                  STATUS_TR[a.status] || '',
                  p.score > -100 ? t(p.label, PRIO_LABELS_EN[p.label] || p.label) : ''
                ].filter(Boolean).join(' · ');
                return (
                  <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <div style={{ flex: 'none', background: late ? 'var(--alert)' : 'var(--pri)', color: 'var(--on-pri)', borderRadius: 4, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 6px', marginTop: 2 }}>{i + 1}</div>
                    <div style={body}>
                      {a.text}{meta ? <span style={{ color: 'var(--muted)' }}> ({meta})</span> : null}
                      {late ? <span style={{ color: 'var(--alert)', fontWeight: 700 }}> ⏰ {t('TERMİN GEÇTİ', 'PAST DUE')}{(a.delayReason || '').trim() ? ' — ' + a.delayReason : ''}</span> : null}
                      {a.status !== 'tamam' && !late ? <span style={{ color: 'var(--warn-ink)' }}>{t(' — tamamlanmadı', ' — not completed')}</span> : null}
                      {(a.successCriteria || '').trim() ? <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{t('Başarı ölçütü: ', 'Success criterion: ')}{a.successCriteria}{(a.evidence || '').trim() ? t(' · Kanıt: ', ' · Evidence: ') + a.evidence : ''}</div> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {(trackRows.length || RETRO_ROWS.length) && on('izleme') ? (
          <div>
            <div style={secTitle}>{t('7 · İZLEME VE RETROSPEKTİF', '7 · TRACKING AND RETROSPECTIVE')}</div>

            {bars.length ? (
              <div style={{ margin: '0 0 10px' }}>
                <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>
                  {t('KPI TRENDİ — ', 'KPI TREND — ')}{(c.problem.kpiName || 'KPI')}{(c.problem.target || '').trim() ? t(' · hedef ', ' · target ') + c.problem.target : ''}
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
                <strong>{t('KPI ölçümleri:', 'KPI measurements:')}</strong> {trackRows.map(t2 => (t2.label || '—') + ': ' + (t2.value || '—')).join(' · ')}
                {(c.problem.target || '').trim() ? <span style={{ color: 'var(--muted)' }}> ({t('hedef ', 'target ')}{c.problem.target})</span> : null}
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
            <div style={secTitle}>{t('DÜŞÜNME KONTROLÜ', 'THINKING CHECK')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {thinkingRows.map(q => (
                <div key={q.key}>
                  <div style={{ font: '600 12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>{t(q.title, PDQ_TITLES_EN[q.key] || q.title)}</div>
                  <div style={body}>{thk[q.key]}</div>
                </div>
              ))}
              {scanItems.length ? (
                <div style={{ marginTop: 2 }}>
                  <div style={{ font: '600 12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri)', margin: '0 0 3px' }}>{t('Tespit edilen düşünme yanılgıları', 'Detected thinking biases')}</div>
                  {scanItems.map((it, i) => (
                    <div key={i} style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>
                      <strong>{it.yanilgi}</strong>{it.yontem ? <span style={{ color: 'var(--muted)' }}> ({t('panzehir: ', 'antidote: ')}{it.yontem})</span> : null}
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
            <div style={secTitle}>{t('İZLENEBİLİRLİK — BULGU → KÖK NEDEN → AKSİYON → KPI', 'TRACEABILITY — FINDING → ROOT CAUSE → ACTION → KPI')}</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={th}>{t('Bulgu', 'Finding')}</th><th style={th}>{t('Kök neden', 'Root cause')}</th><th style={th}>{t('Aksiyon', 'Action')}</th><th style={{ ...th, textAlign: 'center' }}>{t('KPI izleniyor', 'KPI tracked')}</th>
                  </tr>
                </thead>
                <tbody>
                  {trace.rows.map(r => (
                    <tr key={r.finding}>
                      <td style={td}><strong>{r.finding}</strong> · {(r.findingText || '').slice(0, 70)}{(r.findingText || '').length > 70 ? '…' : ''}</td>
                      <td style={{ ...td, color: r.rcs.length ? 'var(--ink)' : 'var(--alert)' }}>{r.rcs.length ? r.rcs.join(', ') : t('bağlanmamış', 'not linked')}</td>
                      <td style={{ ...td, color: r.actions.length ? 'var(--ink)' : 'var(--warn-ink)' }}>{r.actions.length ? r.actions.map(t2 => (t2 || '').slice(0, 48)).join(' · ') : t('aksiyon yok', 'no action')}</td>
                      <td style={{ ...td, textAlign: 'center' }}>{r.kpiTracked ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {trace.issues.length ? (
              <div style={{ marginTop: 8, background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 6, padding: '9px 12px' }}>
                <div style={{ font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', letterSpacing: '.4px', margin: '0 0 4px' }}>{t('TUTARLILIK BOŞLUKLARI', 'CONSISTENCY GAPS')} ({trace.issues.length})</div>
                <ul style={{ margin: 0, paddingLeft: 18, font: '12px/1.6 Helvetica,Arial,sans-serif', color: 'var(--warn-ink-3)' }}>
                  {trace.issues.map((is, i) => <li key={i}>{is.text}</li>)}
                </ul>
              </div>
            ) : (
              <div style={{ marginTop: 8, font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ok-ink)' }}>{t('✓ Zincirde kopukluk bulunmadı: her bulgu bir kök nedene, her kök neden bir aksiyona bağlı ve sonuç KPI ile izleniyor.', '✓ No breaks in the chain: every finding is linked to a root cause, every root cause to an action, and the outcome is tracked with the KPI.')}</div>
            )}
            <div style={{ marginTop: 10 }}>
              <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 5px' }}>{t('ANALİZ GÜVEN SEVİYESİ — ', 'ANALYSIS CONFIDENCE LEVEL — ')}{pct(conf.total)} ({conf.label})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {conf.checks.map((ch, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', font: '11.5px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>
                    <span style={{ flex: 'none', width: 210 }}>{ch.label}</span>
                    <span style={{ flex: 1, maxWidth: 200, height: 7, background: 'var(--surface-4)', borderRadius: 4, overflow: 'hidden' }}>
                      <span style={{ display: 'block', width: ch.pct + '%', height: '100%', background: ch.pct >= 80 ? 'var(--ok)' : ch.pct >= 50 ? 'var(--pri-bar)' : 'var(--warn-border)' }} />
                    </span>
                    <span style={{ flex: 'none', width: 40, textAlign: 'right' }}>{pct(ch.pct)}</span>
                  </div>
                ))}
              </div>
              <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 5 }}>
                {t('Bu gösterge çalışmanın ', 'This indicator measures the ')}<strong>{t('bütünlüğünü', 'integrity')}</strong>{t(' ölçer (kanıt, test, bağlantı, doğrulama) — analizin bilimsel doğruluğunu garanti etmez.', ' of the case (evidence, tests, links, verification) — it does not guarantee the scientific correctness of the analysis.')}
              </div>
            </div>
          </div>
        ) : null}

        {refs.length && on('referans') ? (
          <div>
            <div style={secTitle}>{t('REFERANSLAR', 'REFERENCES')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {refs.map((r, i) => (
                <div key={r.id || i} style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>
                  <strong style={{ color: 'var(--pri-soft-ink)' }}>R{i + 1}</strong> · {r.title || t('Referans', 'Reference')}
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
