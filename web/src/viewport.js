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

/** Hints appear only where content actually overflows, and disappear at its end.
 * ResizeObserver covers section/tab changes without an idle animation loop. */
export function setupScrollHints(elements) {
  const entries = [...elements].map(element => {
    const host=element.parentElement, hint=document.createElement('span');
    host.classList.add('scroll-hint-host');
    hint.className='scroll-hint'; hint.textContent='SCROLL ↓'; hint.setAttribute('aria-hidden','true');
    host.append(hint);
    const originalTabIndex=element.getAttribute('tabindex');
    function update() {
      const overflow=element.clientHeight>0 && element.scrollHeight-element.clientHeight>3;
      hint.hidden=!overflow || element.scrollTop+element.clientHeight>=element.scrollHeight-3;
      if (originalTabIndex===null) {
        if (overflow) element.setAttribute('tabindex','0'); else element.removeAttribute('tabindex');
      }
      hint.style.left=`${element.offsetLeft+element.clientWidth-84}px`;
      hint.style.top=`${element.offsetTop+element.clientHeight-25}px`;
    }
    element.addEventListener('scroll',update,{passive:true});
    const observer=new ResizeObserver(update); observer.observe(element);
    // Text and tab content can change without changing the scroller's height.
    const mutation=new MutationObserver(update); mutation.observe(element,{childList:true,subtree:true,characterData:true});
    update();
    return () => {observer.disconnect();mutation.disconnect();element.removeEventListener('scroll',update);hint.remove();};
  });
  return () => entries.forEach(dispose=>dispose());
}
