// Girdilerden türetilen değerler — SAF hesaplama katmanı (arayüz bileşeni içermez).
// Kritik fonksiyonlar tests/derive.test.mjs ile otomatik test edilir.

const num = v => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return isFinite(n) ? n : null;
};

/** KPI yönü: kayıtta yoksa eski davranışla uyumlu tahmin (gerçekleşen > hedef ⇒ düşük iyi). */
export function effDirection(problem) {
  const d = (problem && problem.direction) || '';
  if (d === 'dusuk' || d === 'yuksek' || d === 'aralik') return d;
  const t = num(problem && problem.target), a = num(problem && problem.actual);
  if (t !== null && a !== null) return a >= t ? 'dusuk' : 'yuksek';
  return 'dusuk';
}

/**
 * KPI sapması — yöne duyarlı. lang ('tr'|'en') yalnız metinleri etkiler.
 * Döndürür: { hasGap, diff, gapMag, pct|null, good|null, atTarget, label, remainText, kpiGapText, zeroTargetNote, direction }
 * - pct: hedef 0 ise null (yüzde hesabı yapılmaz), aralık modunda null
 * - good: olumlu sapma mı (hedeften iyi tarafta mı)
 */
export function gapInfo(problem, lang) {
  const p = problem || {};
  const en = lang === 'en';
  const T = (tr, e) => (en ? e : tr);
  const F = v => (en ? String(r2(v)) : fmt(v));
  const pctF = v => (en ? F(v) + '%' : '%' + F(v));
  const target = num(p.target), actual = num(p.actual);
  const direction = effDirection(p);
  const unit = (p.unit || '').trim();
  const u = unit ? ' ' + unit : '';

  const none = { hasGap: false, diff: 0, gapMag: 0, pct: null, good: null, atTarget: false, label: '', remainText: '', kpiGapText: '', zeroTargetNote: '', direction };
  if (target === null || actual === null) return none;

  if (direction === 'aralik') {
    const hi = num(p.targetHigh);
    if (hi === null) return { ...none, hasGap: true, kpiGapText: T('Aralık üst sınırı girilmedi — hedef aralığı tanımlayın', 'Range upper bound missing — define the target range'), label: T('aralık tanımsız', 'range undefined') };
    const lo = Math.min(target, hi), high = Math.max(target, hi);
    const inside = actual >= lo && actual <= high;
    const diff = inside ? 0 : (actual < lo ? actual - lo : actual - high);
    const gapMag = Math.abs(diff);
    const label = inside ? T('aralık içinde (olumlu)', 'within range (favorable)') : T('aralık dışında (olumsuz)', 'out of range (unfavorable)');
    return {
      hasGap: true, diff: r2(diff), gapMag: r2(gapMag), pct: null, good: inside, atTarget: inside, label,
      remainText: inside ? T('Hedef aralığın içinde', 'Within the target range') : T('Aralığa dönmek için ' + F(gapMag) + u + ' gerekli', F(gapMag) + u + ' needed to return to the range'),
      kpiGapText: inside
        ? T('Aralık içinde (', 'Within range (') + F(lo) + '–' + F(high) + u + ') ✓'
        : T('Aralık dışı: ', 'Out of range: ') + (diff > 0 ? '+' : '') + F(r2(diff)) + u + T(' (aralık ', ' (range ') + F(lo) + '–' + F(high) + ')',
      zeroTargetNote: '', direction
    };
  }

  const diff = r2(actual - target);
  const gapMag = Math.abs(diff);
  const atTarget = diff === 0;
  // düşük iyi: actual > target kötü; yüksek iyi: actual < target kötü
  const good = atTarget ? true : (direction === 'dusuk' ? diff < 0 : diff > 0);
  const pct = target === 0 ? null : Math.round(Math.abs(diff) / Math.abs(target) * 1000) / 10;
  const zeroTargetNote = target === 0 ? T('Hedef 0 olduğu için yüzdesel sapma hesaplanmaz; sayısal fark esas alınır.', 'Because the target is 0, no percentage is calculated; the numeric difference is used.') : '';
  const label = atTarget ? T('hedefte', 'on target') : (good ? T('olumlu sapma', 'favorable deviation') : T('olumsuz sapma', 'unfavorable deviation'));
  const remainText = atTarget
    ? T('Hedefe ulaşıldı', 'Target reached')
    : (good ? T('Hedefin ' + F(gapMag) + u + ' iyisinde', F(gapMag) + u + ' better than target') : T('Hedefe kalan: ', 'Remaining to target: ') + F(gapMag) + u);
  const kpiGapText = T('Sapma: ', 'Gap: ') + (diff > 0 ? '+' : '') + F(diff) + u
    + (pct !== null ? ' (' + pctF(pct) + ')' : '')
    + ' · ' + label;
  return { hasGap: true, diff, gapMag: r2(gapMag), pct, good, atTarget, label, remainText, kpiGapText, zeroTargetNote, direction };
}

function r2(v) { return Math.round(v * 100) / 100; }
function fmt(v) { return String(r2(v)).replace('.', ','); }

/** Adım 1 canlı kalite çipleri (sezgisel kontroller — kesin hüküm değildir). */
export function statementChecks(problem, lang) {
  const en = lang === 'en';
  const T = (tr, e) => (en ? e : tr);
  const s = problem.statement || '';
  const mk = (ok, okText, badText) => ({
    text: ok ? okText : badText,
    icon: ok ? '✓' : '!',
    color: ok ? 'var(--ok-ink)' : 'var(--warn-ink)',
    bg: ok ? 'var(--ok-soft)' : 'var(--warn-soft)',
    border: ok ? 'var(--ok-border)' : 'var(--warn-border)'
  });
  // Sezgisel kalıplar dile göre seçilir; ifade hangi dilde yazılırsa yazılsın iki kalıp da taranır.
  const solutionRe = /(malıyız|meliyiz|yapılmalı|kurulmalı|alınmalı|gerekiyor|gereklidir|ihtiyaç var|çözüm|önerisi|should|we must|we need to|solution|recommend)/i;
  const causeRe = /(çünkü|nedeniyle|sebebiyle|kaynaklı|yüzünden|dolayısıyla|dan dolayı|den dolayı|because|due to|caused by|as a result of)/i;
  return [
    mk(/\d/.test(s), T('Sayısal / ölçülebilir ifade var', 'Contains a numeric / measurable statement'), T('Sayı yok — sapmayı ölçülebilir yazın (hedef vs gerçekleşen)', 'No numbers — state the gap measurably (target vs actual)')),
    mk(!solutionRe.test(s), T('Çözüm dili içermiyor', 'No solution language'), T('Çözüm dili içeriyor olabilir — "ne yapılmalı" değil "ne oldu" yazın', 'May contain solution language — write "what happened", not "what should be done"')),
    mk(!causeRe.test(s), T('Neden / suçlama içermiyor', 'No cause / blame language'), T('Neden dili içeriyor olabilir — nedenler 5. adımın işidir', 'May contain cause language — causes belong to step 5')),
    mk(s.trim().length >= 40, T('Yeterince spesifik görünüyor', 'Looks specific enough'), T('Çok kısa — ne, nerede, ne kadar sapma olduğunu ekleyin', 'Too short — add what, where, and how large the deviation is')),
    mk(!!((problem.target || '').toString().trim() && (problem.actual || '').toString().trim()), T('Hedef ve gerçekleşen girildi', 'Target and actual entered'), T('Hedef ve gerçekleşen değerleri aşağıya girin', 'Enter the target and actual values below'))
  ];
}

/**
 * Adım 4 Pareto — KPI sapmasına göre.
 * Payda olarak KPI sapma büyüklüğü kullanılır (varsa); bulguların kendi içindeki
 * dağılımı ayrıca verilir. Katkılar KPI ile AYNI BİRİMDE girilmelidir.
 * Döndürür null (çizilecek veri yok) ya da:
 * { mode:'kpi'|'internal', unit, gap|null, explained, explainedPct|null, unexplained|null,
 *   unexplainedPct|null, overflow (0 ya da aşan miktar), bars:[{i,label,text,v,pctOfGap|null,pctInternal,cumInternal,w}],
 *   vital:[labels], vitalPct }
 */
export function paretoData(c, lang) {
  const fb = lang === 'en' ? 'F' : 'B';
  const rows = (c.findings || [])
    .map((f, i) => ({ i, label: fb + (i + 1), text: f.text || '', v: num(f.share) }))
    .filter(r => r.v !== null && r.v > 0);
  if (rows.length < 2) return null;

  rows.sort((a, b) => b.v - a.v);
  const explained = r2(rows.reduce((a, r) => a + r.v, 0));
  const g = gapInfo((c || {}).problem || {});
  const gap = g.hasGap && g.gapMag > 0 ? g.gapMag : null;
  const mode = gap !== null ? 'kpi' : 'internal';
  const unit = ((c.problem || {}).unit || '').trim();

  let cum = 0;
  const maxV = rows[0].v;
  const denomForBars = mode === 'kpi' ? Math.max(gap, explained) : explained;
  const bars = rows.map(r => {
    cum += r.v;
    return {
      ...r,
      pctOfGap: mode === 'kpi' ? Math.round(r.v / gap * 100) : null,
      pctInternal: Math.round(r.v / explained * 100),
      cumInternal: Math.round(cum / explained * 100),
      w: Math.max(3, Math.round(r.v / denomForBars * 100))
    };
  });

  const vital = [];
  for (const b of bars) { vital.push(b.label); if (b.cumInternal >= 80) break; }
  const vitalPct = bars[vital.length - 1].cumInternal;

  if (mode === 'internal') {
    return { mode, unit, gap: null, explained, explainedPct: null, unexplained: null, unexplainedPct: null, overflow: 0, bars, vital, vitalPct };
  }

  const overflow = explained > gap * 1.001 ? r2(explained - gap) : 0;
  const unexplained = overflow > 0 ? 0 : r2(Math.max(0, gap - explained));
  return {
    mode, unit, gap,
    explained,
    explainedPct: Math.min(100, Math.round(explained / gap * 100)),
    unexplained,
    unexplainedPct: overflow > 0 ? 0 : Math.round(unexplained / gap * 100),
    overflow,
    bars, vital, vitalPct
  };
}

/**
 * Ağırlıklı karar matrisi — geçerlilik, fark, en etkili kriter ve hassasiyet analiziyle.
 * valid: ağırlık toplamı tam 100 (±0,01). Geçersizken puanlar "taslak" sayılır.
 */
export function decisionMatrix(c, lang) {
  const en = lang === 'en';
  const altFallback = i => (en ? 'Alternative ' : 'Alternatif ') + i;
  const critFallback = i => (en ? 'Criterion ' : 'Kriter ') + i;
  const criteria = c.criteria || [];
  const alts = c.alternatives || [];
  const weights = criteria.map(cr => num(cr.weight) ?? 0);
  const wsum = r2(weights.reduce((a, w) => a + w, 0));
  const valid = Math.abs(wsum - 100) < 0.01;
  const wDelta = r2(100 - wsum); // + eksik, - fazla

  const scoreOf = (ai, ci) => num((c.scores || {})[ai + '_' + ci]);

  const rows = alts.map((al, ai) => {
    let tot = 0;
    const cells = criteria.map((cr, ci) => {
      const key = ai + '_' + ci;
      const v = (c.scores || {})[key] ?? '';
      tot += (num(v) ?? 0) * (weights[ci] || 0);
      return { key, value: v };
    });
    return {
      n: String(ai + 1),
      name: al.name || altFallback(ai + 1),
      cells,
      raw: wsum > 0 ? tot / wsum : -1,
      total: wsum > 0 ? (tot / wsum).toFixed(2) : '—'
    };
  });

  const ranked = rows.filter(r => r.raw >= 0).slice().sort((a, b) => b.raw - a.raw);
  const best = ranked.length && ranked[0].raw > 0 ? ranked[0] : null;
  const second = ranked.length > 1 ? ranked[1] : null;
  const lead = best && second ? r2(best.raw - second.raw) : null;

  // En etkili kriter: kazananın ikinciye üstünlüğüne en çok katkı yapan kriter
  let influential = null;
  if (best && second && valid) {
    let bestContrib = -Infinity;
    criteria.forEach((cr, ci) => {
      const sW = scoreOf(Number(best.n) - 1, ci) ?? 0;
      const sS = scoreOf(Number(second.n) - 1, ci) ?? 0;
      const contrib = (weights[ci] || 0) * (sW - sS) / 100;
      if (contrib > bestContrib) { bestContrib = contrib; influential = { name: cr.name || critFallback(ci + 1), contrib: r2(contrib) }; }
    });
  }

  // Hassasiyet: bir kriter tamamen çıkarılınca (ağırlığı 0) kazanan değişiyor mu?
  const sensitivity = [];
  if (best && valid && criteria.length > 1) {
    criteria.forEach((cr, ci) => {
      const wRest = wsum - (weights[ci] || 0);
      if (wRest <= 0) return;
      let newBest = null, newBestVal = -Infinity;
      alts.forEach((al, ai) => {
        let t = 0;
        criteria.forEach((cr2, cj) => { if (cj !== ci) t += (scoreOf(ai, cj) ?? 0) * (weights[cj] || 0); });
        const v = t / wRest;
        if (v > newBestVal) { newBestVal = v; newBest = ai + 1; }
      });
      if (newBest !== null && String(newBest) !== best.n) {
        sensitivity.push({ name: cr.name || critFallback(ci + 1), newWinner: 'A' + newBest });
      }
    });
  }

  return {
    wsum, valid, wDelta, rows, best, second, lead, influential, sensitivity, ranked,
    head: criteria.map(cr => ({ name: cr.name || '—', weight: cr.weight || '0', yon: cr.yon || 'yuksek' }))
  };
}

/** Kök neden doğrulama durumları — sıra olgunluk sırasıdır. */
export const RC_STATUSES = [
  { key: 'hipotez', label: 'Hipotez', tone: 'warn' },
  { key: 'destekleniyor', label: 'Veriyle destekleniyor', tone: 'pri' },
  { key: 'test-planlandi', label: 'Test planlandı', tone: 'pri' },
  { key: 'test-edildi', label: 'Test edildi', tone: 'pri' },
  { key: 'dogrulandi', label: 'Doğrulandı', tone: 'ok' },
  { key: 'elendi', label: 'Elendi', tone: 'muted' }
];

export const RC_STATUSES_EN = [
  { key: 'hipotez', label: 'Hypothesis', tone: 'warn' },
  { key: 'destekleniyor', label: 'Supported by data', tone: 'pri' },
  { key: 'test-planlandi', label: 'Test planned', tone: 'pri' },
  { key: 'test-edildi', label: 'Tested', tone: 'pri' },
  { key: 'dogrulandi', label: 'Verified', tone: 'ok' },
  { key: 'elendi', label: 'Eliminated', tone: 'muted' }
];

export const rcStatusesFor = lang => (lang === 'en' ? RC_STATUSES_EN : RC_STATUSES);

export function rcStatusMeta(status, lang) {
  const list = rcStatusesFor(lang);
  return list.find(s => s.key === status) || list[0];
}

/**
 * Uçtan uca izlenebilirlik: bulgu → kök neden → karar → aksiyon → KPI.
 * rows: bulgu satırları; issues: yapısal kopukluklar (denetimde ve Adım 8'de gösterilir).
 */
export function traceability(c, lang) {
  const en = lang === 'en';
  const FB = en ? 'F' : 'B';
  const RC = en ? 'RC' : 'KN';
  const findings = (c.findings || []);
  const rcs = (c.rootCauses || []);
  const actions = (c.actions || []).filter(a => (a.text || '').trim());
  const decisionSet = !!((c.decision || {}).choice || '').trim();
  const tracking = (c.tracking || []).filter(t => num(t.value) !== null);

  const rcOfFinding = fi => rcs.map((rc, ri) => ({ rc, ri })).filter(x => (x.rc.findings || []).includes(fi));
  const actionsOfRc = ri => actions.filter(a => String(a.rcIdx) === String(ri));

  const rows = findings.map((f, fi) => {
    const linkedRcs = rcOfFinding(fi);
    return {
      finding: FB + (fi + 1),
      findingText: f.text || '',
      rcs: linkedRcs.map(x => RC + (x.ri + 1)),
      actions: linkedRcs.flatMap(x => actionsOfRc(x.ri)).map(a => a.text),
      hasDecision: decisionSet,
      kpiTracked: tracking.length > 0
    };
  });

  const issues = [];
  findings.forEach((f, fi) => {
    // Katkısı açıkça 0 girilen bulgu ("sapma yok") kök neden gerektirmez.
    const noContribution = num(f.share) === 0;
    if ((f.text || '').trim() && !noContribution && rcOfFinding(fi).length === 0) {
      issues.push({ type: 'bulgu-koksuz', ref: FB + (fi + 1), text: en ? FB + (fi + 1) + ' is not linked to any root cause' : 'B' + (fi + 1) + ' hiçbir kök nedene bağlanmamış' });
    }
  });
  rcs.forEach((rc, ri) => {
    if (!(rc.text || '').trim()) return;
    if (!(rc.findings || []).length) {
      issues.push({ type: 'kok-bulgusuz', ref: RC + (ri + 1), text: en ? RC + (ri + 1) + ' is not supported by any finding' : 'KN' + (ri + 1) + ' hiçbir bulguyla desteklenmiyor' });
    }
    if (rc.status !== 'elendi' && actionsOfRc(ri).length === 0) {
      issues.push({ type: 'kok-onlemsiz', ref: RC + (ri + 1), text: en ? 'No countermeasure/action defined for ' + RC + (ri + 1) : 'KN' + (ri + 1) + ' için karşı önlem/aksiyon tanımlanmamış' });
    }
  });
  if (decisionSet && actions.length === 0) {
    issues.push({ type: 'karar-aksiyonsuz', ref: en ? 'Decision' : 'Karar', text: en ? 'A decision is written but has not turned into any action' : 'Karar yazılmış ama hiçbir aksiyona dönüşmemiş' });
  }
  actions.forEach((a, i) => {
    if (!(a.owner || '').trim() || !((a.dueDate || a.due || '') + '').trim()) {
      issues.push({
        type: 'aksiyon-eksik',
        ref: 'A' + (i + 1) + (en ? ' (action)' : ' (aksiyon)'),
        text: en
          ? 'Action ' + (i + 1) + ' has no ' + (!(a.owner || '').trim() ? 'owner' : 'due date')
          : (i + 1) + '. aksiyonun ' + (!(a.owner || '').trim() ? 'sorumlusu' : 'termin tarihi') + ' yok'
      });
    }
  });
  if (decisionSet && tracking.length === 0) {
    issues.push({ type: 'kpi-dogrulamasiz', ref: 'KPI', text: en ? 'A decision was made but the countermeasure is not yet verified with KPI measurements (Step 7)' : 'Karar verilmiş ama karşı önlem henüz KPI ölçümüyle doğrulanmıyor (Adım 7)' });
  }

  return { rows, issues };
}

/** Termin geçmiş ve tamamlanmamış aksiyon mu? (bugün = dışarıdan verilebilir, test için) */
export function isOverdue(action, today) {
  const dd = (action.dueDate || '').trim();
  if (!dd || action.status === 'tamam') return false;
  const t = today || new Date().toISOString().slice(0, 10);
  return dd < t;
}

/** Çalışma olgunluğu — alan doluluğu değil, metodolojik durum. */
export function caseMaturity(c, lang) {
  const en = lang === 'en';
  const T = (tr, e) => (en ? e : tr);
  const g = gapInfo(c.problem || {});
  const tracking = (c.tracking || []).map(t => num(t.value)).filter(v => v !== null);
  const rcs = (c.rootCauses || []).filter(r => (r.text || '').trim());
  const findings = (c.findings || []).filter(f => (f.text || '').trim());
  const actions = (c.actions || []).filter(a => (a.text || '').trim());
  const decisionSet = !!((c.decision || {}).choice || '').trim();

  if (!((c.problem || {}).statement || '').trim()) return { key: 'bos', label: T('Boş', 'Empty') };

  // KPI ile doğrulandı: son ölçüm hedefi karşılıyor + retrospektif dolu
  if (tracking.length && g.hasGap) {
    const last = tracking[tracking.length - 1];
    const dir = g.direction;
    const t = num((c.problem || {}).target);
    let met = false;
    if (dir === 'dusuk') met = last <= t;
    else if (dir === 'yuksek') met = last >= t;
    else if (dir === 'aralik') {
      const hi = num((c.problem || {}).targetHigh);
      if (hi !== null) { const lo = Math.min(t, hi), h = Math.max(t, hi); met = last >= lo && last <= h; }
    }
    const retroDone = Object.values(c.retro || {}).some(v => (v || '').trim());
    if (met && retroDone) return { key: 'dogrulandi', label: T('KPI ile doğrulandı', 'Verified with KPI') };
  }

  if (decisionSet && actions.length) {
    return tracking.length
      ? { key: 'izleme', label: T('İzleme devam ediyor', 'Tracking in progress') }
      : { key: 'uygulama', label: T('Uygulamada', 'In implementation') };
  }

  const anyValidated = rcs.some(r => r.status === 'dogrulandi' || r.status === 'destekleniyor');
  if (rcs.length && anyValidated) return { key: 'analiz', label: T('Analiz tamam', 'Analysis complete') };

  const evidenceMissing = findings.some(f => !(f.evidence || '').trim())
    || findings.some(f => f.src === 'yz' && !f.verified)
    || (rcs.length > 0 && !anyValidated);
  if (findings.length || rcs.length) {
    return evidenceMissing ? { key: 'kanit', label: T('Kanıt bekliyor', 'Awaiting evidence') } : { key: 'analiz', label: T('Analiz tamam', 'Analysis complete') };
  }

  return { key: 'taslak', label: T('Taslak', 'Draft') };
}

/** Adım başına tamamlanma ölçütü ve eksik listesi (başlık özeti + navigasyon ipuçları). */
export function stepChecklist(c, step, lang) {
  const en = lang === 'en';
  const T = (tr, e) => (en ? e : tr);
  const g = gapInfo(c.problem || {});
  const items = [];
  const add = (label, ok) => items.push({ label, ok: !!ok });
  if (step === 1) {
    add(T('Problem ifadesi yazıldı', 'Problem statement written'), ((c.problem || {}).statement || '').trim());
    add(T('Hedef ve gerçekleşen girildi', 'Target and actual entered'), g.hasGap);
    add(T('KPI yönü seçildi', 'KPI direction selected'), ((c.problem || {}).direction || '') !== '');
  } else if (step === 2) {
    add(T('En az 2 iş sürücüsü tanımlandı', 'At least 2 business drivers defined'), (c.drivers || []).filter(d => (d.name || '').trim()).length >= 2);
    add(T('YZ önerileri doğrulandı', 'AI suggestions verified'), !(c.drivers || []).some(d => d.src === 'yz' && !d.verified));
  } else if (step === 3) {
    add(T('En az 1 alt bileşen analizi yapıldı', 'At least 1 subcomponent analyzed'), (c.driverAnalysis || []).some(d => (d.component || '').trim()));
  } else if (step === 4) {
    const f = (c.findings || []).filter(x => (x.text || '').trim());
    add(T('En az 1 ölçülmüş bulgu var', 'At least 1 measured finding'), f.length >= 1);
    add(T('Her bulgunun kanıt kaynağı var', 'Every finding has an evidence source'), f.length > 0 && f.every(x => (x.evidence || '').trim()));
    add(T('Sapmaya katkılar girildi (Pareto)', 'Contributions to the gap entered (Pareto)'), !!paretoData(c));
  } else if (step === 5) {
    const rcs = (c.rootCauses || []).filter(r => (r.text || '').trim());
    add(T('En az 1 kök neden yazıldı', 'At least 1 root cause written'), rcs.length >= 1);
    add(T('Kök nedenler bulgulara bağlandı', 'Root causes linked to findings'), rcs.length > 0 && rcs.every(r => (r.findings || []).length));
    add(T('En az biri veriyle destekleniyor/doğrulandı', 'At least one supported by data / verified'), rcs.some(r => ['destekleniyor', 'test-edildi', 'dogrulandi'].includes(r.status)));
  } else if (step === 6) {
    const M = decisionMatrix(c);
    add(T('En az 2 alternatif üretildi', 'At least 2 alternatives generated'), (c.alternatives || []).filter(a => (a.name || '').trim()).length >= 2);
    add(T('Kriter ağırlıkları %100', 'Criterion weights sum to 100%'), M.valid);
    add(T('Karar ve gerekçesi yazıldı', 'Decision and rationale written'), ((c.decision || {}).choice || '').trim() && ((c.decision || {}).rationale || '').trim());
  } else if (step === 7) {
    add(T('Aksiyon durumları işaretlendi', 'Action statuses marked'), (c.actions || []).some(a => a.status));
    add(T('En az 1 KPI ölçümü girildi', 'At least 1 KPI measurement entered'), (c.tracking || []).some(t => num(t.value) !== null));
    add(T('Retrospektif yazıldı', 'Retrospective written'), Object.values(c.retro || {}).some(v => (v || '').trim()));
  } else {
    add(T('İzlenebilirlik sorunları giderildi', 'Traceability issues resolved'), traceability(c).issues.length === 0);
  }
  return { items, missing: items.filter(i => !i.ok).length };
}

/**
 * Analiz güven seviyesi — bilimsel doğruluk DEĞİL, çalışma bütünlüğü göstergesi.
 * Beş kontrol, her biri 0-1; sonuç 0-100.
 */
export function confidenceScore(c, lang) {
  const en = lang === 'en';
  const T = (tr, e) => (en ? e : tr);
  const findings = (c.findings || []).filter(f => (f.text || '').trim());
  const rcs = (c.rootCauses || []).filter(r => (r.text || '').trim());
  const checks = [];

  const withEvidence = findings.filter(f => (f.evidence || '').trim()).length;
  checks.push({ label: T('Bulguların veri kaynağı var', 'Findings have data sources'), score: findings.length ? withEvidence / findings.length : 0 });

  const p = paretoData(c);
  checks.push({ label: T('KPI sapmasının açıklanan bölümü', 'Explained share of the KPI gap'), score: p && p.mode === 'kpi' ? Math.min(1, p.explained / p.gap) : 0 });

  const tested = rcs.filter(r => ['test-edildi', 'dogrulandi'].includes(r.status)).length;
  checks.push({ label: T('Kök nedenler test edildi', 'Root causes tested'), score: rcs.length ? tested / rcs.length : 0 });

  const acts = (c.actions || []).filter(a => (a.text || '').trim());
  const linked = acts.filter(a => String(a.rcIdx ?? '') !== '').length;
  checks.push({ label: T('Aksiyonlar kök nedenlere bağlı', 'Actions linked to root causes'), score: acts.length ? linked / acts.length : 0 });

  const m = caseMaturity(c);
  checks.push({ label: T('Sonuç KPI ile doğrulandı', 'Outcome verified with KPI'), score: m.key === 'dogrulandi' ? 1 : ((c.tracking || []).length ? 0.5 : 0) });

  const total = Math.round(checks.reduce((a, ch) => a + ch.score, 0) / checks.length * 100);
  const label = total >= 80 ? T('Yüksek bütünlük', 'High integrity') : total >= 50 ? T('Orta bütünlük', 'Medium integrity') : T('Erken aşama', 'Early stage');
  return { total, label, checks: checks.map(ch => ({ label: ch.label, pct: Math.round(ch.score * 100) })) };
}

/** Adım 7 KPI trend çubukları — yöne duyarlı. */
export function trackingBars(c) {
  const g = gapInfo(c.problem || {});
  const rows = (c.tracking || []).map(x => ({ label: x.label || '—', v: num(x.value) })).filter(x => x.v !== null);
  if (!rows.length) return [];
  const t = num((c.problem || {}).target);
  const hi = num((c.problem || {}).targetHigh);
  const max = Math.max(...rows.map(x => Math.abs(x.v)), t !== null ? Math.abs(t) : 0) * 1.15 || 1;
  return rows.map(x => {
    let ok = false;
    if (t !== null) {
      if (g.direction === 'dusuk') ok = x.v <= t;
      else if (g.direction === 'yuksek') ok = x.v >= t;
      else if (g.direction === 'aralik' && hi !== null) { const lo = Math.min(t, hi), h = Math.max(t, hi); ok = x.v >= lo && x.v <= h; }
    }
    return { label: x.label, value: String(x.v), h: Math.max(8, Math.round(Math.abs(x.v) / max * 110)) + 'px', bg: ok ? 'var(--ok)' : 'var(--pri-bar)' };
  });
}

export function trackingGapText(c, lang) {
  const en = lang === 'en';
  const T = (tr, e) => (en ? e : tr);
  const g = gapInfo(c.problem || {});
  const rows = (c.tracking || []).map(x => num(x.value)).filter(v => v !== null);
  if (!rows.length || !g.hasGap) return '';
  const last = rows[rows.length - 1];
  const virt = gapInfo({ ...(c.problem || {}), actual: String(last) }, lang);
  if (virt.atTarget || virt.good) return T('Son ölçüm: ', 'Last measurement: ') + last + ' · ' + (virt.atTarget ? T('Hedefe ulaşıldı 🎯', 'Target reached 🎯') : T('Hedefin iyi tarafında ✓', 'On the good side of target ✓'));
  return T('Son ölçüm: ', 'Last measurement: ') + last + ' · ' + virt.remainText;
}

/** Adım 2 iş sürücüsü haritası: KPI → sürücü → (Adım 3'ten) alt bileşen ağacı. */
export function driverMap(c) {
  return (c.drivers || []).filter(d => (d.name || '').trim()).map(d => {
    const subs = (c.driverAnalysis || [])
      .filter(a => (a.driver || '').trim() && (d.name || '').toLowerCase().indexOf(a.driver.trim().toLowerCase().slice(0, 12)) >= 0)
      .map(a => a.component).filter(Boolean);
    return { name: d.name, sub: subs.join(' · '), hasSub: !!subs.length };
  });
}
