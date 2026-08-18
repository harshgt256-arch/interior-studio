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



  /**
   * Start scrubbing once the first frame is decodable — hides the loader
  /**
   * Start scrubbing immediately — wires the pinned, zero-lag scrub.
   */
  const start = () => {
    if (loader) loader.classList.add('is-loaded');
    reveal();

    gsap.to(video, {
      currentTime: () => video.duration || 0,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=100%',
        pin: true,
        pinSpacing: true,
        scrub: true, // 1:1, zero easing lag
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
  };

  start();

  const refreshTriggers = () => {
    ScrollTrigger.refresh();
  };

  video.addEventListener('loadedmetadata', refreshTriggers);
  video.addEventListener('durationchange', refreshTriggers);
  video.addEventListener('error', () => {
    if (loader) loader.classList.add('is-loaded');
    reveal();
  });

  return null;
}

