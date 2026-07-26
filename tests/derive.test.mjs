// Kritik hesap fonksiyonlarının otomatik testleri (node --test ile çalışır).
// Zorunlu senaryolar: Pareto-KPI, KPI yönü, hedef 0, ağırlık geçerliliği,
// izlenebilirlik denetimi, termin gecikmesi, eski veri şekliyle null-güvenlik.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  gapInfo, effDirection, paretoData, decisionMatrix, rcStatusMeta,
  traceability, isOverdue, caseMaturity, stepChecklist, confidenceScore
} from '../src/lib/derive.js';

const problem = (over = {}) => ({ statement: 'x', kpiName: 'KPI', target: '45', actual: '65', direction: 'dusuk', unit: 'gün', ...over });

// ---- Senaryo 1: KPI sapması 20, katkılar 7+4+4 = 15 → %75 açıklanan + 5 açıklanamayan
test('Pareto: açıklanan %75, açıklanamayan 5 birim ayrı kategori', () => {
  const c = {
    problem: problem(),
    findings: [
      { text: 'B1', share: '7' }, { text: 'B2', share: '4' }, { text: 'B3', share: '4' }
    ]
  };
  const p = paretoData(c);
  assert.equal(p.mode, 'kpi');
  assert.equal(p.gap, 20);
  assert.equal(p.explained, 15);
  assert.equal(p.explainedPct, 75);
  assert.equal(p.unexplained, 5);
  assert.equal(p.unexplainedPct, 25);
  assert.equal(p.overflow, 0);
  // bulgu payları sapmaya göre: 7/20 = %35
  assert.equal(p.bars[0].pctOfGap, 35);
  // iç dağılım: 7/15 ≈ %47
  assert.equal(p.bars[0].pctInternal, 47);
});

// ---- Senaryo 2: katkı toplamı sapmayı aşarsa UYARI (overflow)
test('Pareto: katkılar sapmayı aşınca overflow > 0', () => {
  const c = {
    problem: problem({ target: '45', actual: '55' }), // sapma 10
    findings: [{ text: 'B1', share: '8' }, { text: 'B2', share: '6' }] // toplam 14
  };
  const p = paretoData(c);
  assert.equal(p.gap, 10);
  assert.equal(p.explained, 14);
  assert.equal(p.overflow, 4);
  assert.equal(p.unexplained, 0);
});

test('Pareto: KPI sapması yoksa iç dağılım moduna düşer', () => {
  const c = { problem: {}, findings: [{ text: 'B1', share: '3' }, { text: 'B2', share: '1' }] };
  const p = paretoData(c);
  assert.equal(p.mode, 'internal');
  assert.equal(p.explainedPct, null);
  assert.equal(p.bars[0].pctInternal, 75);
});

// ---- Senaryo 3: hedef 0 → yüzde hesaplanmaz, hata yok
test('gapInfo: hedef 0 iken pct null, açıklama notu var', () => {
  const g = gapInfo(problem({ target: '0', actual: '12' }));
  assert.equal(g.hasGap, true);
  assert.equal(g.pct, null);
  assert.ok(g.zeroTargetNote.length > 0);
  assert.equal(g.diff, 12);
  assert.ok(!g.kpiGapText.includes('%'));
});

// ---- Senaryo 4: "düşük iyi" — gerçekleşen hedefin altındaysa olumlu
test('gapInfo: düşük iyi yönünde hedef altı olumlu sapmadır', () => {
  const g = gapInfo(problem({ target: '45', actual: '40', direction: 'dusuk' }));
  assert.equal(g.good, true);
  assert.equal(g.diff, -5);
  assert.ok(g.remainText.includes('iyisinde'));
});

// ---- Senaryo 5: "yüksek iyi" — gerçekleşen hedefin altındaysa olumsuz
test('gapInfo: yüksek iyi yönünde hedef altı olumsuz sapmadır', () => {
  const g = gapInfo(problem({ target: '90', actual: '70', direction: 'yuksek', unit: '%' }));
  assert.equal(g.good, false);
  assert.equal(g.gapMag, 20);
  assert.ok(g.remainText.includes('Hedefe kalan'));
});

test('gapInfo: aralık modu — içinde olumlu, dışında fark hesaplanır', () => {
  const base = problem({ direction: 'aralik', target: '10', targetHigh: '20' });
  assert.equal(gapInfo({ ...base, actual: '15' }).good, true);
  const out = gapInfo({ ...base, actual: '25' });
  assert.equal(out.good, false);
  assert.equal(out.diff, 5);
  assert.equal(out.pct, null);
});

test('effDirection: yön kayıtlı değilse eski davranışla uyumlu tahmin', () => {
  assert.equal(effDirection({ target: '45', actual: '65' }), 'dusuk');
  assert.equal(effDirection({ target: '90', actual: '70' }), 'yuksek');
});

// ---- Senaryo 6: ağırlık toplamı 100 değilse puan geçersiz + eksik/fazla gösterilir
test('decisionMatrix: ağırlık toplamı 100 değilse valid=false, wDelta doğru', () => {
  const c = {
    criteria: [{ name: 'K1', weight: '50' }, { name: 'K2', weight: '30' }],
    alternatives: [{ name: 'A1' }, { name: 'A2' }],
    scores: { '0_0': '5', '0_1': '3', '1_0': '2', '1_1': '4' }
  };
  const M = decisionMatrix(c);
  assert.equal(M.valid, false);
  assert.equal(M.wsum, 80);
  assert.equal(M.wDelta, 20); // 20 puan eksik
});

test('decisionMatrix: geçerli matriste kazanan, fark ve en etkili kriter', () => {
  const c = {
    criteria: [{ name: 'Etki', weight: '60' }, { name: 'Hız', weight: '40' }],
    alternatives: [{ name: 'A1' }, { name: 'A2' }],
    scores: { '0_0': '5', '0_1': '2', '1_0': '3', '1_1': '4' }
  };
  const M = decisionMatrix(c);
  assert.equal(M.valid, true);
  assert.equal(M.best.n, '1'); // A1: 3.8 > A2: 3.4
  assert.equal(M.lead, 0.4);
  assert.equal(M.influential.name, 'Etki'); // 0.6*(5-3)=1.2 katkı
  // Hassasiyet: Etki kriteri çıkarılırsa kazanan A2 olur
  assert.ok(M.sensitivity.some(s => s.name === 'Etki' && s.newWinner === 'A2'));
});

// ---- Senaryo 7 (kısmen): doğrulanmamış kök neden "hipotez" olarak etiketlenir
test('rcStatusMeta: durumsuz kök neden hipotez sayılır', () => {
  assert.equal(rcStatusMeta(undefined).key, 'hipotez');
  assert.equal(rcStatusMeta('dogrulandi').label, 'Doğrulandı');
});

// ---- Senaryo 8: izlenebilirlik denetimi — yetim kök neden, bulgusuz kök, sahipsiz aksiyon
test('traceability: kopuk bağlar tespit edilir', () => {
  const c = {
    findings: [{ text: 'B1' }, { text: 'B2' }],
    rootCauses: [
      { text: 'KN1', findings: [0], status: 'dogrulandi' },
      { text: 'KN2', findings: [], status: 'hipotez' } // bulgusuz + önlemsiz
    ],
    decision: { choice: 'Karar verildi' },
    actions: [{ text: 'A1', owner: '', dueDate: '', rcIdx: '0' }],
    tracking: []
  };
  const t = traceability(c);
  const types = t.issues.map(i => i.type);
  assert.ok(types.includes('bulgu-koksuz'));   // B2 hiçbir köke bağlı değil
  assert.ok(types.includes('kok-bulgusuz'));   // KN2 bulgusuz
  assert.ok(types.includes('kok-onlemsiz'));   // KN2 için aksiyon yok
  assert.ok(types.includes('aksiyon-eksik'));  // A1 sahipsiz/terminsiz
  assert.ok(types.includes('kpi-dogrulamasiz')); // izleme ölçümü yok
});

test('traceability: tam bağlı çalışmada sorun listesi boş', () => {
  const c = {
    findings: [{ text: 'B1' }],
    rootCauses: [{ text: 'KN1', findings: [0], status: 'dogrulandi' }],
    decision: { choice: 'Karar' },
    actions: [{ text: 'A1', owner: 'Ali', dueDate: '2026-08-01', rcIdx: '0' }],
    tracking: [{ label: 'Tem', value: '50' }]
  };
  assert.equal(traceability(c).issues.length, 0);
});

// ---- Senaryo 9: termin geçmiş aksiyon otomatik gecikmiş sayılır
test('isOverdue: termin geçmiş ve tamamlanmamış aksiyon gecikmiştir', () => {
  assert.equal(isOverdue({ dueDate: '2026-07-01', status: 'devam' }, '2026-07-26'), true);
  assert.equal(isOverdue({ dueDate: '2026-07-01', status: 'tamam' }, '2026-07-26'), false);
  assert.equal(isOverdue({ dueDate: '2026-08-01', status: 'devam' }, '2026-07-26'), false);
  assert.equal(isOverdue({ dueDate: '', status: 'devam' }, '2026-07-26'), false);
  assert.equal(isOverdue({ due: '2 hafta', status: 'devam' }, '2026-07-26'), false); // eski serbest metin çökertmez
});

// ---- Senaryo 10: eski kayıt şekli (yeni alanlar yok) hiçbir fonksiyonu çökertmez
test('null-güvenlik: eski veri şekliyle tüm fonksiyonlar çalışır', () => {
  const oldCase = {
    problem: { statement: 'Eski kayıt', kpiName: 'Süre', target: '45', actual: '65' },
    findings: [{ text: 'B1', evidence: 'rapor', share: '7' }, { text: 'B2', share: '4' }],
    whys: ['a', 'b', '', '', ''],
    rootCauses: [{ text: 'KN1', principles: [1] }],
    criteria: [{ name: 'K1', weight: '60' }, { name: 'K2', weight: '40' }],
    alternatives: [{ name: 'A1' }],
    scores: { '0_0': '4', '0_1': '3' },
    decision: { choice: 'x', rationale: 'y' },
    actions: [{ text: 'A1', owner: 'Ali', due: '2 hafta', status: 'devam' }],
    tracking: [{ label: 'Tem', value: '58' }],
    retro: {}
  };
  assert.doesNotThrow(() => {
    gapInfo(oldCase.problem);
    paretoData(oldCase);
    decisionMatrix(oldCase);
    traceability(oldCase);
    caseMaturity(oldCase);
    confidenceScore(oldCase);
    for (let s = 1; s <= 8; s++) stepChecklist(oldCase, s);
  });
  // Eski davranış korunur: 65 > 45 → düşük iyi varsayılır, sapma +20
  const g = gapInfo(oldCase.problem);
  assert.equal(g.direction, 'dusuk');
  assert.equal(g.gapMag, 20);
});

// Bozuk/eksik girdiler: boş vaka
test('null-güvenlik: tamamen boş vaka çökertmez', () => {
  assert.doesNotThrow(() => {
    gapInfo({}); gapInfo(null); paretoData({ problem: {} }); decisionMatrix({});
    traceability({}); caseMaturity({ problem: {} }); confidenceScore({});
  });
  assert.equal(paretoData({ problem: {}, findings: [] }), null);
});

// Olgunluk: alan doluluğu değil metodolojik durum
test('caseMaturity: doğrulanmamış kök neden varken "Kanıt bekliyor"', () => {
  const c = {
    problem: problem(),
    findings: [{ text: 'B1', evidence: 'rapor' }],
    rootCauses: [{ text: 'KN1', status: 'hipotez', findings: [0] }],
    actions: [], tracking: [], retro: {}
  };
  assert.equal(caseMaturity(c).key, 'kanit');
});

test('caseMaturity: hedef karşılandı + retrospektif → KPI ile doğrulandı', () => {
  const c = {
    problem: problem(),
    findings: [{ text: 'B1', evidence: 'r' }],
    rootCauses: [{ text: 'KN1', status: 'dogrulandi', findings: [0] }],
    decision: { choice: 'Karar' },
    actions: [{ text: 'A1', owner: 'Ali', dueDate: '2026-08-01', rcIdx: '0' }],
    tracking: [{ label: 'Eyl', value: '44' }],
    retro: { valid: 'Evet, kök neden doğruydu' }
  };
  assert.equal(caseMaturity(c).key, 'dogrulandi');
});
