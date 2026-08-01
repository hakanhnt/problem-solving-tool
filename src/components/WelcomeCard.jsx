// Adım 1'de, çalışma henüz boşken gösterilen karşılama kartı:
// akışın dört evresini, üç temel ilkeyi ve başlangıç kısayollarını anlatır.

import React from 'react';
import { useStore } from '../lib/store.jsx';
import { HButton, HA } from '../ui/primitives.jsx';

const PHASES = t => [
  { steps: '1', title: t('Tanımla', 'Define'), text: t('Ölçülmüş sapmayı, kapsamı ve KPI farkını yaz', 'Write the measured deviation, the scope, and the KPI gap') },
  { steps: '2–5', title: t('Analiz et', 'Analyze'), text: t("İş sürücüleri → bulgular → 5 Neden ile kök neden", 'Business drivers → findings → root cause via 5 Whys') },
  { steps: '6', title: t('Karar ver', 'Decide'), text: t('Alternatif üret, kriterlerle yarıştır, gerekçeni yaz', 'Generate alternatives, compare them against criteria, write your rationale') },
  { steps: '7–8', title: t('İzle ve paylaş', 'Track and share'), text: t('Aksiyon, KPI trendi, retrospektif ve rapor', 'Actions, KPI trend, retrospective, and report') }
];

const PRINCIPLES = t => [
  [t('Problem ≠ bulgu ≠ kök neden', 'Problem ≠ finding ≠ root cause'), t('Araç bu ayrımı her adımda korur; 1–4. adımlarda çözüm konuşulmaz.', 'The tool preserves this distinction at every step; no solutions are discussed in steps 1–4.')],
  [t('YZ önerir, siz doğrularsınız', 'AI suggests, you verify'), t('Rehberin ürettiği her kayıt "doğrulanmadı" rozetiyle gelir.', 'Every entry the coach produces arrives with an "unverified" badge.')],
  [t('Kök nedeni önce kendimizde ararız', 'We look for the root cause in ourselves first'), t('Analiz dış paydaşı suçlamak yerine kendi süreç ve ölçüm boşluğumuza bakar.', 'The analysis examines our own process and measurement gaps instead of blaming external stakeholders.')]
];

export default function WelcomeCard() {
  const { state, upd, goStep, t } = useStore();
  const c = state.cases[state.activeCase] || {};
  const filled = !!((c.problem && c.problem.statement) || '').trim();
  if (filled || state.hideWelcome) return null;

  const openExample = () => {
    upd(n => { n.activeCase = 'ornek'; n.step = 1; });
    setTimeout(() => goStep(1), 30);
  };

  const phases = PHASES(t);

  return (
    <div data-noprint="1" style={{ border: '1px solid var(--pri-border-2)', borderRadius: 12, overflow: 'hidden', margin: '0 0 22px', background: 'var(--surface)' }}>
      <div style={{ padding: '18px 20px 16px', background: 'linear-gradient(180deg,var(--pri-soft) 0%,var(--brand-grad) 100%)', borderBottom: '1px solid var(--pri-border-5)' }}>
        <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '1.1px' }}>{t('HOŞ GELDİNİZ', 'WELCOME')}</div>
        <div style={{ font: '700 19px/1.3 Helvetica,Arial,sans-serif', color: 'var(--ink)', margin: '6px 0 6px' }}>{t('Bir problemi baştan sona, doğru sırayla çözelim', "Let's solve a problem end to end, in the right order")}</div>
        <div style={{ font: '13px/1.65 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', maxWidth: 620 }}>
          {t('Bu araç, bir iş problemini ölçülmüş sapmadan kök nedene, karardan aksiyona kadar tek akışta çözdürür. Her adımda yapay zekâ rehberi probleminize özgü aday girdiler ve doğrulama soruları üretir; siz doğrular, düzenler ve kararı kendiniz verirsiniz. Alan fark etmez: lojistik, pazarlama, teknoloji, operasyon, İK, finans.', 'This tool walks a business problem through a single flow — from measured deviation to root cause, from decision to action. At every step the AI coach generates candidate inputs and verification questions specific to your problem; you verify, edit, and make the decision yourself. Any domain works: logistics, marketing, technology, operations, HR, finance.')}
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, borderBottom: '1px solid var(--line-3)' }}>
        {phases.map((p, i) => (
          <div key={p.title} style={{ position: 'relative', background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 9, padding: '11px 12px' }}>
            <div style={{ display: 'flex', gap: 7, alignItems: 'center', margin: '0 0 4px' }}>
              <span style={{ flex: 'none', background: 'var(--pri)', color: 'var(--on-pri)', borderRadius: 5, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 6px' }}>{p.steps}</span>
              <span style={{ font: '700 12.5px Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{p.title}</span>
            </div>
            <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-4)' }}>{p.text}</div>
            {i < phases.length - 1 ? (
              <div style={{ position: 'absolute', right: -8, top: '50%', marginTop: -7, font: '13px/1 Helvetica,Arial,sans-serif', color: 'var(--pri-border)' }}>›</div>
            ) : null}
          </div>
        ))}
      </div>

      <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 7, borderBottom: '1px solid var(--line-3)' }}>
        {PRINCIPLES(t).map(([t2, d]) => (
          <div key={t2} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <div style={{ flex: 'none', width: 16, height: 16, borderRadius: '50%', background: 'var(--ok-soft)', color: 'var(--ok)', font: '700 10px/16px Helvetica,Arial,sans-serif', textAlign: 'center', marginTop: 1 }}>✓</div>
            <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-2)' }}>
              <strong>{t2}</strong> <span style={{ color: 'var(--muted)' }}>— {d}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '13px 20px', display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
          {t('Aşağıya problem ifadenizi yazarak başlayın — rehber, tanım girildikten sonra tüm adımlarda devreye girer.', 'Start by writing your problem statement below — once the definition is entered, the coach engages at every step.')}
        </div>
        {state.activeCase !== 'ornek' ? (
          <HButton
            onClick={openExample}
            style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--surface)', color: 'var(--pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--pri-soft)' }}
          >{t('Önce örnek çalışmayı gez', 'Tour the example case first')}</HButton>
        ) : null}
        <HA
          href={'/rehber.html' + (state.theme === 'dark' ? '?tema=koyu' : '')} target="_blank" rel="noreferrer"
          style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--field-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12px Helvetica,Arial,sans-serif', textDecoration: 'none' }}
          hover={{ background: 'var(--surface-4)' }}
        >{t('📖 Kullanım rehberi', '📖 User guide')}</HA>
        <HButton
          onClick={() => upd(n => { n.hideWelcome = true; })}
          title={t('Bu karşılama kartını bir daha gösterme', "Don't show this welcome card again")}
          style={{ flex: 'none', padding: '8px 12px', border: 'none', background: 'transparent', color: 'var(--muted-2)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
          hover={{ color: 'var(--ink-3)' }}
        >{t('Gizle', 'Hide')}</HButton>
      </div>
    </div>
  );
}
