// Referans dosyalarından metin çıkarımı — tamamen tarayıcıda çalışır, dosya sunucuya gitmez.
// pdfjs ve jszip yalnızca ihtiyaç anında (dynamic import) yüklenir ki ana paket şişmesin.

const MAX_CHARS = 40000;   // özetleyici zaten 4.000+ karakterde devreye giriyor
const MAX_PDF_PAGES = 60;

/** PDF → düz metin (ilk MAX_PDF_PAGES sayfa). */
export async function extractPdfText(arrayBuffer, onProgress) {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pages = Math.min(doc.numPages, MAX_PDF_PAGES);
  const chunks = [];
  let total = 0;
  for (let i = 1; i <= pages && total < MAX_CHARS; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(it => it.str).join(' ').replace(/\s{2,}/g, ' ').trim();
    if (text) { chunks.push(text); total += text.length; }
    if (onProgress) onProgress(i, pages);
  }
  let out = chunks.join('\n\n');
  if (doc.numPages > pages) out += '\n\n[… belge ' + doc.numPages + ' sayfa; ilk ' + pages + ' sayfa alındı]';
  return out.slice(0, MAX_CHARS);
}

/** DOCX → düz metin (word/document.xml içindeki paragraflar). */
export async function extractDocxText(arrayBuffer) {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(arrayBuffer);
  const entry = zip.file('word/document.xml');
  if (!entry) throw new Error('Geçerli bir Word belgesi değil (word/document.xml yok)');
  const xml = await entry.async('string');

  const decode = t => t
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

  const paras = [];
  for (const p of xml.split(/<w:p[ >]/).slice(1)) {
    const chunk = p.split('</w:p>')[0];
    const texts = [...chunk.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map(m => decode(m[1]));
    const line = texts.join('').trim();
    if (line) paras.push(line);
  }
  return paras.join('\n').slice(0, MAX_CHARS);
}

const MAX_SHEET_ROWS = 300; // YZ bağlamı için yeterli; devasa tablolar kırpılır

/** XLSX → tablo metni (sayfa adları + satırlar '|' ile ayrılmış). Tamamen tarayıcıda. */
export async function extractXlsxText(arrayBuffer) {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(arrayBuffer);

  const decode = t => t
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

  // Paylaşılan dizgeler: her <si> içindeki tüm <t> parçaları birleştirilir (zengin metin)
  const shared = [];
  const ssEntry = zip.file('xl/sharedStrings.xml');
  if (ssEntry) {
    const xml = await ssEntry.async('string');
    for (const si of xml.split(/<si[ >]/).slice(1)) {
      const chunk = si.split('</si>')[0];
      const texts = [...chunk.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(m => decode(m[1]));
      shared.push(texts.join(''));
    }
  }

  // Sayfa adları (workbook.xml sırası, worksheets dosya sırasıyla örtüşür; şaşarsa geriye düşülür)
  let sheetNames = [];
  const wbEntry = zip.file('xl/workbook.xml');
  if (wbEntry) {
    const xml = await wbEntry.async('string');
    sheetNames = [...xml.matchAll(/<sheet[^>]*\bname="([^"]*)"/g)].map(m => decode(m[1]));
  }

  const sheetFiles = Object.keys(zip.files)
    .filter(k => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))
    .sort((a, b) => parseInt(a.match(/(\d+)/)[1], 10) - parseInt(b.match(/(\d+)/)[1], 10));
  if (!sheetFiles.length) throw new Error('Geçerli bir Excel dosyası değil (xl/worksheets yok)');

  const colIndex = ref => {
    const letters = (ref.match(/^[A-Z]+/i) || [''])[0].toUpperCase();
    let n = 0;
    for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
    return Math.max(0, n - 1);
  };

  const out = [];
  let total = 0;
  for (let si = 0; si < sheetFiles.length && total < MAX_CHARS; si++) {
    const xml = await zip.file(sheetFiles[si]).async('string');
    const lines = [];
    const rows = xml.split(/<row[ >]/).slice(1);
    for (const rowChunk of rows.slice(0, MAX_SHEET_ROWS)) {
      const row = rowChunk.split('</row>')[0];
      const cells = [];
      for (const cm of row.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/g)) {
        const attrs = cm[1] || cm[3] || '';
        const body = cm[2] || '';
        const ref = (attrs.match(/\br="([^"]+)"/) || [])[1] || '';
        const type = (attrs.match(/\bt="([^"]+)"/) || [])[1] || '';
        let val = '';
        if (type === 'inlineStr') {
          val = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(m => decode(m[1])).join('');
        } else {
          const v = (body.match(/<v[^>]*>([\s\S]*?)<\/v>/) || [])[1];
          if (v !== undefined) val = type === 's' ? (shared[parseInt(v, 10)] ?? '') : decode(v);
        }
        if (ref) { const ci = colIndex(ref); while (cells.length < ci) cells.push(''); }
        cells.push(String(val));
      }
      const line = cells.join(' | ').replace(/[ |]+$/g, '');
      if (line.trim()) lines.push(line);
    }
    if (rows.length > MAX_SHEET_ROWS) lines.push('[… sayfa ' + rows.length + ' satır; ilk ' + MAX_SHEET_ROWS + ' satır alındı]');
    if (lines.length) {
      const name = sheetNames[si] || 'Sayfa ' + (si + 1);
      const block = '=== ' + name + ' ===\n' + lines.join('\n');
      out.push(block);
      total += block.length;
    }
  }
  if (!out.length) throw new Error('Excel dosyasında okunabilir hücre bulunamadı');
  return out.join('\n\n').slice(0, MAX_CHARS)
    + '\n\n[Not: tarih hücreleri Excel gün sayısı olarak görünebilir; birim/format bilgisi tablonun kendisindedir]';
}

/** Dosya adına göre uygun çıkarıcıyı çalıştırır; desteklenmeyen türde null döner. */
export async function extractFileText(file) {
  const name = (file.name || '').toLowerCase();
  if (/\.(txt|md|csv)$/.test(name)) return (await file.text()).slice(0, MAX_CHARS);
  if (/\.pdf$/.test(name)) return await extractPdfText(await file.arrayBuffer());
  if (/\.docx$/.test(name)) return await extractDocxText(await file.arrayBuffer());
  if (/\.xlsx$/.test(name)) return await extractXlsxText(await file.arrayBuffer());
  if (/\.xls$/.test(name)) throw new Error('Eski .xls biçimi desteklenmiyor — dosyayı Excel\'de .xlsx olarak kaydedip yeniden yükleyin');
  return null;
}
