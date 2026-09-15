import { createEntryFlow } from './entry-flow.js';
import { loadInitialAssets } from './assets.js';
import { setupOrientationGate } from './viewport.js';
import { setupTop } from './top.js';
import { setupAvatarSlot } from './avatar-slot.js';
import { setupCareer } from './career.js';
import { setupContact } from './contact.js';
import { setupTopParallax, backgroundTransform } from './top-parallax.js';
import { setupPortal } from './portal.js';
import { setupSectionNavigation } from './section-navigation.js';

const byId = (id) => document.getElementById(id);
const screens = { entry: byId('entry-screen'), loading: byId('loading-screen'), top: byId('top-screen'), career: byId('career-screen'), contact: byId('contact-screen') };
const headings = { entry: byId('entry-title'), loading: byId('loading-title'), top: byId('top-title'), career: byId('career-title'), contact: byId('contact-title') };
const image = byId('world-image');
const soundButton = byId('sound-toggle');
const progress = byId('travel-progress');
const fill = byId('progress-fill');
const shell = byId('site-shell');
const flow = createEntryFlow({
  loadAssets: loadInitialAssets,
  now: () => performance.now(),
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (id) => cancelAnimationFrame(id),
});

setupOrientationGate({
  media: matchMedia('(pointer: coarse) and (max-width: 767px) and (orientation: portrait)'),
  shell,
  gate: byId('orientation-gate'),
  getResumeTarget: () => flow.getState().phase === 'error' ? byId('retry-button') : headings[shell.dataset.screen] ?? headings.entry,
});

const top = setupTop(screens.top);
const avatar = setupAvatarSlot(screens.top, top.openSkills);
const career = setupCareer(screens.career);
const contact = setupContact(screens.contact);
const portal = setupPortal(byId('portal-transition'));
const parallax = setupTopParallax((x,y) => {
  avatar.setView(x,y);
  byId('top-world-image').style.transform = backgroundTransform(x,y,innerWidth,innerHeight);
  // Glass catches the same view movement; no separate animation loop.
  screens.top.style.setProperty('--reflection-angle', `${118 + x * 8}deg`);
  screens.top.style.setProperty('--reflection-x', `${50 + x * 28}%`);
  screens.top.style.setProperty('--reflection-y', `${35 - y * 20}%`);
});
function showScreen(name) {
  portal.cancel();
  shell.dataset.screen = name;
  for (const [key, screen] of Object.entries(screens)) screen.hidden = key !== name;
  avatar.setVisible(name === 'top');
  top.setVisible(name === 'top');
  career.setVisible(name === 'career');
  contact.setVisible(name === 'contact');
  parallax.setVisible(name === 'top');
}
const navigation = setupSectionNavigation({
  canNavigate: () => flow.getState().phase === 'top',
  getCurrent: () => shell.dataset.screen,
  onNavigate(name) {
    showScreen(name); portal.play();
    if (!shell.inert) headings[name].focus({preventScroll:true});
  },
});
document.querySelectorAll('[data-section]').forEach(button => button.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault(); navigation.navigate(button.dataset.section);
}));
let previousPhase;
let previousLoadingMessage;
let previousUrl;
let previousSound = false;
flow.subscribe((state) => {
  const visibleScreen = state.phase === 'error' ? 'loading' : state.phase === 'top' ? navigation.requested() : state.phase;
  if (state.phase !== previousPhase) {
    if (state.phase === 'entry') { top.reset(); career.reset(); }
    showScreen(visibleScreen);
    if (state.phase === 'top') navigation.sync(visibleScreen,true);
    byId('sound-control').hidden = state.phase === 'entry';
    const failed = state.phase === 'error';
    screens.loading.dataset.error = String(failed);
    byId('error-message').hidden = !failed;
    byId('retry-button').hidden = !failed;
    byId('connection-indicator').hidden = failed;
    byId('announcement').textContent = failed
      ? '画像を読み込めませんでした。再試行するか、SKIPで先へ進めます。'
      : state.phase === 'loading' ? 'Sio’s Portfolioへ接続しています。' : '';
    if (previousPhase !== undefined && !shell.inert) {
      if (failed) byId('retry-button').focus({ preventScroll: true });
      else if (!(previousPhase === 'error' && state.phase === 'loading')) headings[visibleScreen].focus({ preventScroll: true });
      else headings.loading.focus({ preventScroll: true });
    }
    previousPhase = state.phase;
  }

  const loadingMessage = state.phase === 'error' ? 'Connection interrupted.'
    : state.loadingStage === 'initializing' ? 'Initializing Website...' : 'Traveling to Website...';
  if (previousLoadingMessage !== loadingMessage) {
    byId('connection-message').textContent = loadingMessage;
    if (state.phase === 'loading') byId('announcement').textContent = state.loadingStage === 'initializing'
      ? 'ウェブサイトを準備しています。' : 'Sio’s Portfolioへ接続しています。';
    previousLoadingMessage = loadingMessage;
  }

  soundButton.setAttribute('aria-pressed', String(state.soundEnabled));
  soundButton.setAttribute('aria-label', `サウンドを${state.soundEnabled ? 'OFF' : 'ON'}にする`);
  byId('sound-label').textContent = `SOUND ${state.soundEnabled ? 'ON' : 'OFF'}`;
  if (previousSound !== state.soundEnabled) {
    // Future audio players can subscribe. Persistence and video override rules remain undecided.
    document.dispatchEvent(new CustomEvent('portfolio:sound-change', { detail: { enabled: state.soundEnabled } }));
    previousSound = state.soundEnabled;
  }

  if (previousUrl !== state.assetUrl) {
    if (state.assetUrl) image.src = state.assetUrl;
    else image.removeAttribute('src');
    image.hidden = !state.assetUrl;
    byId('thumbnail-frame').dataset.ready = String(Boolean(state.assetUrl));
    previousUrl = state.assetUrl;
  }
  fill.style.transform = `scaleX(${state.progress})`;
  progress.setAttribute('aria-valuenow', String(Math.floor(state.progress * 100)));
  progress.setAttribute('aria-valuetext', state.phase === 'error' ? '接続中断' : `${Math.floor(state.progress * 100)}%`);
});

byId('sound-on').addEventListener('click', () => flow.start(true));
byId('sound-off').addEventListener('click', () => flow.start(false));
byId('skip-button').addEventListener('click', () => flow.skip());
byId('retry-button').addEventListener('click', () => flow.retry());
byId('return-button').addEventListener('click', () => { navigation.sync('top',true); flow.reset(); });
soundButton.addEventListener('click', () => flow.setSound(!flow.getState().soundEnabled));
// Stop work on exit; a restored back-forward-cache page starts with the sound choice again.
window.addEventListener('pagehide', () => flow.reset());
