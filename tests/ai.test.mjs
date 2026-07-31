// Düşünen model (reasoning) yanıtlarının güvenli işlenmesi.
// Düşünce bloğu yanıt metnine sızarsa rehber kartları ve rapor üretimi bozulur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripThinking, parseJsonReply, THINK_MODES } from '../src/lib/ai.js';

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

test('THINK_MODES: yalnızca sağlayıcının kabul ettiği değerler', () => {
  assert.deepEqual(THINK_MODES, ['disabled', 'adaptive', 'enabled']);
});
