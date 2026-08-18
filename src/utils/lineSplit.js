import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * lineReveal
 * ----------
 * Editorial heading reveal: splits a heading into lines at its *actual*
 * wrapping points (measured with getClientRects), masks each line with an
 * overflow-hidden wrapper, and reveals the lines with a staggered
 * translateY(110%) → 0 scrub-free fade-up when the heading scrolls in.
 *
 * Handles inline children (e.g. <em> inside a title) by wrapping each
 * text node's words and each element node individually, so styling and
 * italics survive the split. Re-measures on resize and replays only if
 * the heading hasn't been revealed yet.
 *
 * @param {string} selector  Selector for the headings to reveal
 * @param {Object} [opts]
 * @param {string} [opts.start='top 85%']
 * @param {number} [opts.stagger=0.08]
 * @param {number} [opts.duration=0.9]
 */
export default function lineReveal(
  selector,
  { start = 'top 85%', stagger = 0.08, duration = 0.9 } = {},
) {
  const headings = document.querySelectorAll(selector);
  const cleanup = [];

  headings.forEach((heading) => {
    if (!heading.textContent.trim()) return;

    let lineEls = [];
    let triggered = false;

    const split = () => {
      /* Snapshot the original content BEFORE clearing (resize replays too). */
      const originalNodes = Array.from(heading.childNodes);

      /* Reset any previous split (resize). */
      heading.innerHTML = '';
      lineEls = [];
      triggered = false;
      heading.removeAttribute('data-line-revealed');

      /* 1. Wrap every word / inline element in an inline-block span. */
      const tokens = [];
      const walk = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const words = node.textContent.split(/(\s+)/).filter((w) => w.length);
          words.forEach((word) => {
            const s = document.createElement('span');
            s.className = 'lr-word';
            s.textContent = word;
            s.style.display = 'inline-block';
            tokens.push(s);
          });
        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'SPAN') {
          const s = document.createElement('span');
          s.className = 'lr-word';
          s.style.display = 'inline-block';
          s.appendChild(node.cloneNode(true));
          tokens.push(s);
        }
      };
      originalNodes.forEach(walk);
      tokens.forEach((t) => heading.appendChild(t));

      /* 2. Group words into lines by their vertical position. */
      const lineGroups = [];
      let currentLine = [];
      let currentTop = null;
      tokens.forEach((t) => {
        const rect = t.getBoundingClientRect();
        const top = Math.round(rect.top);
        if (currentTop == null) currentTop = top;
        if (top > currentTop + 1) {
          lineGroups.push(currentLine);
          currentLine = [];
          currentTop = top;
        }
        currentLine.push(t);
      });
      if (currentLine.length) lineGroups.push(currentLine);

      /* 3. Rebuild: each line → mask wrapper (.lr-line) → inner (.lr-line__in). */
      heading.innerHTML = '';
      lineGroups.forEach((lineTokens) => {
        const mask = document.createElement('span');
        mask.className = 'lr-line';
        const inner = document.createElement('span');
        inner.className = 'lr-line__in';
        lineTokens.forEach((t) => inner.appendChild(t));
        mask.appendChild(inner);
        heading.appendChild(mask);
        lineEls.push(inner);
      });
    };

    const reveal = () => {
      if (triggered || heading.hasAttribute('data-line-revealed')) return;
      triggered = true;
      heading.setAttribute('data-line-revealed', '');
      gsap.fromTo(
        lineEls,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration,
          ease: 'power4.out',
          stagger,
          overwrite: 'auto',
        },
      );
    };

    split();

    const st = ScrollTrigger.create({
      trigger: heading,
      start,
      once: true,
      onEnter: reveal,
    });

    const onResize = () => {
      if (triggered) return; // already revealed — leave the DOM alone
      split();
      st.refresh();
    };
    window.addEventListener('resize', onResize);

    cleanup.push(() => {
      st.kill();
      window.removeEventListener('resize', onResize);
    });
  });

  return () => cleanup.forEach((fn) => fn());
}
