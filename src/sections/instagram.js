import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Instagram — photo grid, staggered reveal on scroll.
 */
export default function initInstagram() {
  const tiles = document.querySelectorAll('.insta-tile');
  if (!tiles.length) return;

  gsap.set(tiles, { opacity: 0, y: 30 });

  ScrollTrigger.batch(tiles, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out',
      }),
  });
}
