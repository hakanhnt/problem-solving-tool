// Gerçek .docx (OOXML) üreticisi: gövde içeriği, bölüm geçişi, XML kaçışı, dil, dosya adı,
// ve tam .docx paketi (jszip → geçerli document.xml).
import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { buildReportDocx, buildReportDocxBody, reportFileNameDocx } from '../src/lib/reportDocx.js';
import { exampleCase, exampleCase2, defaultPrinciples } from '../src/lib/defaults.js';

test('OOXML gövdesi anahtar bölümleri ve tabloları içerir', () => {
  const c = exampleCase2();
  const body = buildReportDocxBody(c, { principles: defaultPrinciples(), companyName: 'Deneme A.Ş.', lang: 'tr' });
  assert.ok(body.includes('YÖNETİCİ ÖZETİ'), 'yönetici özeti');
  assert.ok(body.includes('1 · PROBLEM TANIMI'), 'problem tanımı');
  assert.ok(body.includes('6 · ALTERNATİFLER VE KARAR'), 'karar bölümü');
  assert.ok(body.includes('<w:tbl>'), 'en az bir tablo');
  assert.ok(body.includes('<w:tr>'), 'tablo satırı');
  assert.ok(body.includes(c.problem.kpiName), 'KPI adı');
  assert.ok(body.includes(c.drivers[0].name), 'ilk iş sürücüsü');
});

test('bölüm çipi içeriği kapatır', () => {
  const c = exampleCase2();
  const full = buildReportDocxBody(c, { principles: defaultPrinciples(), lang: 'tr' });
  assert.ok(full.includes('6 · ALTERNATİFLER VE KARAR'), 'karar açık');
  const noKarar = buildReportDocxBody(c, { principles: defaultPrinciples(), lang: 'tr', sections: { karar: false } });
  assert.ok(!noKarar.includes('6 · ALTERNATİFLER VE KARAR'), 'karar kapalı');
});

test('kullanıcı içeriği XML olarak kaçırılır', () => {
  const c = exampleCase();
  c.problem.statement = 'Sapma <b>&"riskli"</b>';
  const body = buildReportDocxBody(c, { principles: defaultPrinciples(), lang: 'tr' });
  assert.ok(body.includes('&lt;b&gt;&amp;&quot;riskli&quot;&lt;/b&gt;'), 'kaçırılmış metin');
  assert.ok(!body.includes('<b>&"riskli'), 'ham enjeksiyon yok');
});

test('İngilizce başlıklar', () => {
  const body = buildReportDocxBody(exampleCase2(), { principles: defaultPrinciples(), lang: 'en' });
  assert.ok(body.includes('EXECUTIVE SUMMARY'), 'exec summary');
  assert.ok(body.includes('1 · PROBLEM DEFINITION'), 'problem definition');
});

test('reportFileNameDocx slug', () => {
  assert.equal(reportFileNameDocx({ problem: { kpiName: 'X' } }, 'Acme A.Ş.'), 'Acme-A.Ş');
  assert.equal(reportFileNameDocx({ problem: {} }, ''), 'rapor');
});

test('tam .docx paketi geçerli document.xml içerir', async () => {
  const buf = await buildReportDocx(exampleCase2(), { principles: defaultPrinciples(), companyName: 'X', lang: 'tr' });
  assert.ok(buf && buf.length > 2000, 'docx tamponu üretildi');
  const zip = await JSZip.loadAsync(buf);
  assert.ok(zip.file('[Content_Types].xml'), 'content types var');
  assert.ok(zip.file('word/document.xml'), 'document.xml var');
  const xml = await zip.file('word/document.xml').async('string');
  assert.ok(xml.startsWith('<?xml'), 'xml bildirimi');
  assert.ok(xml.includes('<w:document') && xml.includes('</w:document>'), 'w:document sarmalayıcı');
  assert.ok(xml.includes('<w:sectPr>'), 'bölüm özellikleri');
});
