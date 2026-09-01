// Word (.doc) rapor üreticisi: iskelet, içerik, bölüm geçişi, HTML kaçışı, dil, dosya adı.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReportDoc, reportFileName } from '../src/lib/reportDoc.js';
import { exampleCase, exampleCase2, defaultPrinciples } from '../src/lib/defaults.js';

test('Word HTML iskeleti ve başlık', () => {
  const c = exampleCase2();
  const html = buildReportDoc(c, { principles: defaultPrinciples(), companyName: 'Deneme A.Ş.', lang: 'tr' });
  assert.ok(html.startsWith('<html'), 'html ile başlar');
  assert.ok(html.includes('xmlns:w="urn:schemas-microsoft-com:office:word"'), 'Word namespace var');
  assert.ok(html.includes('<title>'), 'title var');
  assert.ok(html.includes('application/msword') === false, 'mime blob katmanında, HTML içinde değil');
  assert.ok(html.includes('YÖNETİCİ ÖZETİ'), 'yönetici özeti başlığı');
  assert.ok(html.includes(c.problem.kpiName), 'KPI adı başlıkta');
  assert.ok(html.includes('Deneme A.Ş.'), 'şirket adı meta satırında');
});

test('Anahtar içerik rapora giriyor', () => {
  const c = exampleCase2();
  const html = buildReportDoc(c, { principles: defaultPrinciples(), lang: 'tr' });
  assert.ok(html.includes(c.drivers[0].name), 'ilk iş sürücüsü');
  assert.ok(html.includes(c.rootCauses[0].text), 'ilk kök neden metni');
  assert.ok(html.includes(c.decision.choice), 'karar metni');
  assert.ok(html.includes('AKSİYON PLANI'), 'aksiyon planı bölümü');
  assert.ok(html.includes('İZLENEBİLİRLİK'), 'izlenebilirlik bölümü (çipe bağlı değil)');
});

test('Bölüm çipleri içeriği açıp kapatıyor', () => {
  const c = exampleCase2();
  const withKarar = buildReportDoc(c, { principles: defaultPrinciples(), lang: 'tr' });
  assert.ok(withKarar.includes('ALTERNATİFLER VE KARAR'), 'karar açıkken var');

  const noKarar = buildReportDoc(c, { principles: defaultPrinciples(), lang: 'tr', sections: { karar: false } });
  assert.ok(!noKarar.includes('6 · ALTERNATİFLER VE KARAR'), 'karar kapalıyken yok');

  const noTanim = buildReportDoc(c, { principles: defaultPrinciples(), lang: 'tr', sections: { tanim: false } });
  assert.ok(!noTanim.includes('1 · PROBLEM TANIMI'), 'tanım kapalıyken yok');
});

test('Kullanıcı içeriği HTML olarak kaçırılıyor', () => {
  const c = exampleCase();
  c.problem.statement = 'Sapma <b>&"tehlike"</b>';
  const html = buildReportDoc(c, { principles: defaultPrinciples(), lang: 'tr' });
  assert.ok(html.includes('&lt;b&gt;&amp;&quot;tehlike&quot;&lt;/b&gt;'), 'özel karakterler kaçırıldı');
  assert.ok(!html.includes('<b>&"tehlike'), 'ham enjeksiyon yok');
});

test('İngilizce başlıklar', () => {
  const html = buildReportDoc(exampleCase2(), { principles: defaultPrinciples(), lang: 'en' });
  assert.ok(html.includes('EXECUTIVE SUMMARY'), 'exec summary EN');
  assert.ok(html.includes('1 · PROBLEM DEFINITION'), 'problem def EN');
  assert.ok(html.includes('6 · ALTERNATIVES AND DECISION'), 'decision EN');
});

test('format: html temiz sayfa, doc ise Word namespace', () => {
  const c = exampleCase();
  const doc = buildReportDoc(c, { principles: defaultPrinciples(), lang: 'tr', format: 'doc' });
  assert.ok(doc.includes('xmlns:w="urn:schemas-microsoft-com:office:word"'), 'doc Word namespace içerir');
  assert.ok(!doc.startsWith('<!doctype'), 'doc doctype ile başlamaz');

  const html = buildReportDoc(c, { principles: defaultPrinciples(), lang: 'tr', format: 'html' });
  assert.ok(html.startsWith('<!doctype html>'), 'html doctype ile başlar');
  assert.ok(html.includes('<html lang="tr">'), 'html lang niteliği');
  assert.ok(!html.includes('xmlns:w'), 'html Word namespace içermez');
  assert.ok(html.includes('background:#ffffff'), 'html açık zemin');
  // içerik aynı bölümleri taşır
  assert.ok(html.includes('YÖNETİCİ ÖZETİ') && html.includes('1 · PROBLEM TANIMI'), 'aynı bölümler');

  const en = buildReportDoc(c, { principles: defaultPrinciples(), lang: 'en', format: 'html' });
  assert.ok(en.includes('<html lang="en">'), 'html lang en');
});

test('reportFileName slug üretimi', () => {
  assert.equal(reportFileName({ problem: { kpiName: 'X' } }, 'Acme A.Ş.'), 'Acme-A.Ş');
  assert.equal(reportFileName({ problem: {} }, ''), 'rapor');
  assert.equal(reportFileName({ problem: { kpiName: 'Yol süresi/gün' }, name: '' }, ''), 'Yol-süresigün');
  assert.equal(reportFileName({ problem: {}, name: 'Vaka 1' }, ''), 'Vaka-1');
});
