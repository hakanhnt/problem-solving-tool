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
 * KPI sapması — yöne duyarlı.
 * Döndürür: { hasGap, diff, gapMag, pct|null, good|null, atTarget, label, remainText, kpiGapText, zeroTargetNote, direction }
 * - pct: hedef 0 ise null (yüzde hesabı yapılmaz), aralık modunda null
 * - good: olumlu sapma mı (hedeften iyi tarafta mı)
 */
export function gapInfo(problem) {
  const p = problem || {};
  const target = num(p.target), actual = num(p.actual);
  const direction = effDirection(p);
  const unit = (p.unit || '').trim();
  const u = unit ? ' ' + unit : '';

  const none = { hasGap: false, diff: 0, gapMag: 0, pct: null, good: null, atTarget: false, label: '', remainText: '', kpiGapText: '', zeroTargetNote: '', direction };
  if (target === null || actual === null) return none;

  if (direction === 'aralik') {
    const hi = num(p.targetHigh);
    if (hi === null) return { ...none, hasGap: true, kpiGapText: 'Aralık üst sınırı girilmedi — hedef aralığı tanımlayın', label: 'aralık tanımsız' };
    const lo = Math.min(target, hi), high = Math.max(target, hi);
    const inside = actual >= lo && actual <= high;
    const diff = inside ? 0 : (actual < lo ? actual - lo : actual - high);
    const gapMag = Math.abs(diff);
    const label = inside ? 'aralık içinde (olumlu)' : 'aralık dışında (olumsuz)';
    return {
      hasGap: true, diff: r2(diff), gapMag: r2(gapMag), pct: null, good: inside, atTarget: inside, label,
      remainText: inside ? 'Hedef aralığın içinde' : 'Aralığa dönmek için ' + fmt(gapMag) + u + ' gerekli',
      kpiGapText: inside
        ? 'Aralık içinde (' + fmt(lo) + '–' + fmt(high) + u + ') ✓'
        : 'Aralık dışı: ' + (diff > 0 ? '+' : '') + fmt(r2(diff)) + u + ' (aralık ' + fmt(lo) + '–' + fmt(high) + ')',
      zeroTargetNote: '', direction
    };
  }

  const diff = r2(actual - target);
  const gapMag = Math.abs(diff);
  const atTarget = diff === 0;
  // düşük iyi: actual > target kötü; yüksek iyi: actual < target kötü
  const good = atTarget ? true : (direction === 'dusuk' ? diff < 0 : diff > 0);
  const pct = target === 0 ? null : Math.round(Math.abs(diff) / Math.abs(target) * 1000) / 10;
  const zeroTargetNote = target === 0 ? 'Hedef 0 olduğu için yüzdesel sapma hesaplanmaz; sayısal fark esas alınır.' : '';
  const label = atTarget ? 'hedefte' : (good ? 'olumlu sapma' : 'olumsuz sapma');
  const remainText = atTarget
    ? 'Hedefe ulaşıldı'
    : (good ? 'Hedefin ' + fmt(gapMag) + u + ' iyisinde' : 'Hedefe kalan: ' + fmt(gapMag) + u);
  const kpiGapText = 'Sapma: ' + (diff > 0 ? '+' : '') + fmt(diff) + u
    + (pct !== null ? ' (%' + fmt(pct) + ')' : '')
    + ' · ' + label;
  return { hasGap: true, diff, gapMag: r2(gapMag), pct, good, atTarget, label, remainText, kpiGapText, zeroTargetNote, direction };
}

function r2(v) { return Math.round(v * 100) / 100; }
function fmt(v) { return String(r2(v)).replace('.', ','); }

/** Adım 1 canlı kalite çipleri (sezgisel kontroller — kesin hüküm değildir). */
export function statementChecks(problem) {
  const s = problem.statement || '';
  const mk = (ok, okText, badText) => ({
    text: ok ? okText : badText,
    icon: ok ? '✓' : '!',
    color: ok ? 'var(--ok-ink)' : 'var(--warn-ink)',
    bg: ok ? 'var(--ok-soft)' : 'var(--warn-soft)',
    border: ok ? 'var(--ok-border)' : 'var(--warn-border)'
  });
  return [
    mk(/\d/.test(s), 'Sayısal / ölçülebilir ifade var', 'Sayı yok — sapmayı ölçülebilir yazın (hedef vs gerçekleşen)'),
    mk(!/(malıyız|meliyiz|yapılmalı|kurulmalı|alınmalı|gerekiyor|gereklidir|ihtiyaç var|çözüm|önerisi)/i.test(s), 'Çözüm dili içermiyor', 'Çözüm dili içeriyor olabilir — "ne yapılmalı" değil "ne oldu" yazın'),
    mk(!/(çünkü|nedeniyle|sebebiyle|kaynaklı|yüzünden|dolayısıyla|dan dolayı|den dolayı)/i.test(s), 'Neden / suçlama içermiyor', 'Neden dili içeriyor olabilir — nedenler 5. adımın işidir'),
    mk(s.trim().length >= 40, 'Yeterince spesifik görünüyor', 'Çok kısa — ne, nerede, ne kadar sapma olduğunu ekleyin'),
    mk(!!((problem.target || '').toString().trim() && (problem.actual || '').toString().trim()), 'Hedef ve gerçekleşen girildi', 'Hedef ve gerçekleşen değerleri aşağıya girin')
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
export function paretoData(c) {
  const rows = (c.findings || [])
    .map((f, i) => ({ i, label: 'B' + (i + 1), text: f.text || '', v: num(f.share) }))
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
export function decisionMatrix(c) {
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
      name: al.name || 'Alternatif ' + (ai + 1),
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
      if (contrib > bestContrib) { bestContrib = contrib; influential = { name: cr.name || 'Kriter ' + (ci + 1), contrib: r2(contrib) }; }
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
        sensitivity.push({ name: cr.name || 'Kriter ' + (ci + 1), newWinner: 'A' + newBest });
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

export function rcStatusMeta(status) {
  return RC_STATUSES.find(s => s.key === status) || RC_STATUSES[0];
}

/**
 * Uçtan uca izlenebilirlik: bulgu → kök neden → karar → aksiyon → KPI.
 * rows: bulgu satırları; issues: yapısal kopukluklar (denetimde ve Adım 8'de gösterilir).
 */
export function traceability(c) {
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
      finding: 'B' + (fi + 1),
      findingText: f.text || '',
      rcs: linkedRcs.map(x => 'KN' + (x.ri + 1)),
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
      issues.push({ type: 'bulgu-koksuz', ref: 'B' + (fi + 1), text: 'B' + (fi + 1) + ' hiçbir kök nedene bağlanmamış' });
    }
  });
  rcs.forEach((rc, ri) => {
    if (!(rc.text || '').trim()) return;
    if (!(rc.findings || []).length) {
      issues.push({ type: 'kok-bulgusuz', ref: 'KN' + (ri + 1), text: 'KN' + (ri + 1) + ' hiçbir bulguyla desteklenmiyor' });
    }
    if (rc.status !== 'elendi' && actionsOfRc(ri).length === 0) {
      issues.push({ type: 'kok-onlemsiz', ref: 'KN' + (ri + 1), text: 'KN' + (ri + 1) + ' için karşı önlem/aksiyon tanımlanmamış' });
    }
  });
  if (decisionSet && actions.length === 0) {
    issues.push({ type: 'karar-aksiyonsuz', ref: 'Karar', text: 'Karar yazılmış ama hiçbir aksiyona dönüşmemiş' });
  }
  actions.forEach((a, i) => {
    if (!(a.owner || '').trim() || !((a.dueDate || a.due || '') + '').trim()) {
      issues.push({ type: 'aksiyon-eksik', ref: 'A' + (i + 1) + ' (aksiyon)', text: (i + 1) + '. aksiyonun ' + (!(a.owner || '').trim() ? 'sorumlusu' : 'termin tarihi') + ' yok' });
    }
  });
  if (decisionSet && tracking.length === 0) {
    issues.push({ type: 'kpi-dogrulamasiz', ref: 'KPI', text: 'Karar verilmiş ama karşı önlem henüz KPI ölçümüyle doğrulanmıyor (Adım 7)' });
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
export function caseMaturity(c) {
  const g = gapInfo(c.problem || {});
  const tracking = (c.tracking || []).map(t => num(t.value)).filter(v => v !== null);
  const rcs = (c.rootCauses || []).filter(r => (r.text || '').trim());
  const findings = (c.findings || []).filter(f => (f.text || '').trim());
  const actions = (c.actions || []).filter(a => (a.text || '').trim());
  const decisionSet = !!((c.decision || {}).choice || '').trim();

  if (!((c.problem || {}).statement || '').trim()) return { key: 'bos', label: 'Boş' };

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
    if (met && retroDone) return { key: 'dogrulandi', label: 'KPI ile doğrulandı' };
  }

  if (decisionSet && actions.length) {
    return tracking.length
      ? { key: 'izleme', label: 'İzleme devam ediyor' }
      : { key: 'uygulama', label: 'Uygulamada' };
  }

  const anyValidated = rcs.some(r => r.status === 'dogrulandi' || r.status === 'destekleniyor');
  if (rcs.length && anyValidated) return { key: 'analiz', label: 'Analiz tamam' };

  const evidenceMissing = findings.some(f => !(f.evidence || '').trim())
    || findings.some(f => f.src === 'yz' && !f.verified)
    || (rcs.length > 0 && !anyValidated);
  if (findings.length || rcs.length) {
    return evidenceMissing ? { key: 'kanit', label: 'Kanıt bekliyor' } : { key: 'analiz', label: 'Analiz tamam' };
  }

  return { key: 'taslak', label: 'Taslak' };
}

/** Adım başına tamamlanma ölçütü ve eksik listesi (başlık özeti + navigasyon ipuçları). */
export function stepChecklist(c, step) {
  const g = gapInfo(c.problem || {});
  const items = [];
  const add = (label, ok) => items.push({ label, ok: !!ok });
  if (step === 1) {
    add('Problem ifadesi yazıldı', ((c.problem || {}).statement || '').trim());
    add('Hedef ve gerçekleşen girildi', g.hasGap);
    add('KPI yönü seçildi', ((c.problem || {}).direction || '') !== '');
  } else if (step === 2) {
    add('En az 2 iş sürücüsü tanımlandı', (c.drivers || []).filter(d => (d.name || '').trim()).length >= 2);
    add('YZ önerileri doğrulandı', !(c.drivers || []).some(d => d.src === 'yz' && !d.verified));
  } else if (step === 3) {
    add('En az 1 alt bileşen analizi yapıldı', (c.driverAnalysis || []).some(d => (d.component || '').trim()));
  } else if (step === 4) {
    const f = (c.findings || []).filter(x => (x.text || '').trim());
    add('En az 1 ölçülmüş bulgu var', f.length >= 1);
    add('Her bulgunun kanıt kaynağı var', f.length > 0 && f.every(x => (x.evidence || '').trim()));
    add('Sapmaya katkılar girildi (Pareto)', !!paretoData(c));
  } else if (step === 5) {
    const rcs = (c.rootCauses || []).filter(r => (r.text || '').trim());
    add('En az 1 kök neden yazıldı', rcs.length >= 1);
    add('Kök nedenler bulgulara bağlandı', rcs.length > 0 && rcs.every(r => (r.findings || []).length));
    add('En az biri veriyle destekleniyor/doğrulandı', rcs.some(r => ['destekleniyor', 'test-edildi', 'dogrulandi'].includes(r.status)));
  } else if (step === 6) {
    const M = decisionMatrix(c);
    add('En az 2 alternatif üretildi', (c.alternatives || []).filter(a => (a.name || '').trim()).length >= 2);
    add('Kriter ağırlıkları %100', M.valid);
    add('Karar ve gerekçesi yazıldı', ((c.decision || {}).choice || '').trim() && ((c.decision || {}).rationale || '').trim());
  } else if (step === 7) {
    add('Aksiyon durumları işaretlendi', (c.actions || []).some(a => a.status));
    add('En az 1 KPI ölçümü girildi', (c.tracking || []).some(t => num(t.value) !== null));
    add('Retrospektif yazıldı', Object.values(c.retro || {}).some(v => (v || '').trim()));
  } else {
    add('İzlenebilirlik sorunları giderildi', traceability(c).issues.length === 0);
  }
  return { items, missing: items.filter(i => !i.ok).length };
}

/**
 * Analiz güven seviyesi — bilimsel doğruluk DEĞİL, çalışma bütünlüğü göstergesi.
 * Beş kontrol, her biri 0-1; sonuç 0-100.
 */
export function confidenceScore(c) {
  const findings = (c.findings || []).filter(f => (f.text || '').trim());
  const rcs = (c.rootCauses || []).filter(r => (r.text || '').trim());
  const checks = [];

  const withEvidence = findings.filter(f => (f.evidence || '').trim()).length;
  checks.push({ label: 'Bulguların veri kaynağı var', score: findings.length ? withEvidence / findings.length : 0 });

  const p = paretoData(c);
  checks.push({ label: 'KPI sapmasının açıklanan bölümü', score: p && p.mode === 'kpi' ? Math.min(1, p.explained / p.gap) : 0 });

  const tested = rcs.filter(r => ['test-edildi', 'dogrulandi'].includes(r.status)).length;
  checks.push({ label: 'Kök nedenler test edildi', score: rcs.length ? tested / rcs.length : 0 });

  const acts = (c.actions || []).filter(a => (a.text || '').trim());
  const linked = acts.filter(a => String(a.rcIdx ?? '') !== '').length;
  checks.push({ label: 'Aksiyonlar kök nedenlere bağlı', score: acts.length ? linked / acts.length : 0 });

  const m = caseMaturity(c);
  checks.push({ label: 'Sonuç KPI ile doğrulandı', score: m.key === 'dogrulandi' ? 1 : ((c.tracking || []).length ? 0.5 : 0) });

  const total = Math.round(checks.reduce((a, ch) => a + ch.score, 0) / checks.length * 100);
  const label = total >= 80 ? 'Yüksek bütünlük' : total >= 50 ? 'Orta bütünlük' : 'Erken aşama';
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

export function trackingGapText(c) {
  const g = gapInfo(c.problem || {});
  const rows = (c.tracking || []).map(x => num(x.value)).filter(v => v !== null);
  if (!rows.length || !g.hasGap) return '';
  const last = rows[rows.length - 1];
  const virt = gapInfo({ ...(c.problem || {}), actual: String(last) });
  if (virt.atTarget || virt.good) return 'Son ölçüm: ' + last + ' · ' + (virt.atTarget ? 'Hedefe ulaşıldı 🎯' : 'Hedefin iyi tarafında ✓');
  return 'Son ölçüm: ' + last + ' · ' + virt.remainText;
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
