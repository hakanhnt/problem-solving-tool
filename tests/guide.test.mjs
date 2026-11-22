// Kullanım rehberi uygulamayla eş kalsın: her adımın "Tamam sayılması için"
// (EN: "Done when") listesi, uygulamanın adım başlığında denetlediği ölçütlerle
// birebir aynı olmalı. Türkçe (rehber.html) ve İngilizce (guide.html) için.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stepChecklist } from '../src/lib/derive.js';

const PAGES = [['rehber.html', 'tr'], ['guide.html', 'en']];
const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

const guideCriteria = (html, step) => {
  const m = html.match(new RegExp('<ul data-step="' + step + '">([\\s\\S]*?)</ul>'));
  assert.ok(m, 'Adım ' + step + ' ölçüt listesi yok');
  return [...m[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(x => x[1].trim());
};
const ids = html => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(x => x[1]));

for (const [file, lang] of PAGES) {
  test(file + ': adım ölçütleri stepChecklist ile aynı', () => {
    const html = read(file);
    for (let step = 1; step <= 8; step++) {
      const app = stepChecklist({}, step, lang).items.map(i => i.label);
      assert.deepEqual(guideCriteria(html, step), app, 'Adım ' + step);
    }
  });

  test(file + ': iç bağlantıların hedefleri var', () => {
    const html = read(file);
    const have = ids(html);
    const missing = [...html.matchAll(/href="#([^"]+)"/g)].map(x => x[1]).filter(h => !have.has(h));
    assert.deepEqual(missing, []);
  });
}

test('iki dilde aynı yapı: aynı sayıda bölüm, adım ve soru', () => {
  const count = (html, re) => (html.match(re) || []).length;
  const [tr, en] = PAGES.map(([f]) => read(f));
  for (const re of [/<section /g, /<details /g, /class="g-step"/g, /<h3/g, /<li>/g]) {
    assert.equal(count(en, re), count(tr, re), String(re));
  }
});
