// Açılış ekranı: ilk ziyarette uygulamanın ne olduğunu ve neler yapabildiğini
// tek sayfada anlatır. "Görüldü" bilgisi vaka verisinden AYRI bir anahtarda
// tutulur (pcx_intro_v1) — yedek al/geri yükle akışını etkilemez.
// Paylaşım linkleri bu ekranı atlar (App.jsx'te SharedView önceliklidir).

import React from 'react';
import { useStore } from '../lib/store.jsx';
import { stepsFor } from '../lib/defaults.js';
import { LogoMark } from '../ui/Logo.jsx';
import { HButton } from '../ui/primitives.jsx';

export default function Landing({ onEnter }) {
  const { lang, t, setLang, upd } = useStore();
  const steps = stepsFor(lang);

  const FEATURES = [
    { icon: '🧭', title: t('8 adımlı rehberli akış', 'A guided 8-step flow'), desc: t('Problem tanımından çalışma raporuna: Toyota A3/PDCA disipliniyle, her adımda tamamlanma ölçütleri ve yöntem açıklamalarıyla ilerlersiniz.', 'From problem definition to the case report: you move with Toyota A3/PDCA discipline, completion criteria and method notes at every step.') },
    { icon: '⚡', title: t('Triyaj ve Hızlı Çözüm', 'Triage and Quick Solve'), desc: t('Her problem aynı derinliği hak etmez: fayda/maliyet triyajı doğru akışı önerir. 15-20 dakikalık sorunlar tek ekranda çözülür; derinleşirse tek tıkla tam akışa terfi eder — girdiler kayıpsız taşınır.', 'Not every problem deserves the same depth: a benefit/cost triage suggests the right flow. 15-20 minute problems are solved on one screen; if they run deeper, one click promotes them to the full flow — entries carry over losslessly.') },
    { icon: '🧰', title: t('Kanıtlanmış yöntem seti', 'A proven method set'), desc: t('5 Neden, balık kılçığı, SIPOC, VAR/YOK (Kepner-Tregoe), Pareto, ağırlıklı karar matrisi, pre-mortem, FMEA ve kuvvet alanı analizi — tek akışın içinde, birbirine bağlı.', '5 Whys, fishbone, SIPOC, IS / IS-NOT (Kepner-Tregoe), Pareto, weighted decision matrix, pre-mortem, FMEA and force field analysis — inside one connected flow.') },
    { icon: '⚖️', title: t('Karar disiplini', 'Decision discipline'), desc: t('Karar zamanlaması (ASAP/ALAP + durma işareti), "ve sonra ne olacak?" (ikinci basamak), dış görünüm ve izlemede tetik çizgileri — karar yalnız doğru değil, doğru zamanda ve yan etkileri düşünülmüş olur.', 'Decision timing (ASAP/ALAP + a stop signal), "and then what?" (second-order effects), the outside view and tripwires in tracking — decisions come out not just right, but on time and with side effects considered.') },
    { icon: '🤖', title: t('YZ rehber ve asistan', 'AI coach and assistant'), desc: t('Her adımda probleminize özgü öneri taslakları, pre-mortem senaryoları, benzer vaka sentezi ve kararınızı çürütmeye çalışan Şeytanın Avukatı. Öneriler hipotezdir — doğrulama rozetiyle gelir, yazdıklarınız asla ezilmez.', "Step-specific suggestion drafts, pre-mortem scenarios, similar-case synthesis and a Devil's Advocate that tries to refute your decision. Suggestions are hypotheses — they carry a verification badge, and your own text is never overwritten.") },
    { icon: '🧠', title: t('Zihin Kontrolü', 'Mind Check'), desc: t('Her adımda o adımda en sık düşülen bilişsel yanılgılar, panzehir soruları ve ekibinize soracağınız doğru sorular elinizin altında.', 'At every step: the biases you are most prone to right there, antidote questions, and the right questions to ask your team.') },
    { icon: '🕸', title: t('Vaka haritası ve raporlar', 'Case map and reports'), desc: t('Verinizden türeyen bağlantı haritası kopuk halkaları gösterir; A3 tek sayfa özeti, grafikleriyle basılan tam rapor (kılçık, Pareto, kuvvet alanı), vaka panosu ve salt-okunur paylaşım linki.', 'A connection map derived from your data reveals broken links; an A3 one-pager, a full report that prints with its charts (fishbone, Pareto, force field), a case dashboard and a read-only share link.') },
    { icon: '🔒', title: t('Verileriniz sizde kalır', 'Your data stays with you'), desc: t('Tüm girdiler yalnızca bu tarayıcıda saklanır; sunucuya gönderilmez. Türkçe/İngilizce çift dil, açık/koyu tema, JSON yedekleme, PDF/Word/Excel referans yükleme.', 'All input is stored only in this browser; nothing is sent to a server. Turkish/English bilingual, light/dark theme, JSON backup, PDF/Word/Excel reference upload.') }
  ];

  const enter = openExample => {
    if (openExample) upd(n => { if (n.cases.ornek) { n.activeCase = 'ornek'; n.step = 1; } });
    onEnter();
  };

  return (
    <div data-app-root="1" style={{ minHeight: '100vh', background: 'var(--bg)', overflow: 'auto' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 24px 60px' }}>
        {/* Üst şerit: dil seçimi */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 0, marginBottom: 8 }}>
          <div role="group" aria-label="Dil / Language" style={{ display: 'flex', border: '1px solid var(--field-border)', borderRadius: 6, overflow: 'hidden' }}>
            {[['tr', 'Türkçe'], ['en', 'English']].map(([k, lb]) => (
              <button key={k} type="button" onClick={() => setLang(k)} aria-pressed={lang === k}
                style={{ padding: '6px 12px', border: 'none', cursor: 'pointer', background: lang === k ? 'var(--pri)' : 'var(--surface)', color: lang === k ? 'var(--on-pri)' : 'var(--ink-3)', font: '600 11.5px Helvetica,Arial,sans-serif' }}
              >{lb}</button>
            ))}
          </div>
        </div>

        {/* Kahraman bölümü */}
        <div style={{ textAlign: 'center', padding: '26px 0 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><LogoMark size={64} /></div>
          <h1 style={{ margin: 0, font: '700 34px/1.2 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>
            Problem<span style={{ color: 'var(--pri)' }}>Lab</span>
          </h1>
          <div style={{ font: '600 15px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', marginTop: 6 }}>
            {t('Problemi tanımlayın, kök nedeni doğrulayın, doğru kararı uygulayın.', 'Define the problem, verify the root cause, execute the right decision.')}
          </div>
          <p style={{ maxWidth: 640, margin: '14px auto 0', font: '14.5px/1.7 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>
            {t('ProblemLab, bir iş problemini — hangi alanda olursa olsun — kanıtlanmış problem çözme metodolojisiyle uçtan uca çözdüren, YZ destekli bir çalışma aracıdır. Varsayımları veriden ayırır, kök nedeni doğrulatır, kararınızı sınar ve sonucu KPI ile takip ettirir. İçindeki iki dolu örnek vaka, yöntemi baştan sona gösterir.',
              'ProblemLab is an AI-assisted workbench that takes a business problem — in any domain — end to end through a proven problem-solving methodology. It separates assumptions from data, makes you verify the root cause, stress-tests your decision, and tracks the outcome against the KPI. Two fully worked example cases show the method end to end.')}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 22 }}>
            <HButton
              onClick={() => enter(false)}
              style={{ padding: '12px 26px', border: '1px solid var(--pri)', borderRadius: 9, background: 'var(--pri)', color: 'var(--on-pri)', font: '700 14px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={{ background: 'var(--pri-hover)' }}
            >{t('Hemen başla →', 'Get started →')}</HButton>
            <HButton
              onClick={() => enter(true)}
              style={{ padding: '12px 22px', border: '1px solid var(--pri-border)', borderRadius: 9, background: 'var(--surface)', color: 'var(--pri)', font: '600 14px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={{ background: 'var(--pri-soft)' }}
            >{t('Önce örnek çalışmaları incele', 'Explore the example cases first')}</HButton>
          </div>
        </div>

        {/* 8 adım şeridi */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '16px 18px', marginBottom: 18 }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px', marginBottom: 10 }}>{t('8 ADIMDA UÇTAN UCA', 'END TO END IN 8 STEPS')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{ flex: 'none', width: 20, height: 20, borderRadius: '50%', background: 'var(--pri-soft)', color: 'var(--pri)', font: '700 10.5px/20px Helvetica,Arial,sans-serif', textAlign: 'center' }}>{i + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: '600 12px/1.35 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{s.title}</div>
                  <div style={{ font: '10.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Özellik kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '15px 17px' }}>
              <div style={{ font: '20px/1 Helvetica,Arial,sans-serif', marginBottom: 8 }} aria-hidden="true">{f.icon}</div>
              <div style={{ font: '700 13.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', marginBottom: 5 }}>{f.title}</div>
              <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--ink-4)' }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Alt not */}
        <div style={{ textAlign: 'center', font: '11.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
          {t('Girdileriniz yalnızca bu tarayıcıda saklanır — hesap gerekmez, sunucuya veri gönderilmez. Bu ekrana kenar çubuğundaki "Tanıtım" bağlantısından her zaman dönebilirsiniz.',
            'Your input is stored only in this browser — no account needed, no data sent to a server. You can return to this screen anytime via the "Intro" link in the sidebar.')}
        </div>
      </div>
    </div>
  );
}
