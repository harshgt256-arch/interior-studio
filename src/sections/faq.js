/**
 * FAQ — accordion.
 * One item open at a time; chevron rotates via `.is-open` (CSS handles the
 * height transition with grid-template-rows 0fr -> 1fr).
 */
export default function initFaq() {
  const items = document.querySelectorAll('[data-faq-item]');
  if (!items.length) return;

  items.forEach((item) => {
    const head = item.querySelector('.faq-item__head');
    if (!head) return;

    head.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      // Accordion behaviour: close every item, then open the clicked one (unless it was already open).
      items.forEach((other) => {
        other.classList.remove('is-open');
        const otherHead = other.querySelector('.faq-item__head');
        if (otherHead) otherHead.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        head.setAttribute('aria-expanded', 'true');
      }
    });
  });
}
