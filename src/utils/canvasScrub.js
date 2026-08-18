import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CLOUD_NAME = 'j6f3st1w';
const CLOUD_VERSION = 'v1786942781';

/* Change 3 — mobile caps: fewer decoded frames (300 frames ≈ 300-400MB in
   memory crashes iOS Safari) + a lighter Cloudinary transform. */
const isMobile = window.innerWidth < 768;
const CLOUD_TRANSFORM = isMobile ? 'f_auto,q_auto,w_640' : 'f_auto,q_90,w_1280';

const pad4 = (n) => String(n).padStart(4, '0');

/** Local frame URL (public/frames-export/...) — used by interior-tour. */
export function frameUrl(set, index) {
  return `${import.meta.env.BASE_URL}frames-export/${set}/${set}_${pad4(index)}.jpg`;
}

/** Cloudinary frame URL for a sequence like `frames1_0007.jpg`. */
function cloudinaryUrl(cloudFolder, index) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${CLOUD_VERSION}/${CLOUD_TRANSFORM}/${cloudFolder}_${pad4(index)}.jpg`;
}

/**
 * initCanvasScrub
 * ---------------
 * Full-viewport canvas scroll-scrub shared by the hero (frames1) and the
 * interior tour (frames2).
 *
 * - Scrubs frames 1:1 with scroll (scrub: true = zero lag).
 * - Mobile (<768px): capped at 150 frames and fetches w_640 stills so iOS
 *   Safari doesn't run out of memory; desktop keeps the full sequence.
 * - Draws with object-fit-cover math (fill canvas width, crop overflow) in
 *   CSS pixels via a devicePixelRatio transform (sharp on retina).
 * - Clamps the frame index to [minFrame, EFFECTIVE_FRAMES - 1].
 * - Shows an optional loading indicator until the first visible frame loads,
 *   then creates the ScrollTrigger ("starts the section").
 * - Dispatches a `revealText` CustomEvent on window once scroll progress
 *   reaches `textRevealAt` (e.g. 0.85).
 * - Scroll is tracked with a passive listener + touchmove fallback so
 *   touch-driven scrolling never stalls the scrub.
 *
 * @param {Object} opts
 * @param {string}      [opts.cloudFolder]  'frames1' | 'frames2' → Cloudinary URLs
 * @param {(i:number)=>string} [opts.buildUrl]  Custom URL builder (overrides cloudFolder)
 * @param {string}      opts.canvasId       Canvas element id
 * @param {number}      [opts.totalFrames=270]
 * @param {number}      [opts.minFrame=6]   Lower clamp for the 0-based frame index
 * @param {number}      [opts.textRevealAt=0.85]  Progress at which to fire `revealText` (null disables)
 * @param {string|Element} [opts.loader]    Loading-bar element (selector or node)
 * @param {string|Element} [opts.trigger]   ScrollTrigger trigger (defaults to closest <section>)
 * @param {string}      [opts.start='top top']
 * @param {string}      [opts.end='+=1620px']
 * @param {boolean}     [opts.pin=true]
 * @param {boolean}     [opts.pinSpacing=true]  Leave page space for the pin.
 *                                              Set false to hand off directly to
 *                                              the next section (no dead zone).
 * @param {number}      [opts.preloadWindow=12]
 * @param {(p:number, st:ScrollTrigger)=>void} [opts.onProgress]
 * @param {(p:number)=>void} [opts.onReveal]  Called once when progress
 *                                             reaches `textRevealAt`
 * @returns {{ destroy: Function, trigger: ScrollTrigger|null }} | null
 */
export function initCanvasScrub({
  cloudFolder = null,
  buildUrl = null,
  canvasId,
  totalFrames = 270,
  minFrame = 6,
  textRevealAt = 0.85,
  loader = null,
  trigger = null,
  start = 'top top',
  end = '+=1620px',
  pin = true,
  pinSpacing = true,
  preloadWindow = 12,
  onProgress = null,
  onReveal = null,
} = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const ctx = canvas.getContext('2d', { alpha: false });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resolveUrl = buildUrl || ((i) => cloudinaryUrl(cloudFolder, i));
  const loaderEl = typeof loader === 'string' ? document.querySelector(loader) : loader;
  const triggerEl =
    typeof trigger === 'string'
      ? document.querySelector(trigger)
      : trigger || canvas.closest('section') || canvas.parentElement;
  const container = canvas.parentElement;

  /* Change 3 — cap the frames actually preloaded/rendered on mobile. */
  const EFFECTIVE_FRAMES = isMobile ? Math.min(totalFrames, 150) : totalFrames;

  const FRAME_W = 1920;
  const FRAME_H = 1080;
  const lower = Math.min(minFrame, EFFECTIVE_FRAMES - 1);

  /** @type {Map<number, { img: HTMLImageElement, loaded: boolean }>} */
  const frames = new Map();
  let current = lower;
  let revealed = false;
  let firstFrameReady = false;
  let scrollTrigger = null;
  let bgTimer = 0;
  let bgCursor = 1;
  let resizeObserver = null;
  let lastTouchY = 0;
  let destroyed = false;

  /* ---------- frame loading ---------- */

  function getFrame(index) {
    let entry = frames.get(index);
    if (!entry) {
      const img = new Image();
      img.decoding = 'async';
      entry = { img, loaded: false };
      frames.set(index, entry);
      img.onload = () => {
        entry.loaded = true;
        if (index === lower && !firstFrameReady) handleFirstFrame();
        else if (index === current) draw();
      };
      img.onerror = () => {
        if (index === lower && !firstFrameReady) handleFirstFrame();
      };
      img.src = resolveUrl(index);
    }
    return entry;
  }

  function primeWindow() {
    for (let i = 0; i <= preloadWindow; i += 1) {
      getFrame(Math.min(current + i, EFFECTIVE_FRAMES - 1));
      getFrame(Math.max(current - i, 0));
    }
  }

  function startBackgroundLoad() {
    const step = () => {
      if (destroyed) return;
      let batch = 6;
      while (batch > 0 && bgCursor <= EFFECTIVE_FRAMES) {
        const entry = getFrame(bgCursor);
        if (!entry.loaded && !entry.img.complete) batch -= 1;
        bgCursor += 1;
        if (bgCursor > EFFECTIVE_FRAMES) break;
      }
      if (bgCursor <= EFFECTIVE_FRAMES) bgTimer = window.setTimeout(step, 40);
    };
    bgTimer = window.setTimeout(step, 400);
  }

  /* ---------- drawing (object-fit: cover, in CSS pixels) ---------- */

  function draw() {
    if (destroyed) return;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;
    ctx.fillStyle = '#141210';
    ctx.fillRect(0, 0, cw, ch);

    const entry = frames.get(current);
    if (!entry || !entry.loaded) return;

    // Fill the canvas width, crop the overflow (cover).
    const scale = Math.max(cw / FRAME_W, ch / FRAME_H);
    const dw = FRAME_W * scale;
    const dh = FRAME_H * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(entry.img, dx, dy, dw, dh);
  }

  /* ---------- sizing ---------- */

  /* Change 4 — DPR-aware canvas. The buffer holds device pixels while the
     context draws in CSS pixels via a dpr transform, so output is sharp on
     retina screens. setTransform (not ctx.scale) keeps the scale idempotent
     across repeated calls from resize / orientationchange / observer. */
  function resizeCanvas() {
    if (destroyed) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  /* ---------- scroll wiring (created once the first frame is ready) ---------- */

  function createTrigger() {
    if (destroyed || scrollTrigger || !triggerEl) return;

    scrollTrigger = ScrollTrigger.create({
      trigger: triggerEl,
      start,
      end,
      pin,
      pinSpacing,
      scrub: true, // boolean → 1:1, zero easing lag
      anticipatePin: 1,
      onUpdate(self) {
        if (destroyed) return;
        const p = self.progress;

        current = Math.min(
          EFFECTIVE_FRAMES - 1,
          Math.max(lower, Math.round(p * EFFECTIVE_FRAMES)),
        );
        primeWindow();
        draw();

        if (textRevealAt != null && !revealed && p >= textRevealAt) {
          revealed = true;
          window.dispatchEvent(
            new CustomEvent('revealText', { detail: { progress: p } }),
          );
          if (onReveal) onReveal(p);
        }

        if (onProgress) onProgress(p, self);
      },
    });
  }

  function handleFirstFrame() {
    if (firstFrameReady) return;
    firstFrameReady = true;

    if (loaderEl) loaderEl.classList.add('is-loaded');
    draw();
    createTrigger();
    startBackgroundLoad();
  }

  /* Change 1 — passive scroll listener (never blocks the main thread). */
  function onScroll() {
    if (destroyed || !scrollTrigger) return;
    scrollTrigger.update();
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Change 2 — touch fallback: touch-driven scrolling doesn't always fire
     the 'scroll' event reliably on mobile, so re-nudge the scrub from
     touchmove on the canvas container. */
  const onTouchStart = (e) => {
    lastTouchY = e.touches[0].clientY;
  };
  const onTouchMove = () => onScroll();
  if (container) {
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
  }

  /* ---------- lifecycle ---------- */

  resizeCanvas();
  primeWindow();
  const first = frames.get(lower);
  if (first && first.loaded) {
    handleFirstFrame();
  } else if (first && first.img.complete && first.img.naturalWidth > 0) {
    first.loaded = true;
    handleFirstFrame();
  }

  /* Change 4 — react to window resize, orientation change (address-bar
     collapse on mobile), and container size changes. */
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', resizeCanvas);
  resizeObserver = new ResizeObserver(resizeCanvas);
  if (container) resizeObserver.observe(container);

  function destroy() {
    destroyed = true;
    if (bgTimer) clearTimeout(bgTimer);
    if (resizeObserver) resizeObserver.disconnect();
    if (scrollTrigger) scrollTrigger.kill();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', resizeCanvas);
    window.removeEventListener('orientationchange', resizeCanvas);
    if (container) {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
    }
  }

  return { destroy, trigger: scrollTrigger };
}
