// Raporu GERÇEK Word belgesi (.docx / OOXML) olarak üretir — Word, Pages, Google Docs'ta yerel açılır.
// ReportBody bölümlerini birebir yansıtır; reportCfg.sections çiplerine uyar.
// KURAL: İÇ İÇE TABLO YOK — kutular paragraf gölgelemesi, çubuklar düz segmentli tablodur (Pages uyumu).
// buildReportDocx(c, opts) -> Promise<Blob (tarayıcı) | Buffer (node)>

import { gapInfo, decisionMatrix, trackingBars, paretoData, traceability, confidenceScore, caseMaturity, rcStatusMeta, isOverdue, driverMap, timingAdvice } from './derive.js';
import { preDecisionQuestionsFor } from './thinking.js';
import { mkT, fmtNum } from './i18n.js';
import { fishboneCatsFor } from './defaults.js';
import { prio, paretoSentence } from './reportDocUtil.js';
import { buildDocx, para, run, textPara, table, tr, tc, barChart, USABLE } from './ooxml.js';

// Renkler (RRGGBB) ve boyutlar (yarım-punto)
const PRI = '35506E', INK = '26241F', INK3 = '57534B', INK4 = '6D6860', MUTED = '65605A', SOFTINK = '4E6987', PRIINK = '2C4159';
const LINE3 = 'ECEAE5', PRISOFT = 'EEF2F7', PRISOFT2 = 'F2F6FB', PRIBAR = '8FB0D4', PRIB4 = 'D8E2EE';
const ALERT = '8C4A35', ALERTSOFT = 'F6E9E5', OK = '4A6741', OKINK = '3D5A3D', OKSOFT = 'EEF4EE', WARNINK = '805F2E', WARNSOFT = 'FAF3E3', GOLD = 'D9B25A';
const H1 = 32, KICK = 16, META = 18, H2 = 22, LBL = 18, BODY = 20, SM = 18, TD = 18;
const hasT = (v) => !!(v || '').toString().trim();

export function reportFileNameDocx(c, companyName) {
  const base = (companyName || '').trim() || ((c.problem || {}).kpiName || '').trim() || (c.name || '').trim() || 'rapor';
  return base.replace(/[\\/:*?"<>|]+/g, '').trim().replace(/\s+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 60) || 'rapor';
}

export function buildReportDocxBody(c, opts = {}) {
  const { principles = [], sections, companyName = '', lang = 'tr', summaryText } = opts;
  const t = mkT(lang);
  const pct = (v) => (lang === 'en' ? v + '%' : '%' + v);
  const on = (k) => !sections || sections[k] !== false;
  const p = c.problem || {};

  // Biçim yardımcıları
  const sec = (s) => para(run(s, { b: true, sz: H2, color: PRI }), { before: 240, after: 100, bottomBorder: { color: LINE3, sz: 6 }, keepNext: true });
  const lbl = (s) => para(run(s, { b: true, sz: LBL, color: INK3 }), { before: 120, after: 60, keepNext: true });
  const bod = (rx, o) => para(rx, Object.assign({ sz: BODY, after: 40 }, o || {}));
  const sm = (rx, o) => para(rx, Object.assign({ sz: SM, after: 30 }, o || {}));
  const R = (s, o) => run(s, Object.assign({ sz: BODY }, o || {}));
  const Rs = (s, o) => run(s, Object.assign({ sz: SM }, o || {}));
  const th = (s, w) => tc(para(run(s, { b: true, sz: TD, color: PRIINK }), { after: 0 }), w, { shd: PRISOFT });
  const cel = (rx, w, o) => tc(para(rx, { after: 0, align: (o || {}).align }), w, o || {});

  const g = gapInfo(p, lang), { hasGap, kpiGapText } = g;
  const M = decisionMatrix(c, lang), trace = traceability(c, lang), conf = confidenceScore(c, lang), maturity = caseMaturity(c, lang);
  const bars = trackingBars(c), pareto = paretoData(c, lang);
  const spec = c.spec || {}, cont = c.containment || {};
  const SPEC = [['nerede', t('Nerede', 'Where')], ['zaman', t('Ne zaman', 'When')], ['kirilim', t('Kırılımda', 'In which breakdown')], ['buyukluk', t('Büyüklük', 'Magnitude')]];
  const specRows = SPEC.filter(([k]) => hasT((spec[k] || {}).v) || hasT((spec[k] || {}).y));
  const dims = [[t('Yer / Birim', 'Location / Unit'), p.geo], [t('Dönem', 'Period'), p.time], [t('Segment / Kırılım', 'Segment / Breakdown'), p.brand]].filter((d) => hasT(d[1]));
  const drivers = (c.drivers || []).filter((d) => hasT(d.name));
  const da = (c.driverAnalysis || []).filter((d) => hasT(d.driver) || hasT(d.component));
  const sipocRows = (c.sipoc || []).filter((r) => [r.s, r.i, r.p, r.o, r.c].some(hasT));
  const findings = (c.findings || []).filter((f) => hasT(f.text));
  const fb = c.fishbone || {}, FB = fishboneCatsFor(lang).map((x) => [x.key, x.title]);
  const fbRows = FB.filter(([k]) => hasT(fb[k]));
  const chains = (c.whyChains || []).filter((ch) => (ch.whys || []).some(hasT));
  const whys = (c.whys || []).map((w, i) => ({ n: i + 1 + '.', text: w || '' })).filter((w) => hasT(w.text));
  const rootCauses = (c.rootCauses || []).filter((r) => hasT(r.text));
  const alts = (c.alternatives || []).filter((a) => hasT(a.name));
  const hasScores = M.rows.some((r) => r.cells.some((cl) => String(cl.value).trim() !== ''));
  const pmItems = (c.premortem && c.premortem.status === 'done' && (c.premortem.items || [])) || [];
  const simItems = (c.similarCases && c.similarCases.status === 'done' && (c.similarCases.items || [])) || [];
  const fmeaRows = (c.fmea || []).filter((r) => hasT(r.mode));
  const rpnOf = (r) => { const v = (parseInt(r.s, 10) || 0) * (parseInt(r.o, 10) || 0) * (parseInt(r.d, 10) || 0); return v > 0 ? v : null; };
  const ffD = ((c.forcefield || {}).driving || []).filter((x) => hasT(x.text));
  const ffR = ((c.forcefield || {}).restraining || []).filter((x) => hasT(x.text));
  const actions = (c.actions || []).filter((a) => hasT(a.text));
  const refs = c.references || [];
  const thk = c.thinking || {};
  const thinkingRows = preDecisionQuestionsFor(lang).filter((q) => hasT(thk[q.key]));
  const scanItems = (c.biasScan && c.biasScan.status === 'done' && (c.biasScan.items || [])) || [];
  const trackRows = (c.tracking || []).filter((x) => hasT(x.label) || hasT(x.value));
  const retro = c.retro || {};
  const RETRO = [['valid', t('Kök neden tespiti doğru muydu?', 'Was the root cause identification correct?')], ['worked', t('Karşı önlemler işe yaradı mı?', 'Did the countermeasures work?')], ['process', t('Karar sonrası refleksiyon (süreç mi, sonuç mu?)', 'Post-decision reflection (process or outcome?)')], ['lessons', t('Öğrendiklerimiz / standarda bağlananlar', 'Lessons learned / items standardized')]].filter((r) => hasT(retro[r[0]]));
  const summary = (summaryText || (c.report && c.report.status === 'done' && c.report.text) || '').trim();

  const out = [];

  // ---- Başlık ----
  const metaParts = [(companyName || '').trim(), (c.name || '').trim()].filter(Boolean);
  const metaLine = (metaParts.length ? metaParts.join(' · ') + ' · ' : '') + new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  out.push(para(run(t('PROBLEM ÇÖZME ÇALIŞMA RAPORU', 'PROBLEM-SOLVING CASE REPORT'), { b: true, sz: KICK, color: SOFTINK }), { after: 30 }));
  out.push(para(run(hasT(p.kpiName) ? p.kpiName.trim() : t('Problem Çözme Çalışması', 'Problem-Solving Case'), { b: true, sz: H1, color: INK }), { after: 30 }));
  out.push(para(run(metaLine, { sz: META, color: MUTED }), { after: 180, bottomBorder: { color: PRI, sz: 18 } }));

  // ---- Yönetici özeti ----
  out.push(para(run(t('YÖNETİCİ ÖZETİ', 'EXECUTIVE SUMMARY'), { b: true, sz: KICK, color: SOFTINK }), { shd: PRISOFT2, before: 60, after: 0 }));
  out.push(para(run(t('Durum: ', 'Status: ') + maturity.label + t(' · Analiz güven seviyesi: ', ' · Analysis confidence level: ') + pct(conf.total) + ' · ' + conf.label, { b: true, sz: SM, color: PRIINK }), { shd: PRISOFT2, after: 60 }));
  {
    const kpiVal = hasGap ? (p.kpiName || 'KPI') + t(': hedef ', ': target ') + (p.target || '—') + t(' / gerçekleşen ', ' / actual ') + (p.actual || '—') + ' · ' + kpiGapText : t('Ölçülmüş KPI farkı girilmemiş', 'No measured KPI gap entered');
    const rcLine = rootCauses.length ? rootCauses.map((rc, i) => t('KN', 'RC') + (i + 1) + ' (' + rcStatusMeta(rc.status, lang).label.toLowerCase() + ')').join(' · ') : t('Kök neden yazılmamış', 'No root cause written');
    const actLine = actions.length ? actions.length + t(' aksiyon · ', ' actions · ') + actions.filter((a) => a.status === 'tamam').length + t(' tamam · ', ' done · ') + actions.filter((a) => isOverdue(a)).length + t(' gecikmiş', ' overdue') : t('Aksiyon planlanmamış', 'No actions planned');
    const outLine = trackRows.length ? t('Son ölçüm: ', 'Latest measurement: ') + (trackRows[trackRows.length - 1].value || '—') + ' (' + (trackRows[trackRows.length - 1].label || t('son dönem', 'latest period')) + ')' : t('Henüz KPI ölçümü girilmemiş', 'No KPI measurements entered yet');
    const rows = [[t('Problem', 'Problem'), hasT(p.statement) ? p.statement.trim() : '—'], [t('KPI durumu', 'KPI status'), kpiVal], [t('Ana kök neden(ler)', 'Main root cause(s)'), rcLine], [t('Karar', 'Decision'), hasT(c.decision && c.decision.choice) ? c.decision.choice : t('Karar yazılmamış', 'No decision written')], [t('Aksiyonlar', 'Actions'), actLine], [t('Sonuç', 'Outcome'), outLine]];
    const lw = 2600, vw = USABLE - lw;
    out.push(table([lw, vw], rows.map(([k, v]) => tr(cel(run(k, { b: true, sz: TD, color: SOFTINK }), lw) + cel(run(v, { sz: TD }), vw))).join(''), { borders: false }));
    const warn = [];
    const hypo = rootCauses.filter((rc) => !['dogrulandi', 'test-edildi', 'destekleniyor'].includes(rc.status || 'hipotez'));
    if (hypo.length) warn.push(hypo.length + t(' kök neden hâlâ hipotez (veriyle doğrulanmadı)', ' root cause(s) still a hypothesis (not verified with data)'));
    const lateN = actions.filter((a) => isOverdue(a)).length; if (lateN) warn.push(lateN + t(' aksiyonun termini geçti', ' action(s) past their due date'));
    const openN = actions.filter((a) => a.status !== 'tamam').length; if (openN) warn.push(openN + t(' aksiyon henüz tamamlanmadı', ' action(s) not yet completed'));
    if (pareto && pareto.mode === 'kpi' && pareto.overflow > 0) warn.push(t('Bulgu katkıları KPI sapmasını aşıyor — veri tutarsızlığı', 'Finding contributions exceed the KPI gap — data inconsistency'));
    else if (pareto && pareto.mode === 'kpi' && pareto.unexplainedPct >= 30) warn.push(t('KPI sapmasında bulgularla açıklanmayan pay ', 'Share of the KPI gap unexplained by findings: ') + pct(pareto.unexplainedPct));
    if (trace.issues.length) warn.push(trace.issues.length + t(' izlenebilirlik boşluğu var', ' traceability gap(s)'));
    if (warn.length) out.push(para(run(t('Bu raporu okurken dikkat: ', 'Note while reading this report: '), { b: true, sz: SM, color: WARNINK }) + run(warn.join(' · ') + '.', { sz: SM, color: WARNINK }), { shd: WARNSOFT, before: 60, after: 40 }));
    if (summary) out.push(para(run(summary, { sz: BODY, color: INK }), { before: 40, after: 120 }));
  }

  // ---- 1 · Problem tanımı ----
  if (on('tanim')) {
    out.push(sec(t('1 · PROBLEM TANIMI', '1 · PROBLEM DEFINITION')));
    out.push(bod(run(hasT(p.statement) ? p.statement.trim() : '—', { sz: BODY })));
    dims.forEach((d) => out.push(sm(run(d[0] + ': ', { b: true, sz: SM, color: INK3 }) + run(d[1], { sz: SM, color: INK3 }))));
    if (hasGap) out.push(para(run((p.kpiName || 'KPI') + t(': hedef ', ': target ') + (p.target || '—') + t(' / gerçekleşen ', ' / actual ') + (p.actual || '—') + ' · ' + kpiGapText, { b: true, sz: SM, color: ALERT }), { shd: ALERTSOFT, before: 40, after: 40 }));
    if (specRows.length) {
      out.push(lbl(t('VAR / YOK BELİRTİMİ', 'IS / IS-NOT SPECIFICATION')));
      const c1 = Math.round(USABLE * 0.24), c2 = Math.round((USABLE - c1) / 2);
      let rowsX = tr(th(' ', c1) + th(t('VAR', 'IS'), c2) + th(t('YOK', 'IS-NOT'), USABLE - c1 - c2));
      specRows.forEach(([k, label]) => { rowsX += tr(cel(run(label, { b: true, sz: TD }), c1) + cel(run((spec[k] || {}).v || '—', { sz: TD }), c2) + cel(run((spec[k] || {}).y || '—', { sz: TD }), USABLE - c1 - c2)); });
      out.push(table([c1, c2, USABLE - c1 - c2], rowsX));
      if (hasT(spec.degisiklik)) out.push(bod(run(t('Değişiklik analizi: ', 'Change analysis: '), { b: true, sz: BODY }) + run(spec.degisiklik, { sz: BODY })));
    }
  }

  // ---- 2 · Sürücü haritası ----
  if (drivers.length && on('driver')) {
    out.push(sec(t('2 · İŞ SÜRÜCÜSÜ HARİTASI', '2 · BUSINESS DRIVER MAP')));
    const dm = driverMap(c);
    out.push(bod(run(hasT(p.kpiName) ? p.kpiName.trim() : 'KPI', { b: true, sz: BODY, color: SOFTINK }) + run(t(' şu iş sürücülerinden etkileniyor:', ' is driven by:'), { sz: BODY, color: SOFTINK })));
    drivers.forEach((d, i) => {
      let rx = run('D' + (i + 1) + ' · ' + d.name, { b: true, sz: BODY });
      if (dm[i] && dm[i].hasSub) rx += run(t(' — alt bileşenler: ', ' — subcomponents: ') + dm[i].sub, { sz: BODY, color: SOFTINK });
      if (hasT(d.note)) rx += run(' — ' + d.note, { sz: BODY, color: INK4 });
      out.push(bod(rx));
    });
  }

  // ---- 3 · Sürücü analizi + SIPOC ----
  if (da.length && on('analiz')) {
    out.push(sec(t('3 · İŞ SÜRÜCÜSÜ ANALİZİ', '3 · BUSINESS DRIVER ANALYSIS')));
    da.forEach((d) => { const head = (d.driver ? d.driver + ' → ' : '') + (d.component || ''); out.push(bod(run(head, { b: true, sz: BODY }) + (hasT(d.issue) ? run(' — ' + d.issue, { sz: BODY, color: INK4 }) : ''))); });
    if (sipocRows.length) {
      out.push(lbl(t('SIPOC (TEDARİKÇİ → GİRDİ → SÜREÇ → ÇIKTI → MÜŞTERİ)', 'SIPOC (SUPPLIER → INPUT → PROCESS → OUTPUT → CUSTOMER)')));
      const w = Math.round(USABLE / 5);
      const heads = [t('Tedarikçi', 'Supplier'), t('Girdi', 'Input'), t('Süreç', 'Process'), t('Çıktı', 'Output'), t('Müşteri', 'Customer')];
      let rowsX = tr(heads.map((h, i) => th(h, i === 4 ? USABLE - w * 4 : w)).join(''));
      sipocRows.forEach((r) => { rowsX += tr(['s', 'i', 'p', 'o', 'c'].map((k, i) => cel(run(hasT(r[k]) ? r[k] : '—', { sz: TD }), i === 4 ? USABLE - w * 4 : w)).join('')); });
      out.push(table([w, w, w, w, USABLE - w * 4], rowsX));
    }
  }

  // ---- 4 · Bulgular + Pareto ----
  if (findings.length && on('bulgu')) {
    out.push(sec(t('4 · DOĞRULANMIŞ BULGULAR', '4 · VERIFIED FINDINGS')));
    findings.forEach((f, i) => out.push(bod(run(t('B', 'F') + (i + 1) + ' · ', { b: true, sz: BODY, color: PRI }) + run(f.text, { sz: BODY }) + (hasT(f.evidence) ? run(' (' + t('Kanıt: ', 'Evidence: ') + f.evidence + ')', { sz: SM, color: MUTED }) : ''))));
    if (pareto) {
      out.push(lbl(t('PARETO — SAPMAYA KATKI DAĞILIMI', 'PARETO — CONTRIBUTION TO THE GAP')));
      out.push(barChart(pareto.bars.map((b) => {
        const sh = pareto.mode === 'kpi' ? b.pctOfGap : b.pctInternal, vital = pareto.vital.includes(b.label);
        return { label: run(b.label, { b: true, sz: SM, color: PRI }) + run(' ' + (b.text || '').slice(0, 40), { sz: SM, color: INK4 }), pct: sh, color: vital ? PRI : PRIBAR, value: run(fmtNum(lang, b.v) + (pareto.unit ? ' ' + pareto.unit : '') + ' · ' + pct(sh), { sz: SM }) };
      })));
      out.push(sm(run(t('Koyu çubuklar öncelikli (vital few) bulgulardır.', 'Dark bars are the vital-few findings.'), { sz: SM, color: MUTED })));
      out.push(bod(run('Pareto: ', { b: true, sz: SM, color: PRIINK }) + run(paretoSentence(pareto, lang, t, pct), { sz: SM, color: PRIINK })));
    }
  }

  // ---- 5 · Kök neden + fishbone ----
  if ((whys.length || chains.length || fbRows.length) && on('kok')) {
    out.push(sec(t('5 · KÖK NEDEN ANALİZİ (5 NEDEN)', '5 · ROOT CAUSE ANALYSIS (5 WHYS)')));
    whys.forEach((w) => out.push(bod(run(w.n + ' ', { b: true, sz: BODY, color: SOFTINK }) + run(w.text, { sz: BODY }))));
    chains.forEach((ch, ci) => {
      out.push(para(run(hasT(ch.label) ? ch.label : t('Alternatif neden dalı ', 'Alternative cause branch ') + (ci + 1), { b: true, sz: SM, color: SOFTINK }), { before: 60, after: 20, ind: 200 }));
      (ch.whys || []).forEach((w, i) => { if (hasT(w)) out.push(para(run((i + 1) + '. ', { b: true, sz: SM, color: SOFTINK }) + run(w, { sz: SM }), { after: 20, ind: 200 })); });
    });
    if (fbRows.length) {
      out.push(lbl(t('BALIK KILÇIĞI (ISHIKAWA) — KATEGORİLERE GÖRE NEDENLER', 'FISHBONE (ISHIKAWA) — CAUSES BY CATEGORY')));
      const c1 = Math.round(USABLE * 0.22);
      let rowsX = tr(th(t('Kategori', 'Category'), c1) + th(t('Nedenler', 'Causes'), USABLE - c1));
      FB.filter(([k]) => hasT(fb[k])).forEach(([k, title]) => { rowsX += tr(cel(run(title, { b: true, sz: TD }), c1) + cel(run(fb[k], { sz: TD }), USABLE - c1)); });
      out.push(table([c1, USABLE - c1], rowsX));
    }
  }

  // ---- Kök nedenler ve gelişim alanları ----
  if (rootCauses.length && on('kok')) {
    out.push(sec(t('KÖK NEDENLER VE GELİŞİM ALANLARI', 'ROOT CAUSES AND DEVELOPMENT AREAS')));
    rootCauses.forEach((rc, i) => {
      const st = rcStatusMeta(rc.status, lang), unv = !['dogrulandi', 'test-edildi', 'destekleniyor'].includes(rc.status || 'hipotez');
      out.push(bod(run(t('KN', 'RC') + (i + 1) + ' · ', { b: true, sz: BODY, color: ALERT }) + run(rc.text, { sz: BODY }) + run('  [' + (unv ? st.label.toUpperCase() + t(' — DOĞRULANMADI', ' — NOT VERIFIED') : st.label.toUpperCase()) + ']', { b: true, sz: 16, color: unv ? WARNINK : OKINK })));
      if ((rc.findings || []).length) out.push(sm(run(t('Açıkladığı bulgular: ', 'Explains findings: ') + (rc.findings || []).map((fi) => t('B', 'F') + (fi + 1)).join(', '), { sz: SM, color: INK3 })));
      if (hasT(rc.evidence)) out.push(sm(run(t('Kanıt: ', 'Evidence: ') + rc.evidence, { sz: SM, color: INK3 })));
      if (hasT(rc.testResult)) out.push(sm(run(t('Test sonucu: ', 'Test result: ') + rc.testResult, { sz: SM, color: OKINK })));
      else if (hasT(rc.testPlan)) out.push(sm(run(t('Planlanan test: ', 'Planned test: ') + rc.testPlan, { sz: SM, color: MUTED })));
      if (hasT(rc.kpiExpected)) out.push(sm(run(t('Giderilirse beklenen etki: ', 'Expected impact if resolved: ') + rc.kpiExpected, { sz: SM, color: INK3 })));
      if ((rc.principles || []).length) out.push(sm(run(t('Prensipler: ', 'Principles: ') + (rc.principles || []).map((pi) => pi + 1 + '. ' + ((principles || [])[pi] || '')).join(' · '), { sz: SM, color: SOFTINK })));
      if (hasT(rc.competency)) out.push(sm(run(t('Yetkinlik gelişim alanı: ', 'Competency development area: ') + rc.competency, { sz: SM, color: MUTED })));
    });
  }

  // ---- 6 · Alternatifler ve karar ----
  if (alts.length && on('karar')) {
    out.push(sec(t('6 · ALTERNATİFLER VE KARAR', '6 · ALTERNATIVES AND DECISION')));
    alts.forEach((a, i) => out.push(bod(run('A' + (i + 1) + ' · ', { b: true, sz: BODY }) + run(a.name, { sz: BODY }) + (hasT(a.method) ? run(' (' + a.method + ')', { sz: SM, color: MUTED }) : '') + (hasT(a.note) ? run(' — ' + a.note, { sz: SM, color: INK4 }) : ''))));

    if (hasScores && (c.criteria || []).length) {
      out.push(lbl(t('KARAR MATRİSİ (1–5 · ağırlıklı toplam)', 'DECISION MATRIX (1–5 · weighted total)')));
      if (!M.valid) out.push(para(run('⚠ ' + t('Kriter ağırlıkları toplamı ', 'Criterion weights sum to ') + pct(fmtNum(lang, M.wsum)) + t(' — puanlar taslaktır.', ' — the scores are drafts.'), { sz: SM, color: ALERT }), { shd: ALERTSOFT, after: 40 }));
      const nC = M.head.length, aw = Math.round(USABLE * 0.30), sw = Math.round(USABLE * 0.12), cw = Math.floor((USABLE - aw - sw) / Math.max(1, nC));
      const colW = [aw].concat(M.head.map(() => cw)).concat([USABLE - aw - cw * nC]);
      let rowsX = tr(th(t('Alternatif', 'Alternative'), aw) + M.head.map((h) => th(h.name + ' (' + pct(h.weight) + ')', cw)).join('') + th(t('Puan', 'Score'), USABLE - aw - cw * nC));
      M.rows.forEach((r) => {
        const best = M.best && M.best.n === r.n, sh = best ? OKSOFT : null;
        rowsX += tr(tc(para(run('A' + r.n + ' · ' + r.name, { b: true, sz: TD }), { after: 0 }), aw, { shd: sh })
          + r.cells.map((cl) => tc(para(run(String(cl.value).trim() || '—', { sz: TD }), { after: 0, align: 'center' }), cw, { shd: sh })).join('')
          + tc(para(run(r.total + (best ? ' ★' : ''), { b: true, sz: TD, color: best ? OK : PRI }), { after: 0, align: 'center' }), USABLE - aw - cw * nC, { shd: sh }));
      });
      out.push(table(colW, rowsX));
      if (M.valid && M.best && M.second) {
        let note = t('A' + M.best.n + ' ile A' + M.second.n + ' arasındaki fark ' + fmtNum(lang, M.lead) + ' puan', 'Gap between A' + M.best.n + ' and A' + M.second.n + ': ' + fmtNum(lang, M.lead) + ' points');
        if (M.influential) note += t(' · en belirleyici kriter: ', ' · most decisive criterion: ') + M.influential.name;
        out.push(sm(run(note, { sz: SM, color: INK3 })));
      }
    }

    if (hasT(cont.action)) out.push(bod(run(t('Geçici önlem', 'Containment') + (cont.removed ? t(' (kaldırıldı)', ' (removed)') : t(' (devrede)', ' (active)')) + ': ', { b: true, sz: SM, color: cont.removed ? OKINK : WARNINK }) + run(cont.action + (hasT(cont.owner) ? ' — ' + cont.owner : '') + (hasT(cont.until) ? ' · ' + t('kaldırma koşulu: ', 'removal condition: ') + cont.until : ''), { sz: SM })));
    if (hasT(c.decision && c.decision.choice)) {
      out.push(para(run(t('KARAR', 'DECISION'), { b: true, sz: KICK, color: OK }), { shd: OKSOFT, before: 60, after: 0 }));
      out.push(para(run(c.decision.choice, { b: true, sz: BODY }), { shd: OKSOFT, after: hasT(c.decision.rationale) ? 0 : 60 }));
      if (hasT(c.decision.rationale)) out.push(para(run(c.decision.rationale, { sz: SM, color: OKINK }), { shd: OKSOFT, after: 60 }));
    }
    // Karar ekleri (zamanlama, ikinci basamak, dış görünüm, red-team, pre-mortem, FMEA, kuvvet alanı)
    decisionExtras();
  }

  // ---- Benzer vakalar ----
  if (simItems.length && on('benzer')) {
    out.push(sec(t('BENZER VAKALAR — YZ SENTEZİ', 'SIMILAR CASES — AI SYNTHESIS')));
    out.push(para(run(t("Bu vakalar YZ'nin genel bilgisinden sentezlenmiştir; kaynak doğrulaması yapılmamıştır. Emsal değil ilham olarak okuyun.", "These cases are synthesized from the AI's general knowledge; sources are not verified. Read them as inspiration, not precedent."), { sz: SM, color: WARNINK }), { shd: WARNSOFT, after: 40 }));
    simItems.forEach((v) => {
      const head = v.durum === 'basarili' ? t('✓ Başarılı — ', '✓ Succeeded — ') : v.durum === 'basarisiz' ? t('✗ Başarısız — ', '✗ Failed — ') : t('~ Karışık — ', '~ Mixed — ');
      out.push(bod(run(head + (v.baslik || ''), { b: true, sz: BODY }) + (hasT(v.baglam) ? run(' — ' + v.baglam, { sz: SM, color: INK4 }) : '')));
      if (hasT(v.cozum)) out.push(sm(run(t('Ne yaptılar: ', 'What they did: ') + v.cozum, { sz: SM, color: INK3 })));
      if (hasT(v.ders)) out.push(sm(run(t('Taşınabilir ders: ', 'Transferable lesson: ') + v.ders, { sz: SM, color: OKINK })));
    });
  }

  // ---- Aksiyon planı ----
  if (actions.length && on('karar')) {
    out.push(sec(t('AKSİYON PLANI', 'ACTION PLAN')));
    const STATUS = { tamam: t('tamamlandı', 'completed'), devam: t('devam ediyor', 'in progress'), bekliyor: t('bekliyor', 'waiting'), gecikti: t('gecikti', 'delayed') };
    const nw = 500, mw = Math.round(USABLE * 0.34), aw = USABLE - nw - mw;
    let rowsX = tr(th('#', nw) + th(t('Aksiyon', 'Action'), aw) + th(t('Sorumlu / termin / durum', 'Owner / due / status'), mw));
    actions.forEach((a, i) => {
      const pm = prio(a, lang), late = isOverdue(a);
      const meta = [a.owner, hasT(a.startDate) ? t('başlangıç ', 'start ') + a.startDate : '', hasT(a.dueDate) ? t('termin ', 'due ') + a.dueDate : (a.due || ''), STATUS[a.status] || '', pm.scored ? pm.label : ''].filter(Boolean).join(' · ');
      let txt = run(a.text, { sz: TD });
      if (late) txt += run('  ⏰ ' + t('TERMİN GEÇTİ', 'PAST DUE') + (hasT(a.delayReason) ? ' — ' + a.delayReason : ''), { b: true, sz: 16, color: ALERT });
      if (hasT(a.successCriteria)) txt += run('\n' + t('Başarı ölçütü: ', 'Success criterion: ') + a.successCriteria, { sz: 16, color: INK3 });
      rowsX += tr(cel(run(String(i + 1), { b: true, sz: TD, color: late ? ALERT : INK }), nw, { align: 'center' }) + cel(txt, aw) + cel(run(meta, { sz: 16, color: INK3 }), mw));
    });
    out.push(table([nw, aw, mw], rowsX));
  }

  // ---- 7 · İzleme ve retrospektif ----
  if ((trackRows.length || RETRO.length || (c.tripwires || []).some((tw) => hasT(tw.condition))) && on('izleme')) {
    out.push(sec(t('7 · İZLEME VE RETROSPEKTİF', '7 · TRACKING AND RETROSPECTIVE')));
    if (bars.length) {
      out.push(lbl(t('KPI TRENDİ — ', 'KPI TREND — ') + (p.kpiName || 'KPI') + (hasT(p.target) ? t(' · hedef ', ' · target ') + p.target : '')));
      out.push(barChart(bars.map((tb) => ({ label: run(tb.label, { sz: SM }), pct: Math.round((parseInt(tb.h, 10) || 0) / 110 * 100), color: (tb.bg || '').includes('--ok') ? OK : PRIBAR, value: run(tb.value, { b: true, sz: SM }) }))));
    } else if (trackRows.length) {
      out.push(bod(run(t('KPI ölçümleri: ', 'KPI measurements: '), { b: true, sz: BODY }) + run(trackRows.map((x) => (x.label || '—') + ': ' + (x.value || '—')).join(' · '), { sz: BODY })));
    }
    const tw = (c.tripwires || []).filter((x) => hasT(x.condition));
    if (tw.length) {
      out.push(lbl(t('TETİK ÇİZGİLERİ — önceden kararlaştırılmış tepkiler', 'TRIPWIRES — pre-agreed responses')));
      tw.forEach((x) => { const st = x.status === 'tetiklendi' ? '  ' + t('TETİKLENDİ', 'FIRED') : x.status === 'temiz' ? '  ' + t('gerçekleşmedi ✓', 'did not fire ✓') : ''; out.push(bod(run(x.condition, { b: true, sz: SM }) + run((hasT(x.response) ? ' → ' + x.response : '') + (hasT(x.checkDate) ? ' · ' + t('kontrol: ', 'check: ') + x.checkDate : '') + st, { sz: SM }))); });
    }
    RETRO.forEach((r) => { out.push(para(run(r[1], { b: true, sz: SM, color: PRI }), { before: 60, after: 20 })); out.push(bod(run(retro[r[0]], { sz: BODY }))); });
  }

  // ---- Düşünme kontrolü ----
  if ((thinkingRows.length || scanItems.length) && on('dusunme')) {
    out.push(sec(t('DÜŞÜNME KONTROLÜ', 'THINKING CHECK')));
    thinkingRows.forEach((q) => { out.push(para(run(q.title, { b: true, sz: SM, color: PRI }), { before: 60, after: 20 })); out.push(bod(run(thk[q.key], { sz: BODY }))); });
    if (scanItems.length) { out.push(para(run(t('Tespit edilen düşünme yanılgıları', 'Detected thinking biases'), { b: true, sz: SM, color: PRI }), { before: 60, after: 20 })); scanItems.forEach((it) => out.push(bod(run(it.yanilgi, { b: true, sz: SM }) + (it.yontem ? run(' (' + t('panzehir: ', 'antidote: ') + it.yontem + ')', { sz: SM, color: MUTED }) : '') + (it.soru ? run(' — ' + it.soru, { sz: SM, color: INK3 }) : '')))); }
  }

  // ---- İzlenebilirlik + güven ----
  if (trace.rows.length) {
    out.push(sec(t('İZLENEBİLİRLİK — BULGU → KÖK NEDEN → AKSİYON → KPI', 'TRACEABILITY — FINDING → ROOT CAUSE → ACTION → KPI')));
    const c1 = Math.round(USABLE * 0.30), c2 = Math.round(USABLE * 0.16), c4 = Math.round(USABLE * 0.14), c3 = USABLE - c1 - c2 - c4;
    let rowsX = tr(th(t('Bulgu', 'Finding'), c1) + th(t('Kök neden', 'Root cause'), c2) + th(t('Aksiyon', 'Action'), c3) + th(t('KPI izleniyor', 'KPI tracked'), c4));
    trace.rows.forEach((r) => {
      rowsX += tr(cel(run(r.finding + ' · ' + (r.findingText || '').slice(0, 60), { sz: TD }), c1)
        + cel(run(r.rcs.length ? r.rcs.join(', ') : t('bağlanmamış', 'not linked'), { sz: TD, color: r.rcs.length ? INK : ALERT }), c2)
        + cel(run(r.actions.length ? r.actions.map((x) => (x || '').slice(0, 40)).join(' · ') : t('aksiyon yok', 'no action'), { sz: TD, color: r.actions.length ? INK : WARNINK }), c3)
        + cel(run(r.kpiTracked ? '✓' : '—', { sz: TD }), c4, { align: 'center' }));
    });
    out.push(table([c1, c2, c3, c4], rowsX));
    if (trace.issues.length) { out.push(para(run(t('TUTARLILIK BOŞLUKLARI', 'CONSISTENCY GAPS') + ' (' + trace.issues.length + ')', { b: true, sz: SM, color: WARNINK }), { shd: WARNSOFT, before: 60, after: 20 })); trace.issues.forEach((is) => out.push(para(run('• ' + is.text, { sz: SM, color: WARNINK }), { shd: WARNSOFT, after: 0, ind: 120 }))); }
    else out.push(sm(run(t('✓ Zincirde kopukluk bulunmadı.', '✓ No breaks in the chain.'), { sz: SM, color: OKINK })));
    out.push(lbl(t('ANALİZ GÜVEN SEVİYESİ — ', 'ANALYSIS CONFIDENCE LEVEL — ') + pct(conf.total) + ' (' + conf.label + ')'));
    out.push(barChart(conf.checks.map((ch) => ({ label: run(ch.label, { sz: SM }), pct: ch.pct, color: ch.pct >= 80 ? OK : ch.pct >= 50 ? PRIBAR : GOLD, value: run(pct(ch.pct), { sz: SM }) }))));
    out.push(sm(run(t('Bu gösterge çalışmanın bütünlüğünü ölçer — analizin bilimsel doğruluğunu garanti etmez.', 'This indicator measures the integrity of the case — it does not guarantee scientific correctness.'), { sz: SM, color: MUTED })));
  }

  // ---- Referanslar ----
  if (refs.length && on('referans')) {
    out.push(sec(t('REFERANSLAR', 'REFERENCES')));
    refs.forEach((r, i) => out.push(sm(run('R' + (i + 1) + ' · ', { b: true, sz: SM, color: SOFTINK }) + run((r.title || t('Referans', 'Reference')) + (hasT(r.url) ? ' — ' + r.url : ''), { sz: SM, color: INK3 }))));
  }

  return out.join('');

  function decisionExtras() {
    const dec = c.decision || {}, tm = c.timing || {}, adv = timingAdvice(tm, lang);
    if (adv || hasT(tm.window) || hasT(tm.stopSignal)) {
      out.push(lbl(t('KARAR ZAMANLAMASI', 'DECISION TIMING')));
      if (adv) out.push(bod(run(adv.label, { b: true, sz: SM }) + run(' — ' + t('geri alma bedeli: ', 'cost of reversal: ') + (tm.reversal === 'dusuk' ? t('düşük', 'low') : tm.reversal === 'orta' ? t('orta', 'moderate') : t('yüksek', 'high')), { sz: SM })));
      if (hasT(tm.window)) out.push(sm(run(t('Fırsat penceresi: ', 'Opportunity window: ') + tm.window, { sz: SM })));
      if (hasT(tm.stopSignal)) out.push(sm(run(t('Durma işareti: ', 'Stop signal: ') + tm.stopSignal, { sz: SM })));
    }
    if (hasT(dec.secondOrder)) { out.push(lbl(t('İKİNCİ BASAMAK ETKİLERİ — "VE SONRA NE OLACAK?"', 'SECOND-ORDER EFFECTS — "AND THEN WHAT?"'))); out.push(bod(run(dec.secondOrder, { sz: SM }))); }
    if (hasT(dec.outsideView)) { out.push(lbl(t('DIŞ GÖRÜNÜM — BENZER GİRİŞİMLER GERÇEKTE NASIL SONUÇLANDI?', 'OUTSIDE VIEW — HOW DID SIMILAR INITIATIVES TURN OUT?'))); out.push(bod(run(dec.outsideView, { sz: SM }))); }
    if (hasT(dec.redTeam)) {
      out.push(para(run(t('ŞEYTANIN AVUKATI — KARARA KARŞI EN GÜÇLÜ İTİRAZLAR', "DEVIL'S ADVOCATE — STRONGEST OBJECTIONS"), { b: true, sz: SM, color: WARNINK }), { shd: WARNSOFT, before: 60, after: 20 }));
      out.push(para(run(dec.redTeam, { sz: SM }), { shd: WARNSOFT, after: hasT(dec.redTeamReply) ? 0 : 40 }));
      if (hasT(dec.redTeamReply)) { out.push(para(run(t('İTİRAZLARA YANITIMIZ', 'OUR ANSWER') + ': ', { b: true, sz: SM, color: OKINK }) + run(dec.redTeamReply, { sz: SM }), { shd: WARNSOFT, after: 40 })); }
      else out.push(para(run(t('⚠ İtirazlar henüz yanıtlanmadı.', '⚠ Not yet answered.'), { i: true, sz: SM, color: WARNINK }), { shd: WARNSOFT, after: 40 }));
    }
    if (pmItems.length) {
      out.push(lbl(t('PRE-MORTEM — ÖNGÖRÜLEN BAŞARISIZLIK SENARYOLARI', 'PRE-MORTEM — ANTICIPATED FAILURE SCENARIOS')));
      pmItems.forEach((it) => { out.push(bod(run(it.baslik, { b: true, sz: SM }) + (hasT(it.hikaye) ? run(' — ' + it.hikaye, { sz: SM, color: INK4 }) : ''))); if (hasT(it.onlem)) out.push(sm(run(t('Önleyici tedbir: ', 'Preventive measure: ') + it.onlem, { sz: SM, color: OKINK }))); });
    }
    if (fmeaRows.length) {
      out.push(lbl(t('FMEA — EN YÜKSEK RİSKLİ HATA TÜRLERİ (RPN = Ş×O×T)', 'FMEA — HIGHEST-RISK FAILURE MODES (RPN = S×O×D)')));
      const rw = 700, hw = Math.round(USABLE * 0.30), ew = Math.round(USABLE * 0.30), ow = USABLE - rw - hw - ew;
      let rowsX = tr(th('RPN', rw) + th(t('Hata türü', 'Failure mode'), hw) + th(t('Etki', 'Effect'), ew) + th(t('Önlem', 'Measure'), ow));
      fmeaRows.slice().sort((x, y) => (rpnOf(y) || 0) - (rpnOf(x) || 0)).slice(0, 5).forEach((r) => {
        const rpn = rpnOf(r), col = (rpn || 0) >= 200 ? ALERT : (rpn || 0) >= 100 ? WARNINK : INK;
        rowsX += tr(cel(run(rpn !== null ? String(rpn) : '—', { b: true, sz: TD, color: col }), rw, { align: 'center' }) + cel(run(r.mode, { b: true, sz: TD }), hw) + cel(run(r.effect || '—', { sz: TD }), ew) + cel(run(r.onlem || '—', { sz: TD }), ow));
      });
      out.push(table([rw, hw, ew, ow], rowsX));
    }
    if (ffD.length || ffR.length) {
      const dTot = ffD.reduce((a, x) => a + (parseInt(x.strength, 10) || 0), 0), rTot = ffR.reduce((a, x) => a + (parseInt(x.strength, 10) || 0), 0);
      out.push(lbl(t('KUVVET ALANI ANALİZİ (LEWIN)', 'FORCE FIELD ANALYSIS (LEWIN)')));
      if (ffD.length) { out.push(sm(run(t('İTİCİ → (toplam ', 'DRIVING → (total ') + dTot + ')', { b: true, sz: SM, color: OKINK }))); out.push(barChart(ffD.map((x) => ({ label: run(x.text, { sz: SM }), pct: (parseInt(x.strength, 10) || 0) * 20, color: OK, value: run((x.strength || '?') + '/5', { sz: SM }) })))); }
      if (ffR.length) { out.push(sm(run(t('← KISITLAYICI (toplam ', '← RESTRAINING (total ') + rTot + ')', { b: true, sz: SM, color: WARNINK }))); out.push(barChart(ffR.map((x) => ({ label: run(x.text + (hasT(x.azaltma) ? ' — ' + t('zayıflatma: ', 'mitigation: ') + x.azaltma : ''), { sz: SM }), pct: (parseInt(x.strength, 10) || 0) * 20, color: WARNINK, value: run((x.strength || '?') + '/5', { sz: SM }) })))); }
    }
  }
}

/** Raporu .docx olarak üretir (async). Tarayıcıda Blob, node'da Buffer. */
export function buildReportDocx(c, opts = {}) {
  return buildDocx(buildReportDocxBody(c, opts));
}
