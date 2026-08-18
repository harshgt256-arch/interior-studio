import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const DESKTOP_QUERY = '(min-width: 768px)';

/**
 * Interior tour — kitchen & dining orbit reveal.
 *
 * Desktop (>= 768px): a full-bleed <video> (all-keyframe encode of the
 * original upload) is scroll-scrubbed 1:1 with scroll — a GSAP tween on
 * `video.currentTime` pinned over the distance to the next section gives
 * frame-accurate, zero-lag scrubbing at the video's native quality (no
 * Cloudinary stills, no 300-frame download). At 90% progress the
 * "Explore Full Portfolio" link fades in below the body copy.
 *
 * Mobile (< 768px): no scrubbing — the same video autoplays muted and
 * looping with a centered text block over the same dark gradient.
 */
export default function initInteriorTour() {
  const section = document.getElementById('tour');
  const canvas = document.getElementById('tour-canvas');
  const video = document.getElementById('tour-video');
  const content = section.querySelector('.tour__content');
  const link = document.getElementById('tour-link');

  if (!section || !video) return null;

  const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;

  /* ---------- Mobile fallback: autoplay video, centered static copy ---------- */
  if (!isDesktop) {
    if (canvas) canvas.remove();
    video.play().catch(() => {
      /* autoplay blocked — poster frame still shows */
    });
    return null;
  }

  /* ---------- Desktop: scroll-scrubbed video ---------- */
  if (canvas) canvas.remove();

  /* "Explore Full Portfolio >" fades in at 90% scroll progress. */
  gsap.set(link, { opacity: 0, y: 12 });
  const revealLink = () => {
    gsap.to(link, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };

  /* Gentle entrance for the body copy as the section arrives.
     (The title is line-revealed by utils/lineSplit.js, so it's excluded.) */
  const introEls = content.querySelectorAll('.tour__eyebrow, .tour__sub');
  gsap.set(introEls, { opacity: 0, y: 32 });
  ScrollTrigger.create({
    trigger: section,
    start: 'top 75%',
    once: true,
    onEnter: () =>
      gsap.to(introEls, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      }),
  });

  /**
   * Start scrubbing immediately — wires the pinned, zero-lag scrub.
   */
  const start = () => {
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
        onUpdate(self) {
          if (self.progress >= 0.9) revealLink();
        },
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
    /* video failed — poster frame still shows on the dark section */
  });

  return null;
}
