/**
 * Testimonials — drag-scroll card carousel.
 * Native horizontal scroll with scroll-snap; mouse drag drives `scrollLeft`
 * by the pointer delta and scroll-snap settles on release. A real drag
 * suppresses the click that follows so nothing navigates unintentionally.
 * Touch devices scroll natively.
 */
export default function initTestimonials() {
  const viewport = document.getElementById('testimonials-viewport');
  if (!viewport) return;

  let isDown = false;
  let startX = 0;
  let startLeft = 0;
  let moved = 0;

  const onMouseDown = (e) => {
    if (e.button !== 0) return; // left button only
    isDown = true;
    moved = 0;
    startX = e.pageX;
    startLeft = viewport.scrollLeft;
    viewport.classList.add('is-grabbing');
  };

  const onMouseMove = (e) => {
    if (!isDown) return;
    const dx = e.pageX - startX;
    moved += Math.abs(dx);
    viewport.scrollLeft = startLeft - dx;
  };

  const stopDrag = () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove('is-grabbing');

    // If this was a real drag (not a click), swallow the click that follows.
    if (moved > 5) {
      const suppress = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        window.removeEventListener('click', suppress, true);
      };
      window.addEventListener('click', suppress, true);
    }
  };

  viewport.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', stopDrag);
  viewport.addEventListener('mouseleave', stopDrag);
}
