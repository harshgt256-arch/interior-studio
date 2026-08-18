/**
 * Portfolio — Selected Works.
 * Native horizontal-scroll gallery with mouse drag-to-scroll:
 * mousedown + mousemove drives `scrollLeft` by the pointer delta;
 * scroll-snap handles the settle on release. A real drag suppresses
 * the click that follows so cards don't navigate unintentionally.
 */
export default function initPortfolio() {
  const gallery = document.getElementById('portfolio-gallery');
  if (!gallery) return;

  let isDown = false;
  let startX = 0;
  let startLeft = 0;
  let moved = 0;

  const onMouseDown = (e) => {
    if (e.button !== 0) return; // left button only
    isDown = true;
    moved = 0;
    startX = e.pageX;
    startLeft = gallery.scrollLeft;
    gallery.classList.add('is-grabbing');
  };

  const onMouseMove = (e) => {
    if (!isDown) return;
    const dx = e.pageX - startX;
    moved += Math.abs(dx);
    gallery.scrollLeft = startLeft - dx;
  };

  const stopDrag = () => {
    if (!isDown) return;
    isDown = false;
    gallery.classList.remove('is-grabbing');

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

  gallery.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', stopDrag);
  gallery.addEventListener('mouseleave', stopDrag);
}
