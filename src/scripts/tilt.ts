/**
 * 3D tilt + spotlight for cards (`[data-tilt]`, value = max degrees). It only sets CSS
 * variables (--rx, --ry, --mx, --my) and an `is-tilting` class; the component's CSS does
 * the rest. Fine pointers only and never with reduced motion.
 */
export function initTilt(root: ParentNode = document): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  root.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
    if (card.dataset.tiltReady !== undefined) {
      return;
    }
    card.dataset.tiltReady = '';
    const max = Number(card.dataset.tilt) || 6;
    let frame = 0;
    const reset = (): void => {
      cancelAnimationFrame(frame);
      card.classList.remove('is-tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    };
    card.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') {
        card.classList.add('is-tilting');
      }
    });
    card.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') {
        return;
      }
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        card.style.setProperty('--rx', `${((0.5 - y) * max).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${((x - 0.5) * max).toFixed(2)}deg`);
        card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      });
    });
    card.addEventListener('pointerleave', reset);
  });
}
