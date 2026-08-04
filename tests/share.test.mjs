// Paylaşım linki: sıkıştırma gidiş-dönüşü, eski biçim uyumu ve boyut sınırı.
import test from 'node:test';
import assert from 'node:assert/strict';
import lz from 'lz-string';
const { compressToEncodedURIComponent } = lz;
import { buildShareHash, parseShareHash } from '../src/lib/share.js';
import { exampleCase, exampleCase2, defaultPrinciples } from '../src/lib/defaults.js';

test('paylaşım yükü gidiş-dönüşte kayıpsız', () => {
  const c = exampleCase2();
  const hash = buildShareHash(c, defaultPrinciples(), 'Deneme A.Ş.');
  assert.ok(hash.startsWith('#z='), 'yeni biçim #z= ile başlar');
  const p = parseShareHash(hash);
  assert.ok(p, 'yük çözülebilir');
  assert.equal(p.company, 'Deneme A.Ş.');
  assert.equal(p.c.name, c.name);
  assert.equal(p.c.problem.actual, '1850');
  assert.equal(p.c.rootCauses.length, 6);
  assert.equal(p.c.actions.length, 8);
});

test('yeni biçim eski lz-string biçiminden kısa', () => {
  for (const c of [exampleCase(), exampleCase2()]) {
    const payload = JSON.stringify({ v: 1, company: '', principles: defaultPrinciples(), c });
    const eski = compressToEncodedURIComponent(payload).length;
    const yeni = buildShareHash(c, defaultPrinciples(), '').length;
    assert.ok(yeni < eski, `yeni (${yeni}) eskiden (${eski}) kısa olmalı`);
  }
});

test('eski biçim (#s=, lz-string) linkler açılmaya devam eder', () => {
  const payload = JSON.stringify({ v: 1, company: 'X', principles: [], c: exampleCase() });
  const eskiHash = '#s=' + compressToEncodedURIComponent(payload);
  const p = parseShareHash(eskiHash);
  assert.ok(p, 'eski biçim çözülebilir');
  assert.equal(p.company, 'X');
  assert.equal(p.c.name, exampleCase().name);
});

test('bozuk ve yabancı hash null döner', () => {
  assert.equal(parseShareHash(''), null);
  assert.equal(parseShareHash('#foo=bar'), null);
  assert.equal(parseShareHash('#z=%%%bozuk%%%'), null);
  assert.equal(parseShareHash('#s=bozukveri'), null);
});

test('ağır oturum alanları paylaşımdan ayıklanır', () => {
  const c = exampleCase();
  c.ai = { big: 'x'.repeat(5000) };
  c.coach = { status: 'busy' };
  c.references = [{ id: 'r1', title: 'Rapor', type: 'pdf', url: '', text: 'y'.repeat(9000), summary: 'uzun özet' }];
  const p = parseShareHash(buildShareHash(c, [], ''));
  assert.equal(p.c.ai, undefined);
  assert.equal(p.c.coach, undefined);
  assert.equal(p.c.references[0].text, undefined);
  assert.equal(p.c.references[0].summary, undefined);
  assert.equal(p.c.references[0].title, 'Rapor');
});
