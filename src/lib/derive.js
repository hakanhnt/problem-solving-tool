// Girdilerden türetilen değerler: KPI farkı, ifade kalite kontrolü, karar matrisi.

export function gapInfo(problem) {
  const target = parseFloat(problem.target), actual = parseFloat(problem.actual);
  const hasGap = isFinite(target) && isFinite(actual) && target !== 0;
  const gap = hasGap ? actual - target : 0;
  const kpiGapText = hasGap
    ? 'Sapma: ' + (gap > 0 ? '+' : '') + (Math.round(gap * 100) / 100) + ' (%' + Math.round(Math.abs(gap) / target * 100) + ')'
    : '';
  return { hasGap, gap, kpiGapText };
}

/** Adım 1 canlı kalite çipleri (sezgisel kontroller — kesin hüküm değildir). */
export function statementChecks(problem) {
  const s = problem.statement || '';
  const mk = (ok, okText, badText) => ({
    text: ok ? okText : badText,
    icon: ok ? '✓' : '!',
    color: ok ? '#3d5a3d' : '#8c6a35',
    bg: ok ? '#eef4ee' : '#faf3e3',
    border: ok ? '#cfe0cf' : '#eaddb8'
  });
  return [
    mk(/\d/.test(s), 'Sayısal / ölçülebilir ifade var', 'Sayı yok — sapmayı ölçülebilir yazın (hedef vs gerçekleşen)'),
    mk(!/(malıyız|meliyiz|yapılmalı|kurulmalı|alınmalı|gerekiyor|gereklidir|ihtiyaç var|çözüm|önerisi)/i.test(s), 'Çözüm dili içermiyor', 'Çözüm dili içeriyor olabilir — "ne yapılmalı" değil "ne oldu" yazın'),
    mk(!/(çünkü|nedeniyle|sebebiyle|kaynaklı|yüzünden|dolayısıyla|dan dolayı|den dolayı)/i.test(s), 'Neden / suçlama içermiyor', 'Neden dili içeriyor olabilir — nedenler 5. adımın işidir'),
    mk(s.trim().length >= 40, 'Yeterince spesifik görünüyor', 'Çok kısa — ne, nerede, ne kadar sapma olduğunu ekleyin'),
    mk(!!((problem.target || '').trim() && (problem.actual || '').trim()), 'Hedef ve gerçekleşen girildi', 'Hedef ve gerçekleşen değerleri aşağıya girin')
  ];
}

/** Ağırlıklı karar matrisi: satır toplamları ve en yüksek puanlı alternatif. */
export function decisionMatrix(c) {
  const wsum = c.criteria.reduce((a, cr) => a + (parseFloat(cr.weight) || 0), 0);
  const rows = c.alternatives.map((al, ai) => {
    let tot = 0;
    const cells = c.criteria.map((cr, ci) => {
      const key = ai + '_' + ci;
      const v = c.scores[key] ?? '';
      tot += (parseFloat(v) || 0) * (parseFloat(cr.weight) || 0);
      return { key, value: v };
    });
    return {
      n: String(ai + 1),
      name: al.name || 'Alternatif ' + (ai + 1),
      cells,
      total: wsum > 0 ? (tot / wsum).toFixed(2) : '—',
      raw: wsum > 0 ? tot / wsum : -1
    };
  });
  let best = null;
  rows.forEach(r => { if (r.raw > 0 && (!best || r.raw > best.raw)) best = r; });
  return { wsum, rows, best, head: c.criteria.map(cr => ({ name: cr.name || '—', weight: cr.weight || '0' })) };
}

/** Adım 7 KPI trend çubukları. */
export function trackingBars(c) {
  const t = parseFloat(c.problem.target);
  const rows = (c.tracking || []).map(x => ({ label: x.label || '—', v: parseFloat(x.value) })).filter(x => isFinite(x.v));
  if (!rows.length) return [];
  const start = parseFloat(c.problem.actual);
  const lowerBetter = isFinite(t) && isFinite(start) ? start > t : true;
  const max = Math.max(...rows.map(x => x.v), isFinite(t) ? t : 0) * 1.15 || 1;
  return rows.map(x => {
    const ok = isFinite(t) ? (lowerBetter ? x.v <= t : x.v >= t) : false;
    return { label: x.label, value: String(x.v), h: Math.max(8, Math.round(x.v / max * 110)) + 'px', bg: ok ? '#4a6741' : '#8fb0d4' };
  });
}

export function trackingGapText(c) {
  const t = parseFloat(c.problem.target);
  const rows = (c.tracking || []).map(x => parseFloat(x.value)).filter(v => isFinite(v));
  if (!rows.length || !isFinite(t)) return '';
  const last = rows[rows.length - 1];
  const d = Math.round((last - t) * 100) / 100;
  return d === 0 ? 'Hedefe ulaşıldı 🎯' : 'Son ölçüm: ' + last + ' · Hedefe kalan fark: ' + (d > 0 ? '+' : '') + d;
}

/** Adım 2 driver haritası: KPI → driver → (Adım 3'ten) alt bileşen ağacı. */
export function driverMap(c) {
  return c.drivers.filter(d => (d.name || '').trim()).map(d => {
    const subs = c.driverAnalysis
      .filter(a => (a.driver || '').trim() && (d.name || '').toLowerCase().indexOf(a.driver.trim().toLowerCase().slice(0, 12)) >= 0)
      .map(a => a.component).filter(Boolean);
    return { name: d.name, sub: subs.join(' · '), hasSub: !!subs.length };
  });
}
