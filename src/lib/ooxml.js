// Minimal WordprocessingML (.docx) üreticisi — gerçek Word belgesi.
// Word, Pages, Google Docs — hepsinde yerel açılır. jszip ile paketlenir (mevcut bağımlılık).
// Ölçüler twip (1/20 punto). Yazı boyutu yarım-punto (21 = 10,5 pt). Renk RRGGBB (# yok).

export const USABLE = 9638; // A4, 2 cm kenar boşluğu → kullanılabilir genişlik (twip)
const FONT = 'Helvetica';

export const xesc = (v) =>
  String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** Metin parçası (run). o: {b,i,color,sz} */
export function run(text, o = {}) {
  const rpr = [`<w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}"/>`];
  if (o.b) rpr.push('<w:b/>');
  if (o.i) rpr.push('<w:i/>');
  if (o.color) rpr.push(`<w:color w:val="${o.color}"/>`);
  if (o.sz) rpr.push(`<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>`);
  return `<w:r><w:rPr>${rpr.join('')}</w:rPr><w:t xml:space="preserve">${xesc(text)}</w:t></w:r>`;
}

/** Paragraf. runsXml: run() çıktıları. o: {sz,before,after,align,shd,keepNext,bottomBorder,ind} */
export function para(runsXml, o = {}) {
  const ppr = [];
  ppr.push(`<w:spacing w:before="${o.before != null ? o.before : 0}" w:after="${o.after != null ? o.after : 60}" w:line="264" w:lineRule="auto"/>`);
  if (o.ind) ppr.push(`<w:ind w:left="${o.ind}"/>`);
  if (o.align) ppr.push(`<w:jc w:val="${o.align}"/>`);
  if (o.keepNext) ppr.push('<w:keepNext/>');
  if (o.shd) ppr.push(`<w:shd w:val="clear" w:color="auto" w:fill="${o.shd}"/>`);
  if (o.bottomBorder) ppr.push(`<w:pBdr><w:bottom w:val="single" w:sz="${o.bottomBorder.sz || 6}" w:space="2" w:color="${o.bottomBorder.color || 'CCCCCC'}"/></w:pBdr>`);
  return `<w:p><w:pPr>${ppr.join('')}</w:pPr>${runsXml || ''}</w:p>`;
}

/** Kısa yol: tek run'lık paragraf. */
export const textPara = (s, ro = {}, po = {}) => para(run(s, ro), po);

const EMPTY_P = '<w:p/>';
const endsWithP = (xml) => /<\/w:p>\s*$/.test(xml) || xml === EMPTY_P;

/** Tablo hücresi. wTwips: genişlik. o: {shd, valign, borders(false=yok)} */
export function tc(contentXml, wTwips, o = {}) {
  const tcpr = [`<w:tcW w:w="${Math.round(wTwips)}" w:type="dxa"/>`];
  if (o.shd) tcpr.push(`<w:shd w:val="clear" w:color="auto" w:fill="${o.shd}"/>`);
  tcpr.push(`<w:vAlign w:val="${o.valign || 'top'}"/>`);
  tcpr.push('<w:tcMar><w:top w:w="40"/><w:left w:w="90"/><w:bottom w:w="40"/><w:right w:w="90"/></w:tcMar>');
  let content = contentXml || EMPTY_P;
  if (!endsWithP(content)) content += EMPTY_P; // tc son çocuğu w:p olmalı
  return `<w:tc><w:tcPr>${tcpr.join('')}</w:tcPr>${content}</w:tc>`;
}

/** Satır. o: {height (exact twip)} */
export function tr(cellsXml, o = {}) {
  const trpr = o.height ? `<w:trPr><w:trHeight w:val="${o.height}" w:hRule="exact"/></w:trPr>` : '';
  return `<w:tr>${trpr}${cellsXml}</w:tr>`;
}

const borderEdges = (sz, color) =>
  ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
    .map((e) => `<w:${e} w:val="single" w:sz="${sz}" w:space="0" w:color="${color}"/>`).join('');

/** Tablo. colW: sütun genişlikleri (twip). o: {borders:true|false, color} */
export function table(colW, rowsXml, o = {}) {
  const total = colW.reduce((a, b) => a + b, 0);
  const borders = o.borders === false ? '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map((e) => `<w:${e} w:val="none" w:sz="0" w:space="0" w:color="auto"/>`).join('') + '</w:tblBorders>'
    : `<w:tblBorders>${borderEdges(o.sz || 4, o.color || 'E3E0DA')}</w:tblBorders>`;
  const grid = `<w:tblGrid>${colW.map((w) => `<w:gridCol w:w="${Math.round(w)}"/>`).join('')}</w:tblGrid>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="${Math.round(total)}" w:type="dxa"/><w:tblLayout w:type="fixed"/>${borders}<w:tblCellMar><w:left w:w="90"/><w:right w:w="90"/></w:tblCellMar></w:tblPr>${grid}${rowsXml}</w:tbl>`;
}

// Çubuk grafik: rows=[{label(runsXml), pct, color, value(runsXml)}].
// İÇ İÇE TABLO YOK — çubuk, DÜZ tek tablonun içinde SEG segment hücresini gölgeleyerek çizilir
// (Pages/Google Docs iç içe tabloyu metne çevirir; bu yöntem her uygulamada çalışır).
const SEG = 20;
export function barChart(rows) {
  const lw = Math.round(USABLE * 0.34), vw = Math.round(USABLE * 0.18);
  const barTotal = USABLE - lw - vw;
  const segW = Math.floor(barTotal / SEG);
  const cols = [lw].concat(Array.from({ length: SEG }, () => segW)).concat([vw]);
  const body = rows.map((r) => {
    const filled = Math.max(0, Math.min(SEG, Math.round((r.pct || 0) / 100 * SEG)));
    let cells = tc(para(r.label, { after: 20 }), lw, { valign: 'center' });
    for (let i = 0; i < SEG; i++) cells += tc(EMPTY_P, segW, { shd: i < filled ? r.color : 'EFEDEA', valign: 'center' });
    cells += tc(para(r.value || '', { after: 20, align: 'right' }), vw, { valign: 'center' });
    return tr(cells);
  }).join('');
  return table(cols, body, { borders: false });
}

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const CONTENT_TYPES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
  + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
  + '<Default Extension="xml" ContentType="application/xml"/>'
  + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
  + '</Types>';

const RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
  + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
  + '</Relationships>';

const documentXml = (bodyXml) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
  + '<w:body>' + bodyXml
  + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>'
  + '</w:body></w:document>';

/** bodyXml (paragraf/tablo dizisi) → .docx. Tarayıcıda Blob, node'da Buffer döndürür. */
export async function buildDocx(bodyXml) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  zip.file('[Content_Types].xml', CONTENT_TYPES);
  zip.folder('_rels').file('.rels', RELS);
  const w = zip.folder('word');
  w.file('document.xml', documentXml(bodyXml));
  const isNode = typeof window === 'undefined';
  return zip.generateAsync({ type: isNode ? 'nodebuffer' : 'blob', mimeType: DOCX_MIME, compression: 'DEFLATE' });
}
