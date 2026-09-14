/** Decorative transition only: section navigation and its controls remain immediate. */
export function setupPortal(layer, reduced = matchMedia('(prefers-reduced-motion: reduce)')) {
  let animation, revision = 0;
  function cancel() {
    revision++;
    animation?.cancel(); animation = undefined; layer.hidden = true;
  }
  function play() {
    cancel();
    if (reduced.matches || document.hidden || typeof layer.animate !== 'function') return;
    const current = revision;
    layer.hidden = false;
    animation = layer.animate([
      {transform:'translate(-50%, -50%) scale(.18)', opacity:0},
      {transform:'translate(-50%, -50%) scale(.35)', opacity:.8, offset:.18},
      {transform:'translate(-50%, -50%) scale(1.3)', opacity:0},
    ], {duration:700,easing:'cubic-bezier(.16,.7,.28,1)',fill:'forwards'});
    animation.finished.then(() => { if (revision === current) cancel(); }, () => { if (revision === current) cancel(); });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
  reduced.addEventListener('change', () => { if (reduced.matches) cancel(); });
  return {play,cancel};
}
