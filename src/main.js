import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import './styles/variables.css';
import './styles/main.css';

import initHero from './sections/hero.js';
import initTrustBar from './sections/trust-bar.js';
import initBeforeAfter from './sections/before-after.js';
import initServices from './sections/services.js';
import initFaq from './sections/faq.js';
import initInteriorTour from './sections/interior-tour.js';
import initPortfolio from './sections/portfolio.js';
import initProcess from './sections/process.js';
import initTestimonials from './sections/testimonials.js';
import initQuoteMarquee from './sections/marquee.js';
import initInstagram from './sections/instagram.js';
import initCta from './sections/cta.js';
import initFooter from './sections/footer.js';
import lineReveal from './utils/lineSplit.js';

gsap.registerPlugin(ScrollTrigger);

/* ---------- Lenis smooth scrolling (drives GSAP's ticker) ---------- */
const lenis = new Lenis({
  lerp: 0.09, // 0.09 ≈ 90ms — gentle, expensive-feeling glide
  smoothWheel: true,
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

window.lenis = lenis; // handy for debugging / anchor scrolling

/* ---------- Smooth Scroll to Anchor Links using Lenis ---------- */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const targetId = anchor.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      lenis.scrollTo(target);
    }
  });
});

/* ---------- Header: solid backdrop once scrolled past the hero ---------- */
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 80);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

initHeader();
initHero();
initTrustBar();
initBeforeAfter();
initServices();
initFaq();
initInteriorTour();
initPortfolio();
initProcess();
initTestimonials();
initQuoteMarquee();
initInstagram();
initCta();
initFooter();

/* Editorial line reveals on section headings (hero has its own reveal). */
lineReveal('[data-reveal-line]');

/* Recalculate triggers once every image/webfont is in. */
window.addEventListener('load', () => ScrollTrigger.refresh());
