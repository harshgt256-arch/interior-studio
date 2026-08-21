import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initCanvasScrub, frameUrl } from '../utils/canvasScrub.js';

gsap.registerPlugin(ScrollTrigger);

const DESKTOP_QUERY = '(min-width: 768px)';

/**
 * Hero — first section below the fixed nav.
 *
 * Desktop (>= 768px): an HTML5 <canvas> scrubbed 1:1 with scroll through 300 JPG frames
 * (living room sequence in /frames-export/frames1/). Preloads the initial frame, hides
 * the gold loading bar when rendered, and reveals overlay text on scroll.
 *
 * Mobile (< 768px): autoplay muted fallback video with static copy.
 */
export default function initHero() {
  const section = document.getElementById('hero');
  const canvas = document.getElementById('hero-canvas');
  const video = document.getElementById('hero-video');
  const overlay = document.getElementById('hero-overlay');
  const loader = document.getElementById('hero-loader');
  const scrollIndicator = document.getElementById('hero-scroll-indicator');

  if (!section) return null;

  const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;

  /* Scroll indicator: fades out once the user starts scrolling. */
  const hideIndicator = () => {
    if (scrollIndicator) scrollIndicator.classList.add('is-hidden');
    window.removeEventListener('scroll', hideIndicator);
  };
  window.addEventListener('scroll', hideIndicator, { passive: true });

  /* ---------- Mobile fallback: autoplay video, static copy ---------- */
  if (!isDesktop) {
    if (canvas) canvas.remove();
    if (loader) loader.remove();
    if (video) {
      video.play().catch(() => {
        /* autoplay blocked — poster frame still shows */
      });
    }
    return null;
  }

  /* ---------- Desktop: 60fps Canvas Frame Scrubbing ---------- */
  if (video) video.remove();

  const textEls = overlay
    ? overlay.querySelectorAll('.hero__label, .hero__title, .hero__sub, .hero__cta')
    : [];
  gsap.set(textEls, { opacity: 0, y: 24 });

  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    gsap.to(textEls, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power2.out',
      stagger: 0.08,
      overwrite: 'auto',
    });
  };

  /* Reveal text on event or start */
  window.addEventListener('revealText', reveal, { once: true });
  reveal();

  return initCanvasScrub({
    canvasId: 'hero-canvas',
    totalFrames: 300,
    minFrame: 1,
    buildUrl: (index) => frameUrl('frames1', index),
    loader,
    trigger: section,
    start: 'top top',
    end: '+=1620px',
    pin: true,
    pinSpacing: true,
    textRevealAt: 0.85,
    onReveal: reveal,
  });
}

