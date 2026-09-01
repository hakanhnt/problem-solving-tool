// Raporu Word'ün doğrudan açabildiği HTML (.doc) olarak indirir — düzenlenebilir çıktı.
// Rapor renkleri CSS değişkenleriyle tanımlıdır ve Word bunları çözemez; bu yüzden
// dışa aktarmadan önce her öğenin HESAPLANMIŞ stili satır içine yazılır.
// Not: Word esnek kutu (flex) düzenini bilmez — grafik blokları düşey sadeleşir;
// nihai görsel çıktı için PDF, düzenlenebilir metin için Word önerilir.

const PROPS = [
  'color', 'background-color',
  'font-family', 'font-size', 'font-weight', 'font-style',
  'line-height', 'text-align', 'text-decoration-line', 'letter-spacing',
  'white-space', 'vertical-align',
  'border-top', 'border-right', 'border-bottom', 'border-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'border-collapse'
];
const SKIP_VALUES = new Set(['normal', 'none', 'auto', 'rgba(0, 0, 0, 0)', '0px', 'collapse-separate']);

function inlineTree(src, dst) {
  if (src.nodeType !== 1) return;
  const cs = getComputedStyle(src);
  let css = '';
  for (const p of PROPS) {
    const v = cs.getPropertyValue(p);
    if (!v || SKIP_VALUES.has(v)) continue;
    // "0px solid rgb(...)" gibi görünmez kenarlıkları yazma
    if (p.startsWith('border-') && p !== 'border-collapse' && v.startsWith('0px')) continue;
    css += p + ':' + v + ';';
  }
  dst.setAttribute('style', css);
  dst.removeAttribute('class');
  const sk = src.children, dk = dst.children;
  for (let i = 0; i < sk.length; i++) if (dk[i]) inlineTree(sk[i], dk[i]);
}

/** rootEl içeriğini Word HTML zarfına sarıp .doc olarak indirir. */
export function exportReportToWord(rootEl, fileName, title) {
  const clone = rootEl.cloneNode(true);
  inlineTree(rootEl, clone);
  // Etkileşimli öğeler ve Word'ün gösteremediği içerik (SVG, yazdırma dışı bloklar) çıkarılır
  clone.querySelectorAll('[data-noprint], svg, button, input, textarea, select, canvas').forEach(el => el.remove());

  const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" '
    + 'xmlns:w="urn:schemas-microsoft-com:office:word" '
    + 'xmlns="http://www.w3.org/TR/REC-html40">'
    + '<head><meta charset="utf-8"><title>' + String(title || 'Rapor').replace(/[<>&]/g, '') + '</title>'
    + '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->'
    + '<style>@page{size:A4;margin:1.5cm} body{font-family:Helvetica,Arial,sans-serif} table{border-collapse:collapse} td,th{vertical-align:top}</style>'
    + '</head><body>' + clone.outerHTML + '</body></html>';

  // UTF-8 BOM: Word'ün Türkçe karakterleri doğru okuması için
  const blob = new Blob(['﻿' + html], { type: 'application/msword;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 8000);
}

/** Vaka adından güvenli dosya adı üretir. */
export function wordFileName(caseName, lang) {
  const base = String(caseName || (lang === 'en' ? 'case' : 'calisma'))
    .replace(/[çÇ]/g, 'c').replace(/[ğĞ]/g, 'g').replace(/[ıİ]/g, 'i')
    .replace(/[öÖ]/g, 'o').replace(/[şŞ]/g, 's').replace(/[üÜ]/g, 'u')
    .replace(/[^a-zA-Z0-9\- ]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'rapor';
  return base + (lang === 'en' ? '-report.doc' : '-rapor.doc');
}
