// Excel (.xlsx) metin çıkarımı — gerçek bir zip fikstürüyle uçtan uca.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extractXlsxText, extractFileText } from '../src/lib/extract.js';

const load = async () => {
  const buf = await readFile(new URL('./fixtures/ornek.xlsx', import.meta.url));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
};

test('xlsx: sayfa adları, paylaşılan dizgeler ve sayılar çıkarılır', async () => {
  const text = await extractXlsxText(await load());
  assert.ok(text.includes('=== KPI Verisi ==='), 'sayfa adı');
  assert.ok(text.includes('=== A&B Kırılım ==='), 'ikinci sayfa adı (entity çözülmüş)');
  assert.ok(text.includes('Ay | Yol Süresi'), 'paylaşılan dizgeler (parçalı t birleşimi)');
  assert.ok(text.includes('Ağustos | 52'), 'dizge + sayı satırı');
  assert.ok(text.includes('Segment | 12.5'), 'inlineStr + ondalık');
});

test('xlsx: atlanan sütunlar boş hücreyle hizalanır', async () => {
  const text = await extractXlsxText(await load());
  // Temmuz satırında B boş, değer C sütununda: "Temmuz |  | 58"
  assert.ok(/Temmuz \| +\| 58/.test(text), 'sütun hizalaması korunmalı: ' + text.split('\n').find(l => l.includes('Temmuz')));
});

test('extractFileText: uzantı yönlendirmesi ve .xls reddi', async () => {
  const ab = await load();
  const fakeFile = name => ({ name, arrayBuffer: async () => ab, text: async () => 'a,b\n1,2' });
  const viaRouter = await extractFileText(fakeFile('veri.XLSX'.toLowerCase()));
  assert.ok(viaRouter.includes('KPI Verisi'));
  assert.equal(await extractFileText(fakeFile('veri.csv')), 'a,b\n1,2');
  await assert.rejects(() => extractFileText(fakeFile('eski.xls')), /xlsx olarak kaydedip/);
  assert.equal(await extractFileText(fakeFile('resim.png')), null);
});
