// Vaka Haritası: vakanın MEVCUT verisinden türetilen bağlantı grafiği.
// Ek veri girişi yoktur — düğümler ve kenarlar kayıtlı ilişkilerden kurulur.
// Katmanlar: KPI → sürücüler → bulgular → kök nedenler → karar → aksiyonlar → izleme.
// Yapısal kopukluklar (izlenebilirlik kurallarının aynısı) düğümde 'orphan' olarak işaretlenir.

import { gapInfo } from './derive.js';

const num = v => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return isFinite(n) ? n : null;
};

export const MAP_COL_W = 196;
export const MAP_ROW_H = 76;
export const MAP_NODE_W = 168;

/**
 * buildCaseMap(c, lang) → { nodes, edges, w, h, cols }
 * node: { id, type, col, row, x, y, label, sub, tone:'pri'|'ok'|'warn'|'alert'|'muted', orphan, step, ref }
 * edge: { from, to, kind:'main'|'soft' }
 */
export function buildCaseMap(c, lang) {
  const en = lang === 'en';
  const T = (tr, e) => (en ? e : tr);
  const FB = en ? 'F' : 'B';
  const RC = en ? 'RC' : 'KN';
  const cut = (s, n) => { const v = (s || '').trim(); return v.length > n ? v.slice(0, n - 1) + '…' : v; };

  const g = gapInfo(c.problem || {}, lang);
  const drivers = (c.drivers || []).map((d, i) => ({ d, i })).filter(x => (x.d.name || '').trim());
  const findings = (c.findings || []).map((f, i) => ({ f, i })).filter(x => (x.f.text || '').trim());
  const rcs = (c.rootCauses || []).map((r, i) => ({ r, i })).filter(x => (x.r.text || '').trim());
  const actions = (c.actions || []).map((a, i) => ({ a, i })).filter(x => (x.a.text || '').trim());
  const decisionSet = !!((c.decision || {}).choice || '').trim();
  const tracking = (c.tracking || []).filter(x => num(x.value) !== null);

  const rcOfFinding = fi => rcs.filter(x => (x.r.findings || []).includes(fi));
  const actionsOfRc = ri => actions.filter(x => String(x.a.rcIdx) === String(ri));

  const nodes = [];
  const edges = [];
  const colRows = {};
  const add = (col, node) => {
    colRows[col] = (colRows[col] || 0);
    const row = colRows[col]++;
    nodes.push({ ...node, col, row, x: col * MAP_COL_W + 14, y: row * MAP_ROW_H + 14 });
    return node.id;
  };

  // 0 — KPI
  add(0, {
    id: 'kpi', type: 'kpi',
    label: (c.problem.kpiName || '').trim() || 'KPI',
    sub: g.hasGap ? g.kpiGapText : T('fark girilmemiş', 'no gap entered'),
    tone: g.hasGap ? (g.good ? 'ok' : 'alert') : 'muted',
    orphan: false, step: 1, ref: 'KPI'
  });

  // 1 — sürücüler
  drivers.forEach(x => {
    const id = 'd' + x.i;
    add(1, { id, type: 'driver', label: 'D' + (x.i + 1) + ' · ' + cut(x.d.name, 42), sub: '', tone: 'pri', orphan: false, step: 2, ref: 'D' + (x.i + 1) });
    edges.push({ from: 'kpi', to: id, kind: 'soft' });
  });

  // 2 — bulgular
  findings.forEach(x => {
    const id = 'f' + x.i;
    const noContribution = num(x.f.share) === 0;
    const orphan = !noContribution && rcOfFinding(x.i).length === 0;
    add(2, {
      id, type: 'finding',
      label: FB + (x.i + 1) + ' · ' + cut(x.f.text, 42),
      sub: noContribution ? T('sapma yok', 'no deviation') : '',
      tone: noContribution ? 'muted' : 'pri', orphan, step: 4, ref: FB + (x.i + 1)
    });
  });

  // 3 — kök nedenler
  rcs.forEach(x => {
    const id = 'r' + x.i;
    const verified = ['dogrulandi', 'test-edildi', 'destekleniyor'].includes(x.r.status || 'hipotez');
    const eliminated = x.r.status === 'elendi';
    const orphan = !(x.r.findings || []).length || (!eliminated && actionsOfRc(x.i).length === 0);
    add(3, {
      id, type: 'rc',
      label: RC + (x.i + 1) + ' · ' + cut(x.r.text, 42),
      sub: eliminated ? T('elendi', 'eliminated') : (verified ? '' : T('hipotez', 'hypothesis')),
      tone: eliminated ? 'muted' : (verified ? 'ok' : 'warn'), orphan, step: 5, ref: RC + (x.i + 1)
    });
    (x.r.findings || []).forEach(fi => {
      if (findings.some(ff => ff.i === fi)) edges.push({ from: 'f' + fi, to: id, kind: 'main' });
    });
  });

  // 4 — karar
  if (decisionSet) {
    add(4, {
      id: 'dec', type: 'decision',
      label: T('Karar', 'Decision'),
      sub: cut(c.decision.choice, 46),
      tone: 'pri', orphan: actions.length === 0, step: 6, ref: T('Karar', 'Decision')
    });
    // Karar, elenmemiş kök nedenleri adresler
    rcs.forEach(x => { if (x.r.status !== 'elendi') edges.push({ from: 'r' + x.i, to: 'dec', kind: 'soft' }); });
  }

  // 5 — aksiyonlar
  actions.forEach(x => {
    const id = 'a' + x.i;
    const done = x.a.status === 'tamam';
    add(5, {
      id, type: 'action',
      label: 'A' + (x.i + 1) + ' · ' + cut(x.a.text, 42),
      sub: done ? '✓' : (x.a.status === 'gecikti' ? '⏰' : ''),
      tone: done ? 'ok' : 'pri',
      orphan: String(x.a.rcIdx ?? '') === '',
      step: 6, ref: 'A' + (x.i + 1)
    });
    if (String(x.a.rcIdx ?? '') !== '' && rcs.some(rr => String(rr.i) === String(x.a.rcIdx))) {
      edges.push({ from: 'r' + x.a.rcIdx, to: id, kind: 'main' });
    } else if (decisionSet) {
      edges.push({ from: 'dec', to: id, kind: 'soft' });
    }
  });

  // 6 — izleme
  if (tracking.length) {
    const last = tracking[tracking.length - 1];
    add(6, {
      id: 'trk', type: 'tracking',
      label: T('KPI İzleme', 'KPI Tracking'),
      sub: T('son ölçüm: ', 'last: ') + last.value + ' (' + tracking.length + T(' ölçüm', ' pts') + ')',
      tone: 'pri', orphan: false, step: 7, ref: T('İzleme', 'Tracking')
    });
    actions.forEach(x => { if (x.a.status === 'tamam' || x.a.status === 'devam') edges.push({ from: 'a' + x.i, to: 'trk', kind: 'soft' }); });
    if (!actions.length) edges.push({ from: 'kpi', to: 'trk', kind: 'soft' });
  }

  const usedCols = Object.keys(colRows).map(Number);
  const maxCol = usedCols.length ? Math.max(...usedCols) : 0;
  const maxRows = Math.max(1, ...Object.values(colRows));
  return {
    nodes, edges,
    w: (maxCol + 1) * MAP_COL_W + 8,
    h: maxRows * MAP_ROW_H + 20,
    orphanCount: nodes.filter(n => n.orphan).length
  };
}
