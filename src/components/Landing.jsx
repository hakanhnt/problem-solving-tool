// Açılış ekranı: uygulamanın ne olduğunu ve neden işe yaradığını tek sayfada
// anlatır. Uygulama her yeni sekmede/pencerede açıldığında gösterilir (sayfa
// yenilemede tekrar gelmez); kullanıcı "Bir daha gösterme" ile kapatabilir.
// Bu bilgiler vaka verisinden AYRI anahtarlarda tutulur — yedek al/geri yükle
// akışını etkilemez. Paylaşım linkleri bu ekranı atlar (App.jsx'te SharedView
// önceliklidir). Görsel dil Landing.css'te; kahramandaki vaka gösterimi
// LandingDemo.jsx'te.

import React from 'react';
import '@fontsource-variable/archivo/wdth.css';
import './Landing.css';
import { useStore } from '../lib/store.jsx';
import { stepsFor } from '../lib/defaults.js';
import { LogoMark, Wordmark } from '../ui/Logo.jsx';
import LandingDemo from './LandingDemo.jsx';

const HIDE_KEY = 'pcx_intro_hide';   // localStorage: "bir daha gösterme"
const SEEN_KEY = 'pcx_intro_seen';   // sessionStorage: bu oturumda uygulamaya girildi
const FORCE_KEY = 'pcx_intro_force'; // sessionStorage: 🏠 Tanıtım düğmesiyle istendi

const read = (store, k) => { try { return store.getItem(k) === '1'; } catch (e) { return false; } };

/** Açılışta Tanıtım gösterilmeli mi? */
export function introShouldShow() {
  return read(sessionStorage, FORCE_KEY) || (!read(sessionStorage, SEEN_KEY) && !read(localStorage, HIDE_KEY));
}

/** 🏠 Tanıtım düğmesi: "bir daha gösterme" seçilmiş olsa da ekranı açar. */
export function reopenIntro() {
  try { sessionStorage.setItem(FORCE_KEY, '1'); } catch (e) { /* gizli mod */ }
  location.reload();
}

function markEntered(hide) {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
    sessionStorage.removeItem(FORCE_KEY);
    if (hide) localStorage.setItem(HIDE_KEY, '1'); else localStorage.removeItem(HIDE_KEY);
  } catch (e) { /* gizli mod */ }
}

const SAMPLE = k => k === 'ornek' || k === 'ornek2';

// Akışın dört evresi ve kapsadıkları adımlar (WelcomeCard ile aynı gruplama).
const PHASES = [[1], [2, 3, 4, 5], [6], [7, 8]];

export default function Landing({ onEnter }) {
  const { lang, t, setLang, upd } = useStore();
  const steps = stepsFor(lang);
  const [hide, setHide] = React.useState(() => read(localStorage, HIDE_KEY));

  // Örnek vaka → ilk örnek; kendi problemi → açık çalışma örnekse kullanıcının ilk kendi çalışması.
  const enter = openExample => {
    upd(n => {
      if (openExample) {
        if (n.cases.ornek) { n.activeCase = 'ornek'; n.step = 1; }
      } else if (SAMPLE(n.activeCase)) {
        const own = Object.keys(n.cases).find(k => !SAMPLE(k));
        if (own) { n.activeCase = own; n.step = 1; }
      }
      n.dashOpen = false;
    });
    markEntered(hide);
    onEnter();
  };

  const phaseNames = [t('Tanımla', 'Define'), t('Analiz et', 'Analyze'), t('Karar ver', 'Decide'), t('İzle ve paylaş', 'Track and share')];

  const TRAPS = [
    {
      trap: t('Toplantı bir çözümle başlıyor.', 'The meeting starts with a solution.'),
      fix: t('İlk adımda rehber, problem ifadenizdeki çözüm ve suçlama dilini ayıklar. Geriye hedef ile gerçekleşen arasındaki ölçülmüş fark kalır; herkes aynı problemi konuşur.',
        'In the first step the coach strips solution and blame language out of your problem statement. What remains is the measured gap between target and actual, so everyone talks about the same problem.')
    },
    {
      trap: t('İlk bulgu kök neden sanılıyor.', 'The first finding is mistaken for the root cause.'),
      fix: t('Problem, bulgu ve kök neden ayrı tutulur. 5 Neden, balık kılçığı ve VAR/YOK analiziyle kurulan her kök neden, bir test planı ve sonucuyla doğrulanmadan kesinleşmez.',
        'Problem, finding and root cause are kept apart. Each root cause you build with 5 Whys, a fishbone or IS / IS-NOT stays open until a test plan and its result confirm it.')
    },
    {
      trap: t('Karar veriliyor, sonra unutuluyor.', 'A decision is made, then forgotten.'),
      fix: t('Alternatifler kriterlerle yarışır, gerekçe yazılır. Aksiyonlar sahip ve tarihle izlenir; KPI trendi ve tetik çizgileri kararın tutup tutmadığını gösterir.',
        'Alternatives compete on weighted criteria and the rationale is written down. Actions are tracked with owners and dates; the KPI trend and tripwires show whether the decision is holding.')
    }
  ];

  const ctas = (
    <div className="pl-ctas">
      <button type="button" className="pl-btn pl-btn-pri" onClick={() => enter(false)}>{t('Kendi problemimle başla', 'Start with my own problem')}</button>
      <button type="button" className="pl-btn pl-btn-sec" onClick={() => enter(true)}>{t('Örnek vakayı incele', 'Explore the example case')}</button>
    </div>
  );

  return (
    <div data-app-root="1" className="pl">
      <div className="pl-wrap">
        <header className="pl-top">
          <div className="pl-brand"><LogoMark size={32} /><Wordmark size={17} /></div>
          <div className="pl-lang" role="group" aria-label="Dil / Language">
            {[['tr', 'Türkçe'], ['en', 'English']].map(([k, lb]) => (
              <button key={k} type="button" onClick={() => setLang(k)} aria-pressed={lang === k}>{lb}</button>
            ))}
          </div>
        </header>

        <section className="pl-hero">
          <div>
            <h1 className="pl-h1">{t('Çözmeden önce doğru problemi bulun.', 'Find the right problem before you fix it.')}</h1>
            <p className="pl-lede">
              {t('ProblemLab, “şunu yapalım” diye başlayan toplantıları ölçülmüş bir probleme, veriyle sınanmış bir kök nedene ve takip edilen bir karara dönüştürür. Sekiz adım boyunca bir rehber yanınızda; hangi alanda çalışırsanız çalışın.',
                'ProblemLab turns meetings that start with “let’s just do X” into a measured problem, a root cause tested against data, and a decision you actually track. A coach walks you through eight steps, whatever field you work in.')}
            </p>
            {ctas}
            <p className="pl-fine">{t('Hesap gerekmez. Girdileriniz yalnızca bu tarayıcıda kalır.', 'No account needed. Your input stays in this browser.')}</p>
            <label className="pl-check">
              <input type="checkbox" checked={hide} onChange={e => setHide(e.target.checked)} />
              {t('Bir daha gösterme, açılışta doğrudan uygulamaya gir', 'Don’t show this again; open straight into the app')}
            </label>
          </div>
          <LandingDemo onOpenExample={() => enter(true)} />
        </section>
      </div>

      <section className="pl-sec">
        <div className="pl-wrap pl-sec-grid">
          <div>
            <h2 className="pl-h2">{t('Çözümler neden tutmuyor?', 'Why fixes don’t stick')}</h2>
            <p className="pl-sec-lede">{t('Çoğu problem yanlış yöntemden değil, atlanan bir adımdan dolayı geri döner. ProblemLab bu adımları atlatmaz.', 'Most problems come back not because of a bad method but because a step was skipped. ProblemLab won’t let you skip them.')}</p>
          </div>
          <ul className="pl-traps">
            {TRAPS.map((x, i) => (
              <li key={i} className="pl-trap">
                <p className="pl-trap-t">{x.trap}</p>
                <p className="pl-trap-f">{x.fix}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="pl-sec">
        <div className="pl-wrap">
          <h2 className="pl-h2">{t('Sekiz adım, dört evre', 'Eight steps, four phases')}</h2>
          <p className="pl-sec-lede" style={{ maxWidth: '40em' }}>{t('Her adımın tamamlanma ölçütleri ve yöntem açıklaması var. Eksik kalan ölçüt, ilerlemeden önce size gösterilir.', 'Every step has completion criteria and a method note. Anything still missing is shown to you before you move on.')}</p>
          <div className="pl-phases">
            {PHASES.map((nums, pi) => (
              <div key={pi} className="pl-phase">
                <div className="pl-phase-h">
                  <b>{phaseNames[pi]}</b>
                  <span>{nums.length > 1 ? t('Adım ', 'Steps ') + nums[0] + '–' + nums[nums.length - 1] : t('Adım ', 'Step ') + nums[0]}</span>
                </div>
                <ol className="pl-steps">
                  {nums.map(n => (
                    <li key={n} className="pl-step">
                      <span className="pl-step-n">{n}</span>
                      <span><b>{steps[n - 1].title}</b><small>{steps[n - 1].sub}</small></span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <p className="pl-quick">
            {t('Her problem sekiz adımı hak etmez. Fayda ve maliyet triyajı küçük sorunları 15–20 dakikalık hızlı çözüme yönlendirir; sorun derinleşirse girdiğiniz her şey tam akışa taşınır.',
              'Not every problem deserves eight steps. A benefit and cost triage sends small issues to a 15–20 minute quick solve; if the issue runs deeper, everything you entered carries over to the full flow.')}
          </p>
        </div>
      </section>

      <section className="pl-sec">
        <div className="pl-wrap pl-ai">
          <div>
            <h2 className="pl-h2">{t('Yapay zekâ önerir, siz doğrularsınız.', 'AI suggests. You verify.')}</h2>
            <p>{t('Rehber, probleminize özgü taslaklar hazırlar: iş sürücüleri, olası nedenler, pre-mortem senaryoları, kararınızı çürütmeye çalışan bir şeytanın avukatı. Her öneri bir hipotez olarak gelir ve siz veriyle doğrulayana kadar işaretli kalır. Yazdığınız hiçbir şeyin üzerine yazılmaz.',
              'The coach drafts suggestions specific to your problem: business drivers, possible causes, pre-mortem scenarios, a devil’s advocate that tries to break your decision. Every suggestion arrives as a hypothesis and stays flagged until you verify it with data. Nothing you wrote is ever overwritten.')}</p>
            <p>{t('Her adımda, o adımda en sık düşülen bilişsel yanılgılar ve ekibinize sorulacak sorular da elinizin altında.', 'At every step, the cognitive biases most likely to catch you there, and the questions to ask your team, are one click away.')}</p>
          </div>
          <div>
            <div className="pl-sugg" role="group" aria-label={t('Örnek: YZ önerileri ve doğrulama durumu', 'Example: AI suggestions and their verification status')}>
              <div className="pl-sugg-row">
                <span className="pl-yz" aria-hidden="true">YZ</span>
                <span>{t('Evrak hazırlığı, booking → yükleme süresini uzatıyor olabilir.', 'Document preparation may be stretching booking → loading.')}</span>
                <span className="pl-tag">{t('Doğrulanmadı', 'Not verified')}</span>
              </div>
              <div className="pl-sugg-row">
                <span className="pl-yz ok" aria-hidden="true">YZ</span>
                <span>{t('Gümrükte beyanname açılışı hedefin 4 gün üzerinde.', 'Customs declaration filing runs 4 days over target.')}</span>
                <span className="pl-tag ok">{t('Veriyle doğrulandı', 'Verified with data')}</span>
              </div>
            </div>
            <p className="pl-methods">
              {t('İçindeki yöntemler: 5 Neden, balık kılçığı, SIPOC, VAR/YOK (Kepner-Tregoe), Pareto, ağırlıklı karar matrisi, pre-mortem, FMEA ve kuvvet alanı analizi. Hepsi aynı vakanın verisine bağlı; birinde yazdığınız diğerine akar.',
                'Methods inside: 5 Whys, fishbone, SIPOC, IS / IS-NOT (Kepner-Tregoe), Pareto, weighted decision matrix, pre-mortem, FMEA and force field analysis. All of them share one case’s data; what you write in one flows into the next.')}
            </p>
          </div>
        </div>
      </section>

      <section className="pl-end">
        <div className="pl-wrap">
          <h2 className="pl-h2">{t('Masanızdaki problemi bugün tanımlayın.', 'Define the problem on your desk today.')}</h2>
          <ul className="pl-facts">
            <li>{t('Hesap ve kurulum gerekmez', 'No account or install')}</li>
            <li>{t('Veriler yalnızca bu tarayıcıda', 'Data stays in this browser')}</li>
            <li>{t('JSON yedek, PDF ve Word rapor', 'JSON backup, PDF and Word reports')}</li>
            <li>{t('Türkçe ve İngilizce', 'Turkish and English')}</li>
          </ul>
          {ctas}
          <p className="pl-foot">{t('Bu ekrana kenar çubuğundaki Tanıtım düğmesinden her zaman dönebilirsiniz.', 'You can come back to this screen any time from the Intro button in the sidebar.')}</p>
        </div>
      </section>
    </div>
  );
}
