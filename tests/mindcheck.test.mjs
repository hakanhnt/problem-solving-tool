// Zihin Kontrolü: adım verisi, istem bloğu ve buildSystem entegrasyonu.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mindCheckFor, mindCheckPromptBlock, preCheckItemsFor } from '../src/lib/mindcheck.js';
import { buildSystem } from '../src/lib/ai.js';

const blank = () => ({
  problem: {}, drivers: [], driverAnalysis: [], sipoc: [], findings: [], whys: [],
  fishbone: {}, rootCauses: [], thinking: {}, spec: {}, containment: {},
  alternatives: [], criteria: [], scores: {}, decision: {}, actions: [], tracking: [], retro: {}, references: []
});

test('adım 1-7 içerik var, adım 8 yok — iki dilde', () => {
  for (let n = 1; n <= 7; n++) {
    const tr = mindCheckFor(n, 'tr'), en = mindCheckFor(n, 'en');
    assert.ok(tr && tr.yanilgilar.length >= 2 && tr.sorular.length >= 3, 'tr adım ' + n);
    assert.ok(en && en.yanilgilar.length === tr.yanilgilar.length && en.sorular.length === tr.sorular.length, 'en adım ' + n);
    tr.yanilgilar.forEach(y => { assert.ok(y.ad && y.aciklama && y.panzehir); });
  }
  assert.equal(mindCheckFor(8, 'tr'), null);
  assert.equal(mindCheckFor(8, 'en'), null);
});

test('spesifikasyondaki metinler birebir korunur', () => {
  const m1 = mindCheckFor(1, 'tr');
  assert.equal(m1.yanilgilar[0].ad, 'Çapa etkisi');
  assert.equal(m1.yanilgilar[0].panzehir, 'Bu problemi hiç duymamış biri aynı ifadeyi mi yazardı?');
  assert.equal(m1.yontem, 'Eleştirel Düşünme');
  const m6 = mindCheckFor(6, 'tr');
  assert.equal(m6.yanilgilar.length, 3);
  assert.equal(m6.yanilgilar[1].ad, 'Statüko & batık maliyet');
  assert.equal(mindCheckFor(7, 'tr').sorular[2], 'Dışarıdan biri bu karar sürecini anlayabilir mi?');
});

test('istem bloğu adımın yanılgılarını ve yavaşlatma talimatını içerir', () => {
  const b = mindCheckPromptBlock(4);
  assert.ok(b.includes('BU ADIMDA GÖZETİLECEK DÜŞÜNCE YANILGILARI:'));
  assert.ok(b.includes('Onaylama yanlılığı'));
  assert.ok(b.includes('Panzehir sorusu:'));
  assert.ok(b.includes('yavaşlamasını iste'));
  assert.equal(mindCheckPromptBlock(8), '');
});

test('buildSystem her adımda o adımın yanılgı bloğunu taşır', () => {
  const s1 = buildSystem(1, blank(), {}, []);
  assert.ok(s1.includes('Çapa etkisi'));
  const s6 = buildSystem(6, blank(), {}, []);
  assert.ok(s6.includes('Kısa vadecilik'));
  const s8 = buildSystem(8, blank(), {}, []);
  assert.ok(!s8.includes('BU ADIMDA GÖZETİLECEK DÜŞÜNCE YANILGILARI'));
});

test('karar öncesi kontrol soruları p1-p3 iki dilde', () => {
  const tr = preCheckItemsFor('tr'), en = preCheckItemsFor('en');
  assert.deepEqual(tr.map(x => x.key), ['p1', 'p2', 'p3']);
  assert.ok(tr[0].soru.startsWith('Ben şu an neyi varsayıyorum?'));
  assert.equal(tr[2].not, 'Kısa vadecilik ve sonuç yanlılığına karşı');
  assert.deepEqual(en.map(x => x.key), ['p1', 'p2', 'p3']);
});
