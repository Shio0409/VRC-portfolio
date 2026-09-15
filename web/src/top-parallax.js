export function pointerView(x, y, width, height) {
  const nx = Math.max(-1, Math.min(1, 1 - x / Math.max(1, width) * 2));
  const ny = Math.max(-1, Math.min(1, y / Math.max(1, height) * 2 - 1));
  const length = Math.max(1, Math.hypot(nx, ny));
  return { x:nx / length, y:ny / length };
}

/** A distant plane follows the orbit: camera-right exposes more of the left side.
 * CSS Y points down; the camera's Y points up. Tilt brings the camera-side edge
 * forward. Overscan covers the viewport even at the far edge of the view cone.
 */
export function backgroundView(x, y, width, height) {
  const length = Math.max(1, Math.hypot(x, y));
  x /= length; y /= length;
  return {translateX:x * 3, translateY:-y * 3, rotateX:-y * 6, rotateY:-x * 6,
    scale:1.2, perspective:Math.max(1, width, height) * 1.6};
}

export function backgroundTransform(x, y, width, height) {
  const v = backgroundView(x, y, width, height);
  return `translate3d(${v.translateX}%, ${v.translateY}%, 0) perspective(${v.perspective}px) rotateX(${v.rotateX}deg) rotateY(${v.rotateY}deg) scale(${v.scale})`;
}

/** One shared, demand-driven motion loop for the camera and background. */
export function setupTopParallax(onView) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, frame = null, last = 0;
  let current = {x:0,y:0}, target = {x:0,y:0};
  const enabled = () => visible && fine.matches && !reduced.matches && !document.hidden;
  function tick(time) {
    frame = null;
    if (!enabled()) return;
    const alpha = 1 - Math.exp(-Math.min(64, last ? time - last : 16) / 100); last = time;
    current.x += (target.x - current.x) * alpha;
    current.y += (target.y - current.y) * alpha;
    const moving = Math.hypot(target.x-current.x,target.y-current.y) > .0005;
    if (!moving) current = {...target};
    onView(current.x, current.y);
    if (moving) frame = requestAnimationFrame(tick); else last = 0;
  }
  function aim(value) { target = value; if (enabled() && frame === null) frame = requestAnimationFrame(tick); }
  function reset() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; last = 0; target = {x:0,y:0}; current = {...target}; onView(0,0);
  }
  const move = event => { if (enabled() && event.pointerType !== 'touch') aim(pointerView(event.clientX,event.clientY,innerWidth,innerHeight)); };
  const leave = () => aim({x:0,y:0});
  const update = () => { if (!enabled()) reset(); };
  window.addEventListener('pointermove', move, {passive:true});
  document.documentElement.addEventListener('pointerleave', leave);
  window.addEventListener('blur', reset);
  window.addEventListener('resize', reset);
  document.addEventListener('visibilitychange', update);
  fine.addEventListener('change', update); reduced.addEventListener('change', update);
  return { setVisible(value) { visible = value; if (!value) reset(); } };
}
