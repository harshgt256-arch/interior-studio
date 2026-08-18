import gsap from 'gsap';

/**
 * Before / After — drag reveal comparison slider.
 *
 * A `--ba-pos` CSS custom property (handle percent, 0–100) drives:
 *   - the BEFORE layer's clip-path  → inset(0 calc(100% - var(--ba-pos)) 0 0)
 *   - the divider line's `left`     → var(--ba-pos)
 *
 * While dragging the `.is-dragging` class removes transitions so updates
 * are instant; on release the 0.15s ease (in CSS) applies again.
 * Keyboard: ←/→ nudge 3%, Home/End jump to the extremes.
 *
 * On FIRST 40% visibility the handle runs a one-time auto-demo:
 * 50% → 22% (0.9s, power2.inOut) → pause 500ms → back to 50%.
 * Skipped under prefers-reduced-motion and cancelled the moment the
 * user grabs the handle.
 */
export default function initBeforeAfter() {
  const frame = document.getElementById('ba-frame');
  if (!frame) return;

  let pos = 50;
  let demoProxy = null;
  let isDragging = false;

  function setPos(p) {
    pos = Math.min(96, Math.max(4, p));
    frame.style.setProperty('--ba-pos', `${pos}%`);
    if (frame.hasAttribute('aria-valuenow')) {
      frame.setAttribute('aria-valuenow', String(Math.round(pos)));
    }
  }

  function updateFromPointer(clientX) {
    const rect = frame.getBoundingClientRect();
    setPos(((clientX - rect.left) / rect.width) * 100);
  }

  function killDemo() {
    if (!demoProxy) return;
    gsap.killTweensOf(demoProxy);
    demoProxy = null;
  }

  function onPointerDown(e) {
    killDemo();
    isDragging = true;
    frame.setPointerCapture(e.pointerId);
    frame.classList.add('is-dragging');
    updateFromPointer(e.clientX);
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    updateFromPointer(e.clientX);
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    frame.classList.remove('is-dragging');
  }

  frame.addEventListener('pointerdown', onPointerDown);
  frame.addEventListener('pointermove', onPointerMove);
  frame.addEventListener('pointerup', onPointerUp);
  frame.addEventListener('pointercancel', onPointerUp);

  // Keyboard support (frame is focusable, role="slider").
  frame.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      setPos(pos - 3);
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      setPos(pos + 3);
      e.preventDefault();
    } else if (e.key === 'Home') {
      setPos(4);
      e.preventDefault();
    } else if (e.key === 'End') {
      setPos(96);
      e.preventDefault();
    }
  });

  /* ---------- Auto-demo (first 40% visibility, once) ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion) {
    let hasAutoDemoed = false;

    const demoObserver = new IntersectionObserver(
      (entries) => {
        if (hasAutoDemoed || !entries.some((e) => e.isIntersecting)) return;
        hasAutoDemoed = true;
        demoObserver.disconnect();

        demoProxy = { p: pos };
        gsap.to(demoProxy, {
          p: 22,
          duration: 0.9,
          ease: 'power2.inOut',
          onUpdate: () => setPos(demoProxy.p),
          onComplete: () => {
            gsap.to(demoProxy, {
              p: 50,
              delay: 0.5,
              duration: 0.9,
              ease: 'power2.inOut',
              onUpdate: () => setPos(demoProxy.p),
              onComplete: () => {
                demoProxy = null;
              },
            });
          },
        });
      },
      { threshold: 0.4 },
    );

    demoObserver.observe(frame);
  }

  // Tuning Panel Integration
  const tuningBtn = document.getElementById('btn-toggle-tuning');
  const tuningPanel = document.getElementById('ba-tuning-panel');
  
  if (tuningBtn && tuningPanel) {
    tuningBtn.addEventListener('click', () => {
      const isVisible = tuningPanel.style.display === 'block';
      tuningPanel.style.display = isVisible ? 'none' : 'block';
    });

    const tuneScale = document.getElementById('tune-scale');
    const tuneX = document.getElementById('tune-x');
    const tuneY = document.getElementById('tune-y');
    
    const valScale = document.getElementById('val-scale');
    const valX = document.getElementById('val-x');
    const valY = document.getElementById('val-y');
    
    const copyBtn = document.getElementById('btn-copy-tuning');

    const updateTuning = () => {
      const scale = tuneScale.value;
      const x = tuneX.value;
      const y = tuneY.value;
      
      valScale.textContent = Number(scale).toFixed(3);
      valX.textContent = `${x}px`;
      valY.textContent = `${y}px`;
      
      frame.style.setProperty('--ba-before-scale', scale);
      frame.style.setProperty('--ba-before-x', `${x}px`);
      frame.style.setProperty('--ba-before-y', `${y}px`);
    };

    if (tuneScale && tuneX && tuneY) {
      tuneScale.addEventListener('input', updateTuning);
      tuneX.addEventListener('input', updateTuning);
      tuneY.addEventListener('input', updateTuning);
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const cssCode = `--ba-before-scale: ${tuneScale.value}; --ba-before-x: ${tuneX.value}px; --ba-before-y: ${tuneY.value}px;`;
        navigator.clipboard.writeText(cssCode).then(() => {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = 'Copied to Clipboard!';
          setTimeout(() => {
            copyBtn.textContent = originalText;
          }, 2000);
        });
      });
    }
  }

  return { setPos };
}
