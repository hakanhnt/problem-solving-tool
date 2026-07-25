// Adım 1'de, çalışma henüz boşken gösterilen karşılama kartı:
// akışın dört evresini, üç temel ilkeyi ve başlangıç kısayollarını anlatır.

import React from 'react';
import { useStore } from '../lib/store.jsx';
import { HButton, HA } from '../ui/primitives.jsx';

const PHASES = [
  { steps: '1', title: 'Tanımla', text: 'Ölçülmüş sapmayı, kapsamı ve KPI farkını yaz' },
  { steps: '2–5', title: 'Analiz et', text: "Driver'lar → bulgular → 5 Neden ile kök neden" },
  { steps: '6', title: 'Karar ver', text: 'Alternatif üret, kriterlerle yarıştır, gerekçeni yaz' },
  { steps: '7–8', title: 'İzle ve paylaş', text: 'Aksiyon, KPI trendi, retrospektif ve rapor' }
];

const PRINCIPLES = [
  ['Problem ≠ bulgu ≠ kök neden', 'Araç bu ayrımı her adımda korur; 1–4. adımlarda çözüm konuşulmaz.'],
  ['YZ önerir, siz doğrularsınız', 'Rehberin ürettiği her kayıt "doğrulanmadı" rozetiyle gelir.'],
  ['Kök nedeni önce kendimizde ararız', 'Analiz dış paydaşı suçlamak yerine kendi süreç ve ölçüm boşluğumuza bakar.']
];

export default function WelcomeCard() {
  const { state, upd, goStep } = useStore();
  const c = state.cases[state.activeCase] || {};
  const filled = !!((c.problem && c.problem.statement) || '').trim();
  if (filled || state.hideWelcome) return null;

  const openExample = () => {
    upd(n => { n.activeCase = 'ornek'; n.step = 1; });
    setTimeout(() => goStep(1), 30);
  };

  return (
    <div data-noprint="1" style={{ border: '1px solid #c9d4e2', borderRadius: 12, overflow: 'hidden', margin: '0 0 22px', background: '#fff' }}>
      <div style={{ padding: '18px 20px 16px', background: 'linear-gradient(180deg,#eef2f7 0%,#f7f9fc 100%)', borderBottom: '1px solid #dbe4ef' }}>
        <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: '#5f7897', letterSpacing: '1.1px' }}>HOŞ GELDİNİZ</div>
        <div style={{ font: '700 19px/1.3 Helvetica,Arial,sans-serif', color: '#26241f', margin: '6px 0 6px' }}>Bir problemi baştan sona, doğru sırayla çözelim</div>
        <div style={{ font: '13px/1.65 Helvetica,Arial,sans-serif', color: '#3e4a5a', maxWidth: 620 }}>
          Bu araç, bir iş problemini ölçülmüş sapmadan kök nedene, karardan aksiyona kadar tek akışta çözdürür.
          Her adımda yapay zekâ rehberi probleminize özgü aday girdiler ve doğrulama soruları üretir; siz doğrular,
          düzenler ve kararı kendiniz verirsiniz. Alan fark etmez: lojistik, pazarlama, teknoloji, operasyon, İK, finans.
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, borderBottom: '1px solid #eceae5' }}>
        {PHASES.map((p, i) => (
          <div key={p.title} style={{ position: 'relative', background: '#fbfaf8', border: '1px solid #e8e5df', borderRadius: 9, padding: '11px 12px' }}>
            <div style={{ display: 'flex', gap: 7, alignItems: 'center', margin: '0 0 4px' }}>
              <span style={{ flex: 'none', background: '#35506e', color: '#fff', borderRadius: 5, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 6px' }}>{p.steps}</span>
              <span style={{ font: '700 12.5px Helvetica,Arial,sans-serif', color: '#26241f' }}>{p.title}</span>
            </div>
            <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: '#6d6860' }}>{p.text}</div>
            {i < PHASES.length - 1 ? (
              <div style={{ position: 'absolute', right: -8, top: '50%', marginTop: -7, font: '13px/1 Helvetica,Arial,sans-serif', color: '#b9cbe0' }}>›</div>
            ) : null}
          </div>
        ))}
      </div>

      <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 7, borderBottom: '1px solid #eceae5' }}>
        {PRINCIPLES.map(([t, d]) => (
          <div key={t} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <div style={{ flex: 'none', width: 16, height: 16, borderRadius: '50%', background: '#eef4ee', color: '#4a6741', font: '700 10px/16px Helvetica,Arial,sans-serif', textAlign: 'center', marginTop: 1 }}>✓</div>
            <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: '#3d3a34' }}>
              <strong>{t}</strong> <span style={{ color: '#8a857c' }}>— {d}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '13px 20px', display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, font: '12px/1.5 Helvetica,Arial,sans-serif', color: '#8a857c' }}>
          Aşağıya problem ifadenizi yazarak başlayın — rehber, tanım girildikten sonra tüm adımlarda devreye girer.
        </div>
        {state.activeCase !== 'ornek' ? (
          <HButton
            onClick={openExample}
            style={{ flex: 'none', padding: '8px 14px', border: '1px solid #35506e', borderRadius: 8, background: '#fff', color: '#35506e', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: '#eef2f7' }}
          >Önce örnek çalışmayı gez</HButton>
        ) : null}
        <HA
          href="/rehber.html" target="_blank" rel="noreferrer"
          style={{ flex: 'none', padding: '8px 14px', border: '1px solid #d6d3ce', borderRadius: 8, background: '#fff', color: '#57534b', font: '600 12px Helvetica,Arial,sans-serif', textDecoration: 'none' }}
          hover={{ background: '#f1efeb' }}
        >📖 Kullanım rehberi</HA>
        <HButton
          onClick={() => upd(n => { n.hideWelcome = true; })}
          title="Bu karşılama kartını bir daha gösterme"
          style={{ flex: 'none', padding: '8px 12px', border: 'none', background: 'transparent', color: '#a9a49b', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
          hover={{ color: '#57534b' }}
        >Gizle</HButton>
      </div>
    </div>
  );
}
