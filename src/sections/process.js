import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Process — 4-step "how we work" grid, staggered slide-in reveal on scroll.
 * opacity 0→1, translateX -20px→0, 0.12s stagger, 0.6s duration.
 * ScrollTrigger start: 'top 75%'.
 */
export default function initProcess() {
  const steps = document.querySelectorAll('.process-step');
  if (!steps.length) return;

  gsap.set(steps, { opacity: 0, x: -20 });

  ScrollTrigger.batch(steps, {
    start: 'top 75%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power3.out',
      }),
  });
}
