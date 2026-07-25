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
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'");

  const paras = [];
  for (const p of xml.split(/<w:p[ >]/).slice(1)) {
    const chunk = p.split('</w:p>')[0];
    const texts = [...chunk.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map(m => decode(m[1]));
    const line = texts.join('').trim();
    if (line) paras.push(line);
  }
  return paras.join('\n').slice(0, MAX_CHARS);
}

/** Dosya adına göre uygun çıkarıcıyı çalıştırır; desteklenmeyen türde null döner. */
export async function extractFileText(file) {
  const name = (file.name || '').toLowerCase();
  if (/\.(txt|md)$/.test(name)) return await file.text();
  if (/\.pdf$/.test(name)) return await extractPdfText(await file.arrayBuffer());
  if (/\.docx$/.test(name)) return await extractDocxText(await file.arrayBuffer());
  return null;
}
