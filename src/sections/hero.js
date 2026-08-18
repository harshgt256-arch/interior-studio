import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const DESKTOP_QUERY = '(min-width: 768px)';

/**
 * Hero — first section below the fixed nav.
 *
 * Desktop (>= 768px): a full-bleed <video> (all-keyframe encode of the
 * original upload) is scroll-scrubbed 1:1 with scroll — a GSAP tween on
 * `video.currentTime` pinned over 1620px gives frame-accurate, zero-lag
 * scrubbing at the video's native quality. A gold loader bar shows until
 * the first frame is decodable, then the section starts. Overlay copy
 * fades in when the `revealText` event fires at 85% progress.
 *
 * Mobile (< 768px): no scrubbing — the same video autoplays muted and
 * looping with statically visible copy (no fade).
 */
export default function initHero() {
  const section = document.getElementById('hero');
  const video = document.getElementById('hero-video');
  const overlay = document.getElementById('hero-overlay');
  const loader = document.getElementById('hero-loader');
  const scrollIndicator = document.getElementById('hero-scroll-indicator');
  const cta = overlay ? overlay.querySelector('.hero__cta') : null;

  if (!section || !video) return null;

  const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;

  /* Scroll indicator: fades out once the user starts scrolling. */
  const hideIndicator = () => {
    if (scrollIndicator) scrollIndicator.classList.add('is-hidden');
    window.removeEventListener('scroll', hideIndicator);
  };
  window.addEventListener('scroll', hideIndicator, { passive: true });

  /* ---------- Mobile fallback: autoplay, static copy ---------- */
  if (!isDesktop) {
    if (loader) loader.remove();
    video.play().catch(() => {
      /* autoplay blocked — poster frame still shows */
    });
    return null;
  }

  /* ---------- Desktop: scroll-scrubbed video ---------- */

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
  window.addEventListener('revealText', reveal, { once: true });

  /* CTA: smooth-scroll to the portfolio section. */
  if (cta) {
    cta.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('portfolio');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  }

  /**
   * Start scrubbing once the first frame is decodable — hides the loader
   * and wires the pinned, zero-lag scrub over the video's duration.
   */
  const start = () => {
    if (loader) loader.classList.add('is-loaded');

    gsap.to(video, {
      currentTime: video.duration || 0,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        /* Pin without spacer space and end the scrub when the press strip
           arrives — the hero releases BEFORE the Before/After section so the
           BA content scrolls in visibly instead of being covered by the
           pinned hero (and no dead zone either). */
        end: () => {
          const next = document.getElementById('press-strip');
          if (!next) return '+=1620px';
          return `+=${Math.max(100, next.offsetTop - section.offsetTop)}px`;
        },
        pin: true,
        pinSpacing: false,
        scrub: true, // 1:1, zero easing lag
        anticipatePin: 1,
        onUpdate(self) {
          if (!revealed && self.progress >= 0.85) {
            window.dispatchEvent(
              new CustomEvent('revealText', { detail: { progress: self.progress } }),
            );
          }
        },
      },
    });
  };

  if (video.readyState >= 1) {
    start();
  } else {
    video.addEventListener('loadeddata', start, { once: true });
    video.addEventListener(
      'error',
      () => {
        if (loader) loader.classList.add('is-loaded');
      },
      { once: true },
    );
  }

  return null;
}
