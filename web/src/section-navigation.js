const routes = {top:'#top-title',career:'#career-title'};

/** Hash routes work on project Pages as well as a custom-domain root. */
export function setupSectionNavigation({browser = window, canNavigate, getCurrent, onNavigate}) {
  const requested = () => Object.keys(routes).find(name => routes[name] === browser.location.hash) ?? 'top';
  function sync(name, replace = false) {
    if (!routes[name] || browser.location.hash === routes[name]) return;
    browser.history[replace ? 'replaceState' : 'pushState'](browser.history.state, '', routes[name]);
  }
  function navigate(name) {
    if (!routes[name] || !canNavigate()) return;
    if (getCurrent() === name) { sync(name,true); return; }
    sync(name); onNavigate(name);
  }
  function restore() {
    // Keep the requested hash while Sound / Loading is active, without bypassing entry.
    if (!canNavigate()) return;
    const name = requested(); sync(name,true);
    if (getCurrent() !== name) onNavigate(name);
  }
  browser.addEventListener('popstate', restore);
  browser.addEventListener('hashchange', restore);
  return {requested,sync,navigate};
}
