// Düşünen model (reasoning) yanıtlarının güvenli işlenmesi.
// Düşünce bloğu yanıt metnine sızarsa rehber kartları ve rapor üretimi bozulur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripThinking, parseJsonReply, extractObjects, repairJson, THINK_MODES } from '../src/lib/ai.js';

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

// ---- Bozuk JSON onarımı (repairJson) — sahadaki gerçek hata sınıfları ----

test('repairJson: değer içindeki kaçışsız çift tırnak kaçırılır', () => {
  // Kullanıcının aldığı hata sınıfı: "Expected ',' or '}' after property value"
  const bad = '{"v":"yeni "checklist" süreci devrede","y":"tamam"}';
  const j = JSON.parse(repairJson(bad));
  assert.equal(j.v, 'yeni "checklist" süreci devrede');
  assert.equal(j.y, 'tamam');
});

test('repairJson: dizge içindeki çıplak satır sonu \\n olur', () => {
  const bad = '{"v":"ilk satır\nikinci satır"}';
  const j = JSON.parse(repairJson(bad));
  assert.equal(j.v, 'ilk satır\nikinci satır');
});

test('repairJson: sondaki virgül ve unutulmuş virgül onarılır', () => {
  assert.deepEqual(JSON.parse(repairJson('{"a":"x","b":"y",}')), { a: 'x', b: 'y' });
  assert.deepEqual(JSON.parse(repairJson('{"a":"x" "b":"y"}')), { a: 'x', b: 'y' });
});

test('repairJson: geçerli JSON değişmeden ayrışır (kaçışlı tırnak ve Türkçe korunur)', () => {
  const good = '{"v":"üretici \\"onay\\" bekliyor","n":42,"arr":[1,2],"tr":"ğüşiöç"}';
  const j = JSON.parse(repairJson(good));
  assert.equal(j.v, 'üretici "onay" bekliyor');
  assert.equal(j.n, 42);
  assert.deepEqual(j.arr, [1, 2]);
  assert.equal(j.tr, 'ğüşiöç');
});

test('parseJsonReply: kaçışsız tırnaklı VAR/YOK yanıtı onarımla ayrışır', () => {
  // Sahadaki hatanın küçük kopyası: iç içe nesne + değer içinde tırnak
  const reply = '{"giris":"Taslak hazır","belirtim":{"nerede":{"v":"Bangladeş "yeni üretici" yüklemeleri","y":"Çin yüklemeleri"},"zaman":{"v":"Q1 sonrası","y":"Q4 öncesi"}},"degisiklik":"İki "yeni" üretici eklendi","sorular":["Soru?"]}';
  const j = parseJsonReply(reply);
  assert.equal(j.belirtim.nerede.v, 'Bangladeş "yeni üretici" yüklemeleri');
  assert.equal(j.degisiklik, 'İki "yeni" üretici eklendi');
  assert.equal(j.sorular.length, 1);
});

test('parseJsonReply: düşünce bloğu + bozuk JSON birlikte de ayrışır', () => {
  const reply = '<think>tırnak koyayım mı?</think>{"giris":"a","v":"içinde "tırnak" var"}';
  const j = parseJsonReply(reply);
  assert.equal(j.v, 'içinde "tırnak" var');
});

test('extractObjects: bozuk iç nesne onarımla kurtarılır', () => {
  const reply = '{"senaryolar":[{"baslik":"İçinde "tırnak" olan başlık","hikaye":"h"},{"baslik":"Yarım ka';
  const objs = extractObjects(reply, 'baslik');
  assert.equal(objs.length, 1);
  assert.equal(objs[0].baslik, 'İçinde "tırnak" olan başlık');
});
