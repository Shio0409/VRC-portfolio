import { createEntryFlow } from './entry-flow.js';
import { loadInitialAssets } from './assets.js';

const byId = (id) => document.getElementById(id);
const screens = { entry: byId('entry-screen'), loading: byId('loading-screen'), top: byId('top-screen') };
const headings = { entry: byId('entry-title'), loading: byId('loading-title'), top: byId('top-title') };
const image = byId('world-image');
const soundButton = byId('sound-toggle');
const progress = byId('travel-progress');
const fill = byId('progress-fill');
const flow = createEntryFlow({
  loadAssets: loadInitialAssets,
  now: () => performance.now(),
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (id) => cancelAnimationFrame(id),
});

let previousPhase;
let previousLoadingMessage;
let previousUrl;
let previousSound = false;
flow.subscribe((state) => {
  const visibleScreen = state.phase === 'error' ? 'loading' : state.phase;
  if (state.phase !== previousPhase) {
    for (const [name, screen] of Object.entries(screens)) screen.hidden = name !== visibleScreen;
    soundButton.hidden = state.phase === 'entry';
    const failed = state.phase === 'error';
    screens.loading.dataset.error = String(failed);
    byId('error-message').hidden = !failed;
    byId('retry-button').hidden = !failed;
    byId('connection-indicator').hidden = failed;
    byId('announcement').textContent = failed
      ? '画像を読み込めませんでした。再試行するか、SKIPで先へ進めます。'
      : state.phase === 'loading' ? 'Sio’s Portfolioへ接続しています。' : '';
    if (previousPhase !== undefined) {
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
byId('return-button').addEventListener('click', () => flow.reset());
soundButton.addEventListener('click', () => flow.setSound(!flow.getState().soundEnabled));
// Stop work on exit; a restored back-forward-cache page starts with the sound choice again.
window.addEventListener('pagehide', () => flow.reset());
