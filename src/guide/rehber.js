// Kullanım rehberi sayfalarının (rehber.html, guide.html) davranışı: içindekilerde bulunulan bölümü
// işaretleme, dar ekranda içindekiler menüsü ve yazdırma hazırlığı.
// Tema, ilk boyamada titreme olmasın diye rehber.html içinde ayarlanır.

import '@fontsource-variable/archivo/wdth.css';
import '../index.css';
import './rehber.css';

const toc = document.getElementById('g-toc');
const toggle = document.querySelector('.g-toc-toggle');
const links = Array.from(toc.querySelectorAll('a[href^="#"]'));

const bar = document.querySelector('.g-bar');
const setMenu = open => {
  if (open) toc.style.top = bar.offsetHeight + 'px';
  toc.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
};
toggle.addEventListener('click', () => setMenu(!toc.classList.contains('is-open')));
links.forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

// Bulunulan bölüm: üst çubuğun hemen altındaki çizgiyi geçmiş son başlık.
const targets = links.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
let ticking = false;
const markCurrent = () => {
  ticking = false;
  const line = 90;
  let current = targets[0];
  for (const el of targets) {
    if (el.getBoundingClientRect().top - line <= 0) current = el;
  }
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = targets[targets.length - 1];
  links.forEach(a => {
    if (a.getAttribute('href') === '#' + current.id) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
};
window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(markCurrent); } }, { passive: true });
markCurrent();

// Bağlantıyla gelinen bölüm katlıysa açılır (örn. #sss içindeki bir soru).
const openTarget = () => {
  const el = location.hash && document.getElementById(location.hash.slice(1));
  if (el && el.tagName === 'DETAILS') el.open = true;
};
window.addEventListener('hashchange', openTarget);
openTarget();

// Yazdırma: kâğıt her zaman açık temada ve katlı bölümler açık basılır.
let printState = null;
window.addEventListener('beforeprint', () => {
  const root = document.documentElement;
  const closed = Array.from(document.querySelectorAll('details:not([open])'));
  printState = { theme: root.getAttribute('data-theme'), closed };
  root.setAttribute('data-theme', 'light');
  closed.forEach(d => { d.open = true; });
});
window.addEventListener('afterprint', () => {
  if (!printState) return;
  document.documentElement.setAttribute('data-theme', printState.theme);
  printState.closed.forEach(d => { d.open = false; });
  printState = null;
});
document.querySelector('[data-print]').addEventListener('click', () => window.print());

// Dil bağlantısı açık sayfanın tema parametresini ve bölümünü korur.
const langLink = document.querySelector('[data-lang-switch]');
if (langLink) langLink.href = langLink.getAttribute('href').split(/[?#]/)[0] + location.search;
