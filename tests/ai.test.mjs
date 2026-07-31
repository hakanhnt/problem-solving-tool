// Düşünen model (reasoning) yanıtlarının güvenli işlenmesi.
// Düşünce bloğu yanıt metnine sızarsa rehber kartları ve rapor üretimi bozulur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripThinking, parseJsonReply, extractObjects, THINK_MODES } from '../src/lib/ai.js';

test('stripThinking: kapalı <think> bloğu temizlenir', () => {
  const s = '<think>Önce bulguları sayayım... 3 tane var.</think>{"giris":"x"}';
  assert.equal(stripThinking(s), '{"giris":"x"}');
});

test('stripThinking: çok satırlı ve öznitelikli blok temizlenir', () => {
  const s = '<think type="reasoning">\nsatır 1\nsatır 2\n</think>\n\nSonuç metni';
  assert.equal(stripThinking(s), 'Sonuç metni');
});

test('stripThinking: kesilen (kapanmamış) blok da atılır', () => {
  const s = 'Giriş cümlesi.\n<think>yarıda kesilmiş düşünce';
  assert.equal(stripThinking(s), 'Giriş cümlesi.');
});

test('stripThinking: <thinking> etiketi de desteklenir', () => {
  assert.equal(stripThinking('<thinking>abc</thinking>xyz'), 'xyz');
});

test('stripThinking: düşünce yoksa metin değişmez', () => {
  assert.equal(stripThinking('  düz metin  '), 'düz metin');
  assert.equal(stripThinking(''), '');
  assert.equal(stripThinking(null), '');
  assert.equal(stripThinking(undefined), '');
});

test('stripThinking: birden çok blok temizlenir', () => {
  assert.equal(stripThinking('<think>a</think>X<think>b</think>Y'), 'XY');
});

test('parseJsonReply: düşünce bloğu JSON ayrıştırmayı bozmaz', () => {
  const reply = '<think>Kullanıcının 3 bulgusu var, ikisi kanıtsız.</think>\n'
    + '```json\n{"giris":"Öneriler hazır","bulgular":[{"bulgu":"B1","kanitKaynagi":"rapor"}]}\n```';
  const j = parseJsonReply(reply);
  assert.equal(j.giris, 'Öneriler hazır');
  assert.equal(j.bulgular.length, 1);
});

test('parseJsonReply: düşünce içinde süslü parantez olsa da doğru nesne alınır', () => {
  const reply = '<think>Şema {"x":1} gibi olmalı sanırım</think>{"giris":"gerçek yanıt","sorular":[]}';
  const j = parseJsonReply(reply);
  assert.equal(j.giris, 'gerçek yanıt');
});

test('parseJsonReply: JSON sonrası artık metin varsa ilk dengeli nesne alınır', () => {
  const reply = '{"giris":"a","sorular":["s1"]}\n\nUmarım yardımcı olur!';
  const j = parseJsonReply(reply);
  assert.equal(j.giris, 'a');
});

test('THINK_MODES: yalnızca sağlayıcının kabul ettiği değerler (M3: adaptive|disabled)', () => {
  assert.deepEqual(THINK_MODES, ['disabled', 'adaptive']);
  // 'enabled' sağlayıcıda 2013 hatası verir — listede asla yer almamalı.
  assert.ok(!THINK_MODES.includes('enabled'));
});

// ---- Kesilen yanıttan senaryo kurtarma (pre-mortem dayanıklılığı) ----

test('extractObjects: kesilmiş dış JSON içinden bütün senaryolar kurtarılır', () => {
  // Dış nesne kapanmadan yanıt kesildi; ilk iki senaryo bütün, üçüncüsü yarım.
  const reply = '{"giris":"6 ay sonrası...","senaryolar":['
    + '{"baslik":"Checklist unutuldu","hikaye":"Kimse kullanmadı.","erkenSinyal":"Uyum %60 altı","onleyiciTedbir":"Haftalık ölçüm"},'
    + '{"baslik":"Toplantı söndü","hikaye":"İptal edile edile kalktı.","erkenSinyal":"2 iptal üst üste","onleyiciTedbir":"Takvime sabitle"},'
    + '{"baslik":"Yarım kalan sen';
  const objs = extractObjects(reply, 'baslik');
  assert.equal(objs.length, 2);
  assert.equal(objs[0].baslik, 'Checklist unutuldu');
  assert.equal(objs[1].onleyiciTedbir, 'Takvime sabitle');
});

test('extractObjects: düşünce bloğu içindeki sahte nesneler anahtar filtresine takılır', () => {
  const reply = '<think>şema {"x":1} olsun</think>{"senaryolar":[{"baslik":"A","hikaye":"h"}]}';
  const objs = extractObjects(reply, 'baslik');
  assert.equal(objs.length, 1);
  assert.equal(objs[0].baslik, 'A');
});

test('extractObjects: hiç bütün nesne yoksa boş dizi (çökmez)', () => {
  assert.deepEqual(extractObjects('{"baslik":"yarim', 'baslik'), []);
  assert.deepEqual(extractObjects('', 'baslik'), []);
  assert.deepEqual(extractObjects('düz metin', 'baslik'), []);
});
