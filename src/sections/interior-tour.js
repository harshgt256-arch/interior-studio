import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initCanvasScrub, frameUrl } from '../utils/canvasScrub.js';

gsap.registerPlugin(ScrollTrigger);

const DESKTOP_QUERY = '(min-width: 768px)';

/**
 * Interior tour — kitchen & dining orbit reveal.
 *
 * Desktop (>= 768px): an HTML5 <canvas> scrubbed 1:1 with scroll through 300 JPG frames
 * (kitchen sequence in /frames-export/frames2/). At 90% progress the
 * "Explore Full Portfolio" link fades in below the body copy.
 *
 * Mobile (< 768px): autoplay muted fallback video with centered static copy.
 */
export default function initInteriorTour() {
  const section = document.getElementById('tour');
  const canvas = document.getElementById('tour-canvas');
  const video = document.getElementById('tour-video');
  const content = section ? section.querySelector('.tour__content') : null;
  const link = document.getElementById('tour-link');

  if (!section) return null;

  const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;

  /* ---------- Mobile fallback: autoplay video, centered static copy ---------- */
  if (!isDesktop) {
    if (canvas) canvas.remove();
    if (video) {
      video.play().catch(() => {
        /* autoplay blocked — poster frame still shows */
      });
    }
    return null;
  }

  /* ---------- Desktop: 60fps Canvas Frame Scrubbing ---------- */
  if (video) video.remove();

  /* "Explore Full Portfolio >" fades in at 90% scroll progress. */
  if (link) gsap.set(link, { opacity: 0, y: 12 });
  const revealLink = () => {
    if (link) {
      gsap.to(link, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
  };

  /* Gentle entrance for the body copy as the section arrives. */
  if (content) {
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
  }

  return initCanvasScrub({
    canvasId: 'tour-canvas',
    totalFrames: 300,
    minFrame: 1,
    buildUrl: (index) => frameUrl('frames2', index),
    trigger: section,
    start: 'top top',
    end: '+=1620px',
    pin: true,
    pinSpacing: true,
    onProgress(p) {
      if (p >= 0.9) revealLink();
    },
  });
}
