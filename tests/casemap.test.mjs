// Vaka Haritası türetme katmanı: düğüm/kenar kurulumu ve kopukluk işaretleri.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCaseMap } from '../src/lib/casemap.js';
import { exampleCase } from '../src/lib/defaults.js';

test('örnek vakadan tam zincir kurulur', () => {
  const m = buildCaseMap(exampleCase(), 'tr');
  const types = t => m.nodes.filter(n => n.type === t);
  assert.equal(types('kpi').length, 1);
  assert.equal(types('driver').length, 4);
  assert.equal(types('finding').length, 4);
  assert.equal(types('rc').length, 3);
  assert.equal(types('decision').length, 1);
  assert.equal(types('action').length, 4);
  assert.equal(types('tracking').length, 1);
  // bulgu→kök neden kenarları rc.findings'ten gelir (KN1:2, KN2:1, KN3:1)
  assert.equal(m.edges.filter(e => e.kind === 'main' && e.to.startsWith('r')).length, 4);
  // aksiyonlar kök nedenlere bağlı (rcIdx)
  assert.equal(m.edges.filter(e => e.kind === 'main' && e.to.startsWith('a')).length, 4);
});

test('örnek vakada tek kopukluk: katkısı 0 bulgu değil, karar/izleme zinciri tam', () => {
  const m = buildCaseMap(exampleCase(), 'tr');
  // B4 katkısı 0 ("sapma yok") → kök neden istemez, kopuk sayılmaz
  const f4 = m.nodes.find(n => n.id === 'f3');
  assert.equal(f4.orphan, false);
  assert.equal(f4.tone, 'muted');
  assert.equal(m.orphanCount, 0);
});

test('bağlantısız bulgu ve aksiyonsuz kök neden kopuk işaretlenir', () => {
  const c = exampleCase();
  c.findings.push({ text: 'Yetim bulgu', evidence: '', share: '3' });
  c.rootCauses.push({ text: 'Aksiyonsuz kök neden', status: 'hipotez', findings: [0] });
  const m = buildCaseMap(c, 'tr');
  const orphanFinding = m.nodes.find(n => n.label.startsWith('B5'));
  const orphanRc = m.nodes.find(n => n.label.startsWith('KN4'));
  assert.ok(orphanFinding.orphan, 'yetim bulgu işaretlenmeli');
  assert.ok(orphanRc.orphan, 'aksiyonsuz kök neden işaretlenmeli');
  assert.equal(m.orphanCount, 2);
});

test('EN modda etiketler F/RC olur', () => {
  const m = buildCaseMap(exampleCase('en'), 'en');
  assert.ok(m.nodes.some(n => n.label.startsWith('F1')));
  assert.ok(m.nodes.some(n => n.label.startsWith('RC1')));
  assert.ok(!m.nodes.some(n => n.label.startsWith('KN')));
});

test('boş vakada harita çökmeden kurulur', () => {
  const m = buildCaseMap({ problem: {}, drivers: [], findings: [], rootCauses: [], actions: [], decision: {}, tracking: [] }, 'tr');
  assert.equal(m.nodes.length, 1); // yalnız KPI düğümü
  assert.equal(m.orphanCount, 0);
});
