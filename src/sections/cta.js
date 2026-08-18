import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * CTA — "book a consultation" block.
 * ScrollTrigger 'top 70%': opacity 0→1 + scale 0.96→1, 0.7s ease.
 */
export default function initCta() {
  const inner = document.querySelector('.cta__inner');
  if (!inner) return;

  gsap.set(inner, { opacity: 0, scale: 0.96 });

  ScrollTrigger.create({
    trigger: document.getElementById('cta'),
    start: 'top 70%',
    once: true,
    onEnter: () =>
      gsap.to(inner, {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: 'power2.out',
      }),
  });
}
