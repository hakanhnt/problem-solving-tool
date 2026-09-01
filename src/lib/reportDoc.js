// Raporu Word (.doc) belgesi olarak dışa aktarır — ek bağımlılık yok.
// Word/Google Dokümanlar'ın doğrudan açtığı Office-uyumlu HTML üretir.
// İçerik ve bölüm görünürlüğü ReportBody.jsx ile birebir aynıdır (aynı girdiler + on()).
// SAF fonksiyon: DOM'a dokunmaz, tests/reportDoc.test.mjs ile test edilir.

import {
  gapInfo, decisionMatrix, trackingBars, paretoData, traceability,
  confidenceScore, caseMaturity, rcStatusMeta, isOverdue, driverMap, timingAdvice
} from './derive.js';
import { preDecisionQuestionsFor } from './thinking.js';
import { mkT, fmtNum } from './i18n.js';
import { fishboneCatsFor } from './defaults.js';
import { FT, hasT, esc, LBL, BOX, h2, line, small, table, reportFileName, prio } from './reportDocUtil.js';

export { reportFileName };

export function buildReportDoc(c, opts = {}) {
  const { principles = [], sections, companyName = '', lang = 'tr', summaryText, format = 'doc' } = opts;
  const t = mkT(lang);
  const pct = (v) => (lang === 'en' ? v + '%' : '%' + v);
  const on = (k) => !sections || sections[k] !== false;
  const p = c.problem || {};

  const g = gapInfo(p, lang);
  const { hasGap, kpiGapText } = g;
  const M = decisionMatrix(c, lang);
  const trace = traceability(c, lang);
  const conf = confidenceScore(c, lang);
  const maturity = caseMaturity(c, lang);
  const bars = trackingBars(c);
  const pareto = paretoData(c, lang);
  const spec = c.spec || {};
  const cont = c.containment || {};

  const SPEC_LABELS = [['nerede', t('Nerede', 'Where')], ['zaman', t('Ne zaman', 'When')], ['kirilim', t('Kırılımda', 'In which breakdown')], ['buyukluk', t('Büyüklük', 'Magnitude')]];
  const specRows = SPEC_LABELS.filter(([k]) => hasT((spec[k] || {}).v) || hasT((spec[k] || {}).y));
  const dims = [
    { label: t('Yer / Birim', 'Location / Unit'), value: p.geo },
    { label: t('Dönem', 'Period'), value: p.time },
    { label: t('Segment / Kırılım', 'Segment / Breakdown'), value: p.brand }
  ].filter((d) => hasT(d.value));

  const drivers = (c.drivers || []).filter((d) => hasT(d.name));
  const da = (c.driverAnalysis || []).filter((d) => hasT(d.driver) || hasT(d.component));
  const sipocRows = (c.sipoc || []).filter((r) => [r.s, r.i, r.p, r.o, r.c].some(hasT));
  const findings = (c.findings || []).filter((f) => hasT(f.text));
  const fb = c.fishbone || {};
  const FB_LABELS = fishboneCatsFor(lang).map((cat) => [cat.key, cat.title]);
  const fbRows = FB_LABELS.filter(([k]) => hasT(fb[k]));
  const chains = (c.whyChains || []).filter((ch) => (ch.whys || []).some(hasT));
  const whys = (c.whys || []).map((w, i) => ({ n: i + 1 + '.', text: w || '' })).filter((w) => hasT(w.text));
  const rootCauses = (c.rootCauses || []).filter((r) => hasT(r.text));
  const alts = (c.alternatives || []).filter((a) => hasT(a.name));
  const hasScores = M.rows.some((r) => r.cells.some((cell) => String(cell.value).trim() !== ''));
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
  const RETRO_ROWS = [
    { key: 'valid', label: t('Kök neden tespiti doğru muydu?', 'Was the root cause identification correct?') },
    { key: 'worked', label: t('Karşı önlemler işe yaradı mı?', 'Did the countermeasures work?') },
    { key: 'process', label: t('Karar sonrası refleksiyon (süreç mi, sonuç mu?)', 'Post-decision reflection (process or outcome?)') },
    { key: 'lessons', label: t('Öğrendiklerimiz / standarda bağlananlar', 'Lessons learned / items standardized') }
  ].filter((r) => hasT(retro[r.key]));
  const summary = (summaryText || (c.report && c.report.status === 'done' && c.report.text) || '').trim();

  const out = [];

  // ---- Başlık ----
  const metaParts = [(companyName || '').trim(), (c.name || '').trim()].filter(Boolean);
  const metaLine = (metaParts.length ? metaParts.map(esc).join(' · ') + ' · ' : '')
    + new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  out.push(
    `<table style="border-collapse:collapse;width:100%;border-bottom:2px solid #35506e;margin:0 0 16px;"><tr>`
    + `<td style="border:none;padding:0 0 12px;vertical-align:top;">`
    + `<div style="font:700 10.5px ${FT};color:#4e6987;letter-spacing:1.2px;margin:0 0 6px;">${t('PROBLEM ÇÖZME ÇALIŞMA RAPORU', 'PROBLEM-SOLVING CASE REPORT')}</div>`
    + `<div style="font:700 21px/1.3 ${FT};color:#26241f;">${esc(hasT(p.kpiName) ? p.kpiName.trim() : t('Problem Çözme Çalışması', 'Problem-Solving Case'))}</div>`
    + `<div style="font:12px ${FT};color:#65605a;margin-top:5px;">${metaLine}</div>`
    + `</td>`
    + `<td style="border:none;padding:0 0 12px;text-align:right;vertical-align:top;white-space:nowrap;"><span style="font:700 14px ${FT};color:#35506e;">ProblemLab</span></td>`
    + `</tr></table>`
  );

  // ---- Yönetici özeti ----
  out.push(buildSummary());

  // ---- 1 · Problem tanımı ----
  if (on('tanim')) {
    let s = h2(t('1 · PROBLEM TANIMI', '1 · PROBLEM DEFINITION'));
    s += `<div style="font:13.5px/1.6 ${FT};color:#26241f;">${esc(hasT(p.statement) ? p.statement.trim() : '—')}</div>`;
    if (dims.length) s += dims.map((d) => small(`<strong>${esc(d.label)}:</strong> ${esc(d.value)}`, '#57534b')).join('');
    if (hasGap) {
      s += `<div style="display:inline-block;background:#f6e9e5;border:1px solid #e5c8bf;border-radius:6px;padding:6px 11px;margin-top:8px;font:600 12.5px ${FT};color:#8c4a35;">`
        + `${esc((p.kpiName || 'KPI') + t(': hedef ', ': target ') + (p.target || '—') + t(' / gerçekleşen ', ' / actual ') + (p.actual || '—'))} · ${esc(kpiGapText)}</div>`;
    }
    if (specRows.length) {
      s += `<div style="${LBL}">${t('VAR / YOK BELİRTİMİ', 'IS / IS-NOT SPECIFICATION')}</div>`;
      s += table(
        [{ html: '&nbsp;' }, { html: esc(t('VAR', 'IS')) }, { html: esc(t('YOK', 'IS-NOT')) }],
        specRows.map(([k, label]) => ({ cells: [
          { html: `<strong>${esc(label)}</strong>`, style: 'white-space:nowrap;' },
          { html: esc((spec[k] || {}).v || '—') },
          { html: esc((spec[k] || {}).y || '—') }
        ] }))
      );
      if (hasT(spec.degisiklik)) s += line(`<strong>${t('Değişiklik analizi:', 'Change analysis:')}</strong> ${esc(spec.degisiklik)}`);
    }
    out.push(s);
  }

  // ---- 2 · Sürücü haritası ----
  if (drivers.length && on('driver')) {
    const dm = driverMap(c);
    let s = h2(t('2 · İŞ SÜRÜCÜSÜ HARİTASI', '2 · BUSINESS DRIVER MAP'));
    s += line(`<strong>${esc(hasT(p.kpiName) ? p.kpiName.trim() : 'KPI')}</strong> ${t('şu iş sürücülerinden etkileniyor:', 'is driven by:')}`, 'color:#4e6987;');
    s += drivers.map((d, i) => {
      let r = `<strong>D${i + 1} · ${esc(d.name)}</strong>`;
      if (dm[i] && dm[i].hasSub) r += ` <span style="color:#4e6987;">— ${t('alt bileşenler: ', 'subcomponents: ')}${esc(dm[i].sub)}</span>`;
      if (hasT(d.note)) r += ` <span style="color:#6d6860;">— ${esc(d.note)}</span>`;
      return line(r);
    }).join('');
    out.push(s);
  }

  // ---- 3 · Sürücü analizi + SIPOC ----
  if (da.length && on('analiz')) {
    let s = h2(t('3 · İŞ SÜRÜCÜSÜ ANALİZİ', '3 · BUSINESS DRIVER ANALYSIS'));
    s += da.map((d) => {
      const head = (d.driver ? d.driver + ' → ' : '') + (d.component || '');
      return line(`<strong>${esc(head)}</strong>${hasT(d.issue) ? ` <span style="color:#6d6860;">— ${esc(d.issue)}</span>` : ''}`);
    }).join('');
    if (sipocRows.length) {
      s += `<div style="${LBL}">${t('SIPOC (TEDARİKÇİ → GİRDİ → SÜREÇ → ÇIKTI → MÜŞTERİ)', 'SIPOC (SUPPLIER → INPUT → PROCESS → OUTPUT → CUSTOMER)')}</div>`;
      s += table(
        [t('Tedarikçi', 'Supplier'), t('Girdi', 'Input'), t('Süreç', 'Process'), t('Çıktı', 'Output'), t('Müşteri', 'Customer')].map((h) => ({ html: esc(h) })),
        sipocRows.map((r) => ({ cells: ['s', 'i', 'p', 'o', 'c'].map((k) => ({ html: esc(hasT(r[k]) ? r[k] : '—') })) }))
      );
    }
    out.push(s);
  }

  // ---- 4 · Bulgular + Pareto ----
  if (findings.length && on('bulgu')) {
    let s = h2(t('4 · DOĞRULANMIŞ BULGULAR', '4 · VERIFIED FINDINGS'));
    s += findings.map((f, i) =>
      line(`<strong style="color:#35506e;">${t('B', 'F')}${i + 1}</strong> · ${esc(f.text)}${hasT(f.evidence) ? ` <span style="color:#65605a;">(${t('Kanıt: ', 'Evidence: ')}${esc(f.evidence)})</span>` : ''}`)
    ).join('');
    if (pareto) {
      s += `<div style="${LBL}">${t('PARETO — SAPMAYA KATKI DAĞILIMI', 'PARETO — CONTRIBUTION TO THE GAP')}</div>`;
      s += table(
        [{ html: '&nbsp;' }, { html: esc(t('Bulgu', 'Finding')) }, { html: esc(t('Katkı', 'Contribution')), center: true }, { html: t('Pay', 'Share'), center: true }],
        pareto.bars.map((bar) => ({
          bg: pareto.vital.includes(bar.label) ? '#eef2f7' : undefined,
          cells: [
            { html: `<strong style="color:#35506e;">${esc(bar.label)}</strong>` },
            { html: esc((bar.text || '').slice(0, 80)) },
            { html: esc(fmtNum(lang, bar.v) + (pareto.unit ? ' ' + pareto.unit : '')), center: true },
            { html: esc(pct(pareto.mode === 'kpi' ? bar.pctOfGap : bar.pctInternal)), center: true }
          ]
        }))
      );
      s += small(t('Koyu satırlar öncelikli (vital few) bulgulardır.', 'Shaded rows are the vital-few findings.'), '#65605a');
      s += buildParetoText();
    }
    out.push(s);
  }

  // ---- 5 · Kök neden (5 neden) + zincirler + balık kılçığı ----
  if ((whys.length || chains.length || fbRows.length) && on('kok')) {
    let s = h2(t('5 · KÖK NEDEN ANALİZİ (5 NEDEN)', '5 · ROOT CAUSE ANALYSIS (5 WHYS)'));
    s += whys.map((w) => line(`<strong style="color:#4e6987;">${esc(w.n)}</strong> ${esc(w.text)}`)).join('');
    s += chains.map((ch, ci) => {
      let r = `<div style="border-left:3px solid #b9cbe0;padding-left:10px;margin-top:8px;">`;
      r += `<div style="font:600 12px/1.5 ${FT};color:#4e6987;margin:0 0 3px;">${esc(hasT(ch.label) ? ch.label : t('Alternatif neden dalı ', 'Alternative cause branch ') + (ci + 1))}</div>`;
      r += (ch.whys || []).map((w, i) => (hasT(w) ? line(`<strong style="color:#4e6987;">${i + 1}.</strong> ${esc(w)}`) : '')).join('');
      return r + `</div>`;
    }).join('');
    if (fbRows.length) {
      s += `<div style="${LBL}">${t('BALIK KILÇIĞI (ISHIKAWA) — KATEGORİLERE GÖRE NEDENLER', 'FISHBONE (ISHIKAWA) — CAUSES BY CATEGORY')}</div>`;
      s += table(
        [{ html: esc(t('Kategori', 'Category')) }, { html: esc(t('Nedenler', 'Causes')) }],
        FB_LABELS.filter(([k]) => hasT(fb[k])).map(([k, title]) => ({ cells: [
          { html: `<strong>${esc(title)}</strong>`, style: 'white-space:nowrap;' },
          { html: esc(fb[k]) }
        ] }))
      );
    }
    out.push(s);
  }

  // ---- Kök nedenler ve gelişim alanları ----
  if (rootCauses.length && on('kok')) {
    let s = h2(t('KÖK NEDENLER VE GELİŞİM ALANLARI', 'ROOT CAUSES AND DEVELOPMENT AREAS'));
    s += rootCauses.map((rc, i) => {
      const st = rcStatusMeta(rc.status, lang);
      const unverified = !['dogrulandi', 'test-edildi', 'destekleniyor'].includes(rc.status || 'hipotez');
      const badge = (unverified ? st.label.toUpperCase() + t(' — DOĞRULANMADI', ' — NOT VERIFIED') : st.label.toUpperCase());
      let r = line(`<strong style="color:#8c4a35;">${t('KN', 'RC')}${i + 1}</strong> · ${esc(rc.text)} <span style="font:700 10px ${FT};color:${unverified ? '#805f2e' : '#3d5a3d'};">[${esc(badge)}]</span>`);
      if ((rc.findings || []).length) r += small(`${t('Açıkladığı bulgular: ', 'Explains findings: ')}${(rc.findings || []).map((fi) => t('B', 'F') + (fi + 1)).join(', ')}`);
      if (hasT(rc.evidence)) r += small(`${t('Kanıt: ', 'Evidence: ')}${esc(rc.evidence)}`);
      if (hasT(rc.testResult)) r += small(`${t('Test sonucu: ', 'Test result: ')}${esc(rc.testResult)}`, '#3d5a3d');
      else if (hasT(rc.testPlan)) r += small(`${t('Planlanan test: ', 'Planned test: ')}${esc(rc.testPlan)}`, '#65605a');
      if (hasT(rc.explainsSpec)) r += small(`${t('VAR/YOK desenini açıklıyor mu: ', 'Explains the IS / IS-NOT pattern: ')}${esc(rc.explainsSpec)}`);
      if (hasT(rc.kpiExpected)) r += small(`${t('Giderilirse beklenen etki: ', 'Expected impact if resolved: ')}${esc(rc.kpiExpected)}`);
      if ((rc.principles || []).length) r += small(`${t('Prensipler: ', 'Principles: ')}${esc((rc.principles || []).map((pi) => pi + 1 + '. ' + ((principles || [])[pi] || '')).join(' · '))}`, '#4e6987');
      if (hasT(rc.competency)) r += small(`${t('Yetkinlik gelişim alanı: ', 'Competency development area: ')}${esc(rc.competency)}`, '#65605a');
      return `<div style="margin:0 0 10px;">${r}</div>`;
    }).join('');
    out.push(s);
  }

  // ---- 6 · Alternatifler ve karar ----
  if (alts.length && on('karar')) {
    let s = h2(t('6 · ALTERNATİFLER VE KARAR', '6 · ALTERNATIVES AND DECISION'));
    s += alts.map((a, i) =>
      line(`<strong>A${i + 1}</strong> · ${esc(a.name)}${hasT(a.method) ? ` <span style="color:#65605a;">(${esc(a.method)})</span>` : ''}${hasT(a.note) ? ` <span style="color:#6d6860;">— ${esc(a.note)}</span>` : ''}`)
    ).join('');

    if (hasScores && (c.criteria || []).length) {
      s += `<div style="${LBL}">${t('KARAR MATRİSİ (1–5 · ağırlıklı toplam)', 'DECISION MATRIX (1–5 · weighted total)')}</div>`;
      if (!M.valid) {
        s += `<div style="background:#f6e9e5;border:1px solid #e5c8bf;border-radius:6px;padding:7px 10px;margin:0 0 6px;font:11.5px/1.5 ${FT};color:#8c4a35;">⚠ ${t('Kriter ağırlıkları toplamı ', 'Criterion weights sum to ')}${esc(pct(fmtNum(lang, M.wsum)))} (${esc(M.wDelta > 0 ? fmtNum(lang, M.wDelta) + t(' eksik', ' missing') : fmtNum(lang, -M.wDelta) + t(' fazla', ' extra'))})${t(' — aşağıdaki puanlar taslaktır.', ' — the scores below are drafts.')}</div>`;
      }
      s += table(
        [{ html: esc(t('Alternatif', 'Alternative')) }].concat(
          M.head.map((hd) => ({ html: `${esc(hd.name)}<br><span style="font-weight:400;">${esc(pct(hd.weight))} · ${hd.yon === 'dusuk' ? t('düşük iyi', 'lower better') : t('yüksek iyi', 'higher better')}</span>`, center: true })),
          [{ html: esc(t('Puan', 'Score')), center: true }]
        ),
        M.rows.map((r) => {
          const best = M.best && M.best.n === r.n;
          return {
            bg: best ? '#eef4ee' : undefined,
            cells: [{ html: `<strong>A${esc(r.n)}</strong> · ${esc(r.name)}` }]
              .concat(r.cells.map((cell) => ({ html: esc(String(cell.value).trim() || '—'), center: true })))
              .concat([{ html: `<strong style="color:${best ? '#4a6741' : '#35506e'};">${esc(r.total)}${best ? ' ★' : ''}</strong>`, center: true }])
          };
        })
      );
      if (M.valid && M.best && M.second) {
        let note = t('A' + M.best.n + ' ile A' + M.second.n + ' arasındaki fark ' + fmtNum(lang, M.lead) + ' puan', 'Gap between A' + M.best.n + ' and A' + M.second.n + ': ' + fmtNum(lang, M.lead) + ' points');
        if (M.influential) note += t(' · en belirleyici kriter: ', ' · most decisive criterion: ') + M.influential.name;
        if (M.sensitivity.length) note += t(' · hassasiyet: ', ' · sensitivity: ') + M.sensitivity.map((sn) => t('"' + sn.name + '" çıkarılırsa kazanan ' + sn.newWinner, 'if "' + sn.name + '" is removed, the winner becomes ' + sn.newWinner)).join('; ');
        s += small(esc(note), '#57534b');
      }
    }

    if (hasT(cont.action)) {
      s += line(`<strong style="color:${cont.removed ? '#3d5a3d' : '#805f2e'};">${t('Geçici önlem', 'Containment')}${cont.removed ? t(' (kaldırıldı)', ' (removed)') : t(' (devrede)', ' (active)')}:</strong> ${esc(cont.action)}${hasT(cont.owner) ? ` <span style="color:#65605a;">— ${esc(cont.owner)}</span>` : ''}${hasT(cont.until) ? ` <span style="color:#65605a;">· ${t('kaldırma koşulu: ', 'removal condition: ')}${esc(cont.until)}</span>` : ''}`);
    }
    if (hasT(c.decision && c.decision.choice)) {
      s += `<div style="background:#eef4ee;border:1px solid #cfe0cf;border-radius:8px;padding:12px 14px;margin:8px 0;">`
        + `<div style="font:700 10.5px ${FT};color:#4a6741;letter-spacing:.8px;margin:0 0 6px;">${t('KARAR', 'DECISION')}</div>`
        + `<div style="font:600 13px/1.55 ${FT};color:#26241f;">${esc(c.decision.choice)}</div>`
        + (hasT(c.decision.rationale) ? `<div style="font:12.5px/1.55 ${FT};color:#3d5a3d;margin-top:6px;">${esc(c.decision.rationale)}</div>` : '')
        + `</div>`;
    }
    s += buildDecisionExtras();
    out.push(s);
  }

  // ---- Benzer vakalar (YZ) ----
  if (simItems.length && on('benzer')) {
    let s = h2(t('BENZER VAKALAR — YZ SENTEZİ', 'SIMILAR CASES — AI SYNTHESIS'));
    s += `<div style="background:#faf3e3;border:1px solid #eaddb8;border-radius:6px;padding:6px 9px;margin:0 0 8px;font:11.5px/1.55 ${FT};color:#805f2e;">${t('Bu vakalar YZ\'nin genel bilgisinden sentezlenmiştir; kaynak doğrulaması yapılmamıştır. Emsal değil ilham olarak okuyun.', 'These cases are synthesized from the AI\'s general knowledge; sources are not verified. Read them as inspiration, not precedent.')}</div>`;
    s += simItems.map((v) => {
      const head = v.durum === 'basarili' ? t('✓ Başarılı — ', '✓ Succeeded — ') : v.durum === 'basarisiz' ? t('✗ Başarısız — ', '✗ Failed — ') : t('~ Karışık — ', '~ Mixed — ');
      let r = line(`<strong>${esc(head + (v.baslik || ''))}</strong>${hasT(v.baglam) ? ` <span style="color:#6d6860;">— ${esc(v.baglam)}</span>` : ''}`);
      if (hasT(v.cozum)) r += small(`${t('Ne yaptılar: ', 'What they did: ')}${esc(v.cozum)}`);
      if (hasT(v.sonuc)) r += small(`${t('Ne oldu: ', 'What happened: ')}${esc(v.sonuc)}`);
      if (hasT(v.ders)) r += small(`${t('Taşınabilir ders: ', 'Transferable lesson: ')}${esc(v.ders)}`, '#3d5a3d');
      return `<div style="margin:0 0 6px;">${r}</div>`;
    }).join('');
    out.push(s);
  }

  // ---- Aksiyon planı ----
  if (actions.length && on('karar')) {
    let s = h2(t('AKSİYON PLANI', 'ACTION PLAN'));
    const STATUS = { tamam: t('tamamlandı', 'completed'), devam: t('devam ediyor', 'in progress'), bekliyor: t('bekliyor', 'waiting'), gecikti: t('gecikti', 'delayed') };
    s += table(
      [{ html: '#' }, { html: esc(t('Aksiyon', 'Action')) }, { html: esc(t('Sorumlu / termin / durum', 'Owner / due / status')) }],
      actions.map((a, i) => {
        const pm = prio(a, lang);
        const late = isOverdue(a);
        const meta = [a.owner, hasT(a.startDate) ? t('başlangıç ', 'start ') + a.startDate : '', hasT(a.dueDate) ? t('termin ', 'due ') + a.dueDate : (a.due || ''), STATUS[a.status] || '', pm.scored ? pm.label : ''].filter(Boolean).join(' · ');
        let txt = esc(a.text);
        if (late) txt += ` <strong style="color:#8c4a35;">⏰ ${t('TERMİN GEÇTİ', 'PAST DUE')}${hasT(a.delayReason) ? ' — ' + esc(a.delayReason) : ''}</strong>`;
        if (hasT(a.successCriteria)) txt += small(`${t('Başarı ölçütü: ', 'Success criterion: ')}${esc(a.successCriteria)}${hasT(a.evidence) ? t(' · Kanıt: ', ' · Evidence: ') + esc(a.evidence) : ''}`);
        return { cells: [
          { html: `<strong>${i + 1}</strong>`, center: true, style: late ? 'color:#8c4a35;' : '' },
          { html: txt },
          { html: esc(meta) }
        ] };
      })
    );
    out.push(s);
  }

  // ---- 7 · İzleme ve retrospektif ----
  if ((trackRows.length || RETRO_ROWS.length || (c.tripwires || []).some((tw) => hasT(tw.condition))) && on('izleme')) {
    let s = h2(t('7 · İZLEME VE RETROSPEKTİF', '7 · TRACKING AND RETROSPECTIVE'));
    if (bars.length) {
      s += `<div style="${LBL}">${t('KPI TRENDİ — ', 'KPI TREND — ')}${esc(p.kpiName || 'KPI')}${hasT(p.target) ? esc(t(' · hedef ', ' · target ') + p.target) : ''}</div>`;
      s += table(
        [{ html: esc(t('Dönem', 'Period')) }, { html: esc(t('Değer', 'Value')), center: true }],
        bars.map((tb) => ({ cells: [{ html: esc(tb.label) }, { html: esc(tb.value), center: true }] }))
      );
    } else if (trackRows.length) {
      s += line(`<strong>${t('KPI ölçümleri:', 'KPI measurements:')}</strong> ${esc(trackRows.map((x) => (x.label || '—') + ': ' + (x.value || '—')).join(' · '))}${hasT(p.target) ? ` <span style="color:#65605a;">(${t('hedef ', 'target ')}${esc(p.target)})</span>` : ''}`);
    }
    const tw = (c.tripwires || []).filter((x) => hasT(x.condition));
    if (tw.length) {
      s += `<div style="${LBL}">${t('TETİK ÇİZGİLERİ — önceden kararlaştırılmış tepkiler', 'TRIPWIRES — pre-agreed responses')}</div>`;
      s += tw.map((x) => {
        const st = x.status === 'tetiklendi' ? ` <strong style="color:#8c4a35;">${t('TETİKLENDİ', 'FIRED')}</strong>` : x.status === 'temiz' ? ` <strong style="color:#3d5a3d;">${t('gerçekleşmedi ✓', 'did not fire ✓')}</strong>` : '';
        return line(`<strong>${esc(x.condition)}</strong>${hasT(x.response) ? ' → ' + esc(x.response) : ''}${hasT(x.checkDate) ? ` <span style="color:#65605a;">· ${t('kontrol: ', 'check: ')}${esc(x.checkDate)}</span>` : ''}${st}`);
      }).join('');
    }
    s += RETRO_ROWS.map((r) => `<div style="margin:6px 0;"><div style="font:600 12.5px/1.5 ${FT};color:#35506e;">${esc(r.label)}</div>${line(esc(retro[r.key]))}</div>`).join('');
    out.push(s);
  }

  // ---- Düşünme kontrolü ----
  if ((thinkingRows.length || scanItems.length) && on('dusunme')) {
    let s = h2(t('DÜŞÜNME KONTROLÜ', 'THINKING CHECK'));
    s += thinkingRows.map((q) => `<div style="margin:6px 0;"><div style="font:600 12.5px/1.5 ${FT};color:#35506e;">${esc(q.title)}</div>${line(esc(thk[q.key]))}</div>`).join('');
    if (scanItems.length) {
      s += `<div style="font:600 12.5px/1.5 ${FT};color:#35506e;margin:6px 0 3px;">${t('Tespit edilen düşünme yanılgıları', 'Detected thinking biases')}</div>`;
      s += scanItems.map((it) => line(`<strong>${esc(it.yanilgi)}</strong>${it.yontem ? ` <span style="color:#65605a;">(${t('panzehir: ', 'antidote: ')}${esc(it.yontem)})</span>` : ''}${it.soru ? ` <span style="color:#57534b;">— ${esc(it.soru)}</span>` : ''}`)).join('');
    }
    out.push(s);
  }

  // ---- İzlenebilirlik + güven kontrol listesi (çipe bağlı değil) ----
  if (trace.rows.length) {
    let s = h2(t('İZLENEBİLİRLİK — BULGU → KÖK NEDEN → AKSİYON → KPI', 'TRACEABILITY — FINDING → ROOT CAUSE → ACTION → KPI'));
    s += table(
      [{ html: esc(t('Bulgu', 'Finding')) }, { html: esc(t('Kök neden', 'Root cause')) }, { html: esc(t('Aksiyon', 'Action')) }, { html: esc(t('KPI izleniyor', 'KPI tracked')), center: true }],
      trace.rows.map((r) => ({ cells: [
        { html: `<strong>${esc(r.finding)}</strong> · ${esc((r.findingText || '').slice(0, 70))}${(r.findingText || '').length > 70 ? '…' : ''}` },
        { html: esc(r.rcs.length ? r.rcs.join(', ') : t('bağlanmamış', 'not linked')), style: r.rcs.length ? '' : 'color:#8c4a35;' },
        { html: esc(r.actions.length ? r.actions.map((x) => (x || '').slice(0, 48)).join(' · ') : t('aksiyon yok', 'no action')), style: r.actions.length ? '' : 'color:#805f2e;' },
        { html: r.kpiTracked ? '✓' : '—', center: true }
      ] }))
    );
    if (trace.issues.length) {
      s += `<div style="background:#faf3e3;border:1px solid #eaddb8;border-radius:6px;padding:9px 12px;margin-top:8px;">`
        + `<div style="font:700 11px ${FT};color:#805f2e;letter-spacing:.4px;margin:0 0 4px;">${t('TUTARLILIK BOŞLUKLARI', 'CONSISTENCY GAPS')} (${trace.issues.length})</div>`
        + `<ul style="margin:0;padding-left:18px;font:12px/1.6 ${FT};color:#6f654f;">${trace.issues.map((is) => `<li>${esc(is.text)}</li>`).join('')}</ul></div>`;
    } else {
      s += small(t('✓ Zincirde kopukluk bulunmadı: her bulgu bir kök nedene, her kök neden bir aksiyona bağlı ve sonuç KPI ile izleniyor.', '✓ No breaks in the chain: every finding links to a root cause, every root cause to an action, and the outcome is tracked with the KPI.'), '#3d5a3d');
    }
    s += `<div style="${LBL}">${t('ANALİZ GÜVEN SEVİYESİ — ', 'ANALYSIS CONFIDENCE LEVEL — ')}${esc(pct(conf.total))} (${esc(conf.label)})</div>`;
    s += table(
      [{ html: esc(t('Kontrol', 'Check')) }, { html: esc(t('Puan', 'Score')), center: true }],
      conf.checks.map((ch) => ({ cells: [{ html: esc(ch.label) }, { html: esc(pct(ch.pct)), center: true }] }))
    );
    s += small(t('Bu gösterge çalışmanın bütünlüğünü ölçer (kanıt, test, bağlantı, doğrulama) — analizin bilimsel doğruluğunu garanti etmez.', 'This indicator measures the integrity of the case (evidence, tests, links, verification) — it does not guarantee the scientific correctness of the analysis.'), '#65605a');
    out.push(s);
  }

  // ---- Referanslar ----
  if (refs.length && on('referans')) {
    let s = h2(t('REFERANSLAR', 'REFERENCES'));
    s += refs.map((r, i) => small(`<strong style="color:#4e6987;">R${i + 1}</strong> · ${esc(r.title || t('Referans', 'Reference'))}${hasT(r.url) ? ` <span style="color:#65605a;">— ${esc(r.url)}</span>` : ''}`)).join('');
    out.push(s);
  }

  return wrap(out.join('\n'));

  // ===== iç yardımcı bölümler (kapanış üzerinden değişkenlere erişir) =====

  function buildSummary() {
    const rows = [
      [t('Problem', 'Problem'), esc(hasT(p.statement) ? p.statement.trim() : '—')],
      [t('KPI durumu', 'KPI status'), hasGap ? esc((p.kpiName || 'KPI') + t(': hedef ', ': target ') + (p.target || '—') + t(' / gerçekleşen ', ' / actual ') + (p.actual || '—')) + ' · ' + esc(kpiGapText) : esc(t('Ölçülmüş KPI farkı girilmemiş', 'No measured KPI gap entered'))],
      [t('Ana kök neden(ler)', 'Main root cause(s)'), rootCauses.length ? rootCauses.map((rc, i) => esc(t('KN', 'RC') + (i + 1) + ' (' + rcStatusMeta(rc.status, lang).label.toLowerCase() + ')')).join(' · ') : esc(t('Kök neden yazılmamış', 'No root cause written'))],
      [t('Karar', 'Decision'), esc(hasT(c.decision && c.decision.choice) ? c.decision.choice : t('Karar yazılmamış', 'No decision written'))],
      [t('Aksiyonlar', 'Actions'), actions.length ? esc(actions.length + t(' aksiyon · ', ' actions · ') + actions.filter((a) => a.status === 'tamam').length + t(' tamam · ', ' done · ') + actions.filter((a) => isOverdue(a)).length + t(' gecikmiş', ' overdue')) : esc(t('Aksiyon planlanmamış', 'No actions planned'))],
      [t('Sonuç', 'Outcome'), trackRows.length ? esc(t('Son ölçüm: ', 'Latest measurement: ') + (trackRows[trackRows.length - 1].value || '—') + ' (' + (trackRows[trackRows.length - 1].label || t('son dönem', 'latest period')) + ')') : esc(t('Henüz KPI ölçümü girilmemiş', 'No KPI measurements entered yet'))]
    ];
    const warn = [];
    const hypo = rootCauses.filter((rc) => !['dogrulandi', 'test-edildi', 'destekleniyor'].includes(rc.status || 'hipotez'));
    if (hypo.length) warn.push(hypo.length + t(' kök neden hâlâ hipotez (veriyle doğrulanmadı)', ' root cause(s) still a hypothesis (not verified with data)'));
    const lateN = actions.filter((a) => isOverdue(a)).length;
    if (lateN) warn.push(lateN + t(' aksiyonun termini geçti', ' action(s) past their due date'));
    const openN = actions.filter((a) => a.status !== 'tamam').length;
    if (openN) warn.push(openN + t(' aksiyon henüz tamamlanmadı', ' action(s) not yet completed'));
    if (pareto && pareto.mode === 'kpi' && pareto.overflow > 0) warn.push(t('Bulgu katkıları KPI sapmasını aşıyor — veri tutarsızlığı', 'Finding contributions exceed the KPI gap — data inconsistency'));
    else if (pareto && pareto.mode === 'kpi' && pareto.unexplainedPct >= 30) warn.push(t('KPI sapmasında bulgularla açıklanmayan pay ', 'Share of the KPI gap unexplained by findings: ') + pct(pareto.unexplainedPct));
    if (trace.issues.length) warn.push(trace.issues.length + t(' izlenebilirlik boşluğu var', ' traceability gap(s)'));

    let s = `<div style="background:#f2f6fb;border:1px solid #d8e2ee;border-radius:8px;padding:14px 16px;margin:0 0 18px;">`;
    s += `<div style="font:700 10.5px ${FT};color:#4e6987;letter-spacing:.8px;margin:0 0 4px;">${t('YÖNETİCİ ÖZETİ', 'EXECUTIVE SUMMARY')}</div>`;
    s += `<div style="font:600 10.5px ${FT};color:#2c4159;margin:0 0 8px;">${t('Durum: ', 'Status: ')}${esc(maturity.label)} · ${t('Analiz güven seviyesi: ', 'Analysis confidence level: ')}${esc(pct(conf.total))} · ${esc(conf.label)}</div>`;
    s += `<table style="border-collapse:collapse;width:100%;margin:0 0 8px;"><tbody>${rows.map(([k, v]) => `<tr><td style="padding:3px 8px 3px 0;width:150px;vertical-align:top;font:700 12px/1.45 ${FT};color:#4e6987;">${esc(k)}</td><td style="padding:3px 0;font:12px/1.45 ${FT};color:#26241f;">${v}</td></tr>`).join('')}</tbody></table>`;
    if (warn.length) s += `<div style="background:#faf3e3;border:1px solid #eaddb8;border-radius:6px;padding:9px 12px;font:12px/1.6 ${FT};color:#6f654f;"><strong>${t('Bu raporu okurken dikkat:', 'Note while reading this report:')}</strong> ${esc(warn.join(' · '))}.</div>`;
    if (summary) s += `<div style="font:13px/1.65 ${FT};color:#26241f;white-space:pre-wrap;margin-top:10px;padding-top:10px;border-top:1px solid #d8e2ee;">${esc(summary)}</div>`;
    return s + `</div>`;
  }

  function buildParetoText() {
    if (!pareto) return '';
    let txt;
    if (pareto.mode === 'kpi') {
      txt = t('KPI sapması ', 'KPI gap ') + fmtNum(lang, pareto.gap) + (pareto.unit ? ' ' + pareto.unit : '')
        + t('; bulgularla açıklanan ', '; explained by findings ') + fmtNum(lang, pareto.explained) + (pareto.unit ? ' ' + pareto.unit : '') + ' (' + pct(pareto.explainedPct) + ')'
        + (pareto.unexplained > 0 ? t(', açıklanamayan ', ', unexplained ') + fmtNum(lang, pareto.unexplained) + (pareto.unit ? ' ' + pareto.unit : '') + ' (' + pct(pareto.unexplainedPct) + ')' : '') + '. '
        + t('Öncelikli bulgular: ', 'Vital few findings: ') + pareto.vital.join(' + ') + ' (' + pareto.bars.map((b) => b.label + ' ' + pct(b.pctOfGap)).join(' · ') + t(' — sapmaya oranla', ' — relative to the gap') + ').'
        + (pareto.overflow > 0 ? ' ⚠ ' + t('Katkı toplamı KPI sapmasını ', 'Total contributions exceed the KPI gap by ') + fmtNum(lang, pareto.overflow) + (pareto.unit ? ' ' + pareto.unit : '') + t(' aşıyor; veriler gözden geçirilmeli.', '; the data should be reviewed.') : '');
    } else {
      txt = t('KPI sapması girilmediği için yalnızca bulguların iç dağılımı: ', 'No KPI gap entered, so only the internal distribution of findings: ') + pareto.vital.join(' + ')
        + t(' → kümülatif pay ', ' → cumulative share ') + pct(pareto.vitalPct) + ' (' + pareto.bars.map((b) => b.label + ' ' + pct(b.pctInternal)).join(' · ') + ').';
    }
    return `<div style="font:12.5px/1.55 ${FT};color:#2c4159;margin-top:6px;"><strong>Pareto:</strong> ${esc(txt)}</div>`;
  }

  function buildDecisionExtras() {
    let s = '';
    const dec = c.decision || {};
    const tm = c.timing || {};
    const adv = timingAdvice(tm, lang);
    if (adv || hasT(tm.window) || hasT(tm.stopSignal)) {
      s += `<div style="${BOX}"><div style="${LBL}margin:0 0 4px;">${t('KARAR ZAMANLAMASI', 'DECISION TIMING')}</div>`;
      if (adv) s += line(`<strong>${esc(adv.label)}</strong> — ${t('geri alma bedeli: ', 'cost of reversal: ')}${tm.reversal === 'dusuk' ? t('düşük', 'low') : tm.reversal === 'orta' ? t('orta', 'moderate') : t('yüksek', 'high')}`);
      if (hasT(tm.window)) s += line(`${t('Fırsat penceresi: ', 'Opportunity window: ')}${esc(tm.window)}`);
      if (hasT(tm.stopSignal)) s += line(`${t('Durma işareti: ', 'Stop signal: ')}${esc(tm.stopSignal)}`);
      s += `</div>`;
    }
    if (hasT(dec.secondOrder)) s += `<div style="${BOX}"><div style="${LBL}margin:0 0 4px;">${t('İKİNCİ BASAMAK ETKİLERİ — "VE SONRA NE OLACAK?"', 'SECOND-ORDER EFFECTS — "AND THEN WHAT?"')}</div>${line(esc(dec.secondOrder))}</div>`;
    if (hasT(dec.outsideView)) s += `<div style="${BOX}"><div style="${LBL}margin:0 0 4px;">${t('DIŞ GÖRÜNÜM — BENZER GİRİŞİMLER GERÇEKTE NASIL SONUÇLANDI?', 'OUTSIDE VIEW — HOW DID SIMILAR INITIATIVES ACTUALLY TURN OUT?')}</div>${line(esc(dec.outsideView))}</div>`;
    if (hasT(dec.redTeam)) {
      s += `<div style="background:#faf3e3;border:1px solid #eaddb8;border-radius:8px;padding:10px 13px;margin:8px 0;"><div style="font:600 11px ${FT};color:#805f2e;letter-spacing:.4px;margin:0 0 4px;">${t('ŞEYTANIN AVUKATI — KARARA KARŞI EN GÜÇLÜ İTİRAZLAR', "DEVIL'S ADVOCATE — STRONGEST OBJECTIONS TO THE DECISION")}</div>`
        + `<div style="font:12.5px/1.55 ${FT};color:#26241f;white-space:pre-wrap;">${esc(dec.redTeam)}</div>`;
      if (hasT(dec.redTeamReply)) s += `<div style="margin-top:8px;border-top:1px solid #eaddb8;padding-top:8px;"><div style="font:600 11px ${FT};color:#3d5a3d;letter-spacing:.4px;margin:0 0 4px;">${t('İTİRAZLARA YANITIMIZ', 'OUR ANSWER TO THE OBJECTIONS')}</div><div style="font:12.5px/1.55 ${FT};color:#26241f;white-space:pre-wrap;">${esc(dec.redTeamReply)}</div></div>`;
      else s += `<div style="font:11.5px/1.5 ${FT};color:#805f2e;font-style:italic;margin-top:6px;">${t('⚠ İtirazlar henüz yanıtlanmadı.', '⚠ The objections have not been answered yet.')}</div>`;
      s += `</div>`;
    }
    if (pmItems.length) {
      s += `<div style="${LBL}">${t('PRE-MORTEM — ÖNGÖRÜLEN BAŞARISIZLIK SENARYOLARI', 'PRE-MORTEM — ANTICIPATED FAILURE SCENARIOS')}</div>`;
      s += pmItems.map((it) => {
        let r = line(`<strong>${esc(it.baslik)}</strong>${hasT(it.hikaye) ? ` <span style="color:#6d6860;">— ${esc(it.hikaye)}</span>` : ''}`);
        if (hasT(it.sinyal)) r += small(`${t('Erken sinyal: ', 'Early signal: ')}${esc(it.sinyal)}`, '#805f2e');
        if (hasT(it.onlem)) r += small(`${t('Önleyici tedbir: ', 'Preventive measure: ')}${esc(it.onlem)}${it.added ? t(' (aksiyon planına eklendi)', ' (added to the action plan)') : ''}`, '#3d5a3d');
        return `<div style="margin:0 0 6px;">${r}</div>`;
      }).join('');
    }
    if (fmeaRows.length) {
      s += `<div style="${LBL}">${t('FMEA — EN YÜKSEK RİSKLİ HATA TÜRLERİ (RPN = Ş×O×T)', 'FMEA — HIGHEST-RISK FAILURE MODES (RPN = S×O×D)')}</div>`;
      const sorted = fmeaRows.slice().sort((x, y) => (rpnOf(y) || 0) - (rpnOf(x) || 0)).slice(0, 5);
      s += table(
        [{ html: 'RPN', center: true }, { html: esc(t('Hata türü', 'Failure mode')) }, { html: esc(t('Etki', 'Effect')) }, { html: esc(t('Önlem', 'Measure')) }],
        sorted.map((r) => {
          const rpn = rpnOf(r);
          const col = (rpn || 0) >= 200 ? '#8c4a35' : (rpn || 0) >= 100 ? '#805f2e' : '#26241f';
          return { cells: [
            { html: `<strong style="color:${col};">${rpn !== null ? rpn : '—'}</strong>`, center: true },
            { html: `<strong>${esc(r.mode)}</strong>` },
            { html: esc(r.effect || '—') },
            { html: esc(r.onlem || '—') }
          ] };
        })
      );
      if (fmeaRows.length > 5) s += small(t('+' + (fmeaRows.length - 5) + ' satır daha (uygulamada)', '+' + (fmeaRows.length - 5) + ' more rows (in the app)'), '#65605a');
    }
    if (ffD.length || ffR.length) {
      const dTot = ffD.reduce((acc, x) => acc + (parseInt(x.strength, 10) || 0), 0);
      const rTot = ffR.reduce((acc, x) => acc + (parseInt(x.strength, 10) || 0), 0);
      s += `<div style="${LBL}">${t('KUVVET ALANI ANALİZİ (LEWIN)', 'FORCE FIELD ANALYSIS (LEWIN)')}</div>`;
      const dList = ffD.map((x) => `${esc(x.text)} (${esc(x.strength || '?')}/5)`);
      const rList = ffR.map((x) => `${esc(x.text)} (${esc(x.strength || '?')}/5)${hasT(x.azaltma) ? ' — ' + t('zayıflatma: ', 'mitigation: ') + esc(x.azaltma) : ''}`);
      const maxLen = Math.max(dList.length, rList.length);
      s += table(
        [{ html: `${t('İTİCİ →', 'DRIVING →')} (${dTot})` }, { html: `${t('← KISITLAYICI', '← RESTRAINING')} (${rTot})` }],
        Array.from({ length: maxLen }, (_, i) => ({ cells: [{ html: dList[i] || '—' }, { html: rList[i] || '—' }] }))
      );
      s += small(t('Toplam: itici ' + dTot + ' / kısıtlayıcı ' + rTot, 'Totals: driving ' + dTot + ' vs restraining ' + rTot), dTot >= rTot ? '#3d5a3d' : '#805f2e');
    }
    return s;
  }

  function wrap(bodyHtml) {
    const title = esc(hasT(p.kpiName) ? p.kpiName.trim() : t('Problem Çözme Çalışma Raporu', 'Problem-Solving Case Report'));
    // Belge her zaman AÇIK temalı: Word/görüntüleyici koyu modda olsa bile zemin beyaz,
    // metin koyu kalsın diye gövde + sarmalayıcıya açık renkler açıkça verilir (şeffaf yer bırakılmaz).
    // format 'doc' → Word için MSO namespace'li; 'html' → temiz tarayıcı sayfası.
    const open = format === 'html'
      ? '<!doctype html><html lang="' + (lang === 'en' ? 'en' : 'tr') + '">'
      : '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">';
    return open
      + '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + title + '</title>'
      + '<style>@page{size:A4;margin:16mm 14mm}'
      + 'html,body{background:#ffffff;color:#26241f;}'
      + 'body{margin:0;font-family:' + FT + ';font-size:11pt;}'
      + 'table{border-collapse:collapse;}</style>'
      + '</head><body bgcolor="#ffffff" text="#26241f">'
      + '<div style="background:#ffffff;color:#26241f;padding:6px 10px;' + (format === 'html' ? 'max-width:960px;margin:0 auto;' : '') + '">' + bodyHtml + '</div>'
      + '</body></html>';
  }
}
