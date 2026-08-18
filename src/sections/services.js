import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Services — 4-card grid, staggered fade-up reveal on scroll.
 * opacity 0→1, translateY 30px→0, 0.12s stagger, 0.6s duration.
 * ScrollTrigger start: 'top 80%'.
 */
export default function initServices() {
  const cards = document.querySelectorAll('.service-card');
  if (!cards.length) return;

  gsap.set(cards, { opacity: 0, y: 30 });

  ScrollTrigger.batch(cards, {
    start: 'top 80%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power3.out',
      }),
  });
}
