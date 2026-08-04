// Triyaj kapısı ve karar zamanlaması (ASAP/ALAP) kural tabloları.
import test from 'node:test';
import assert from 'node:assert/strict';
import { triageAdvice, timingAdvice } from '../src/lib/derive.js';
import { blankCase, exampleCase2 } from '../src/lib/defaults.js';

test('karar zamanlaması: geri alma bedeline göre ASAP/ALAP', () => {
  assert.equal(timingAdvice({ reversal: 'dusuk' }, 'tr').key, 'asap');
  assert.equal(timingAdvice({ reversal: 'yuksek' }, 'tr').key, 'alap');
  assert.equal(timingAdvice({ reversal: 'orta' }, 'tr').key, 'orta');
  assert.equal(timingAdvice({ reversal: '' }, 'tr'), null);
  assert.equal(timingAdvice(null, 'tr'), null);
  assert.ok(timingAdvice({ reversal: 'yuksek' }, 'en').label.includes('ALAP'));
});

test('triyaj: maliyet düşükse hızlı çözüm (low-hanging fruit)', () => {
  assert.equal(triageAdvice({ cost: 'dusuk', benefit: 'dusuk' }, 'tr').key, 'hizli');
  assert.equal(triageAdvice({ cost: 'dusuk', benefit: 'yuksek' }, 'tr').key, 'hizli');
});

test('triyaj: fayda maliyeti karşılıyorsa tam akış', () => {
  assert.equal(triageAdvice({ cost: 'orta', benefit: 'orta' }, 'tr').key, 'tam');
  assert.equal(triageAdvice({ cost: 'yuksek', benefit: 'yuksek' }, 'tr').key, 'tam');
  assert.equal(triageAdvice({ cost: 'orta', benefit: 'yuksek' }, 'tr').key, 'tam');
});

test('triyaj: fayda maliyetin altındaysa beklet/delege', () => {
  assert.equal(triageAdvice({ cost: 'yuksek', benefit: 'dusuk' }, 'tr').key, 'beklet');
  assert.equal(triageAdvice({ cost: 'orta', benefit: 'dusuk' }, 'tr').key, 'delege');
  assert.equal(triageAdvice({ cost: 'yuksek', benefit: 'orta' }, 'tr').key, 'delege');
});

test('triyaj: yüksek aciliyet notu yalnız tam/delege önerisine eklenir', () => {
  assert.ok(triageAdvice({ cost: 'yuksek', benefit: 'yuksek', urgency: 'yuksek' }, 'tr').urgencyNote);
  assert.equal(triageAdvice({ cost: 'dusuk', benefit: 'orta', urgency: 'yuksek' }, 'tr').urgencyNote, undefined);
  assert.equal(triageAdvice({ cost: 'yuksek', benefit: 'yuksek', urgency: 'dusuk' }, 'tr').urgencyNote, undefined);
});

test('triyaj: eksik cevapta öneri üretilmez', () => {
  assert.equal(triageAdvice({ cost: '', benefit: 'yuksek' }, 'tr'), null);
  assert.equal(triageAdvice({}, 'tr'), null);
});

test('yeni alanlar boş vakada ve örnek vakada tanımlı', () => {
  const b = blankCase();
  assert.equal(b.mode, 'full');
  assert.deepEqual(b.triage, { cost: '', benefit: '', urgency: '' });
  assert.deepEqual(b.timing, { reversal: '', window: '', stopSignal: '' });
  const g = exampleCase2();
  assert.equal(timingAdvice(g.timing, 'tr').key, 'alap');
  assert.equal(triageAdvice(g.triage, 'tr').key, 'tam');
});
