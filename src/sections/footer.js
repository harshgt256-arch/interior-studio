import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Footer — staggered reveal on scroll for the brand block and link columns.
 */
export default function initFooter() {
  const blocks = document.querySelectorAll('.footer__brand, .footer__col');
  if (!blocks.length) return;

  gsap.set(blocks, { opacity: 0, y: 30 });

  ScrollTrigger.batch(blocks, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      }),
  });
}
