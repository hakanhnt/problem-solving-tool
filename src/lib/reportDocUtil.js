// reportDoc.js için saf yardımcılar — Word (.doc) HTML üretimi.
// store.jsx'e (JSX) bağımlı olmamak için burada kalır; node --test ile test edilebilir.

export const FT = 'Helvetica,Arial,sans-serif';
export const hasT = (v) => !!(v || '').toString().trim();
export const esc = (v) =>
  String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Inline stiller — Word'ün sınırlı CSS-class desteği için kritik stiller elemana gömülür.
const TD = `padding:6px 9px;border:1px solid #e3e0da;background:#ffffff;font:12px/1.45 ${FT};color:#26241f;vertical-align:top;`;
const TH = `padding:6px 9px;border:1px solid #e3e0da;background:#eef2f7;color:#2c4159;font:700 12px/1.45 ${FT};text-align:left;vertical-align:top;`;
const H2 = `font:700 12px ${FT};color:#35506e;letter-spacing:.6px;border-bottom:1px solid #eceae5;padding-bottom:5px;margin:20px 0 8px;`;
export const LBL = `font:600 11px ${FT};color:#57534b;letter-spacing:.4px;margin:10px 0 6px;`;
export const BOX = `border:1px solid #e8e5df;background:#fbfaf8;border-radius:8px;padding:10px 13px;margin:8px 0;`;

export const h2 = (s) => `<h2 style="${H2}">${esc(s)}</h2>`;
export const line = (html, extra) => `<div style="font:12.5px/1.55 ${FT};color:#26241f;margin:3px 0;${extra || ''}">${html}</div>`;
export const small = (html, color) => `<div style="font:11.5px/1.5 ${FT};color:${color || '#57534b'};margin:2px 0;">${html}</div>`;

/** headCells: [{html, center?}]; rows: [{bg?, cells:[{html, center?, style?}]}] */
export const table = (headCells, rows) =>
  `<table style="border-collapse:collapse;width:100%;margin:2px 0 8px;"><thead><tr>${
    headCells.map((h) => `<th style="${TH}${h.center ? 'text-align:center;' : ''}">${h.html}</th>`).join('')
  }</tr></thead><tbody>${
    rows.map((r) => `<tr>${
      r.cells.map((cl) => `<td style="${TD}${r.bg ? `background:${r.bg};` : ''}${cl.center ? 'text-align:center;' : ''}${cl.style || ''}">${cl.html}</td>`).join('')
    }</tr>`).join('')
  }</tbody></table>`;

/** Uzantısız dosya adı: şirket → KPI → vaka → 'rapor'. */
export function reportFileName(c, companyName) {
  const base = (companyName || '').trim()
    || ((c.problem || {}).kpiName || '').trim()
    || (c.name || '').trim()
    || 'rapor';
  const slug = base.replace(/[\\/:*?"<>|]+/g, '').trim().replace(/\s+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 60);
  return slug || 'rapor';
}

/** Aksiyon öncelik etiketi — store.jsx prioMeta'nın (JSX'siz) çekirdek mantığı. */
export function prio(a, lang) {
  const T = (tr, en) => (lang === 'en' ? en : tr);
  const MANUAL = { yuksek: T('Yüksek öncelik', 'High priority'), orta: T('Orta öncelik', 'Medium priority'), dusuk: T('Düşük öncelik', 'Low priority') };
  if (a.priority && MANUAL[a.priority]) return { label: MANUAL[a.priority], scored: true };
  const e = parseInt(a.etki, 10) || 0, f = parseInt(a.efor, 10) || 0;
  if (!e || !f) return { label: T('Puanlayın', 'Score it'), scored: false };
  if (e >= 4 && f <= 2) return { label: T('Hızlı kazanım', 'Quick win'), scored: true };
  if (e >= 4) return { label: T('Stratejik', 'Strategic'), scored: true };
  if (f <= 2) return { label: T('Ara kazanım', 'Minor win'), scored: true };
  return { label: T('Sorgulanmalı', 'Question it'), scored: true };
}
