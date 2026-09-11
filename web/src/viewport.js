/** A shared orientation gate; screen content and its state remain mounted. */
export function setupOrientationGate({ media, shell, gate, getResumeTarget }) {
  let wasBlocked = false;
  const update = () => {
    const blocked = media.matches;
    shell.inert = blocked;
    gate.hidden = !blocked;
    if (blocked) gate.focus({ preventScroll: true });
    else if (wasBlocked) getResumeTarget()?.focus({ preventScroll: true });
    wasBlocked = blocked;
  };
  media.addEventListener('change', update);
  update();
  return () => media.removeEventListener('change', update);
}
