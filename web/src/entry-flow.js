// Uneven, monotonic travel beats: quick advances separated by slower preparation.
const travelMilestones = [[0, 0], [.14, .05], [.3, .36], [.44, .42], [.6, .73], [.77, .78], [.9, .94], [1, 1]];
function presentationProgress(time) {
  for (let index = 1; index < travelMilestones.length; index++) {
    const [endTime, endProgress] = travelMilestones[index];
    if (time > endTime) continue;
    const [startTime, startProgress] = travelMilestones[index - 1];
    const fraction = (time - startTime) / (endTime - startTime);
    const eased = fraction * fraction * (3 - 2 * fraction);
    return startProgress + (endProgress - startProgress) * eased;
  }
  return 1;
}

/** Entry timing and cancellation. No DOM, audio, storage, or avatar assumptions. */
export function createEntryFlow({ loadAssets, prepareAssets = async () => {}, now, requestFrame, cancelFrame, minimumMs = 2000 }) {
  let state = { phase: 'entry', soundEnabled: false, progress: 0, assetUrl: null, loadingStage: 'traveling' };
  let run = null;
  const subscribers = new Set();
  const emit = (patch) => {
    state = { ...state, ...patch };
    for (const subscriber of subscribers) subscriber({ ...state });
  };
  const release = () => {
    if (!run) return;
    const previous = run;
    run = null;
    previous.abort.abort();
    if (previous.frame !== null) cancelFrame(previous.frame);
    previous.assets?.dispose();
  };

  function tick(current) {
    if (run !== current || state.phase !== 'loading') return;
    const timeProgress = Math.min(1, Math.max(0, (now() - current.started) / minimumMs));
    // This is travel readiness, not a fabricated percentage of network bytes.
    const progress = Math.min(presentationProgress(timeProgress), current.ready ? 1 : current.resourceProgress * .98);
    const loadingStage = timeProgress >= .58 && (current.ready || current.resourceProgress >= .99)
      ? 'initializing' : 'traveling';
    if (current.ready && timeProgress >= 1) {
      release();
      emit({ phase: 'top', progress: 1, assetUrl: null });
      return;
    }
    emit({ progress, loadingStage });
    current.frame = requestFrame(() => tick(current));
  }

  function start(soundEnabled = state.soundEnabled) {
    release();
    const current = { abort: new AbortController(), started: now(), frame: null, resourceProgress: 0, ready: false, assets: null };
    run = current;
    emit({ phase: 'loading', soundEnabled: Boolean(soundEnabled), progress: 0, assetUrl: null, loadingStage: 'traveling' });
    tick(current);
    const preparation = Promise.resolve().then(() => prepareAssets());
    // Observe immediately even when the thumbnail request is still pending.
    preparation.catch(() => {});
    Promise.resolve().then(() => {
      if (run !== current) return null;
      return loadAssets({
        signal: current.abort.signal,
        onProgress: (value) => {
          if (run === current && Number.isFinite(value)) {
            current.resourceProgress = Math.max(current.resourceProgress, Math.min(1, Math.max(0, value)));
          }
        },
      });
    }).then((assets) => {
      if (!assets) return;
      if (run !== current) { assets.dispose(); return; }
      current.assets = assets;
      emit({ assetUrl: assets.imageUrl, loadingStage: now() - current.started >= minimumMs * .58 ? 'initializing' : 'traveling' });
      return preparation.then(() => { if (run === current) current.ready = true; });
    }).catch(() => {
      if (run !== current) return;
      if (current.frame !== null) cancelFrame(current.frame);
      current.abort.abort();
      emit({ phase: 'error' });
    });
  }

  return {
    getState: () => ({ ...state }),
    subscribe(listener) { subscribers.add(listener); listener({ ...state }); return () => subscribers.delete(listener); },
    start,
    retry() { if (state.phase === 'error') start(); },
    skip() {
      if (state.phase !== 'loading' && state.phase !== 'error') return;
      release();
      emit({ phase: 'top', assetUrl: null });
    },
    setSound(enabled) { emit({ soundEnabled: Boolean(enabled) }); },
    reset() { release(); emit({ phase: 'entry', soundEnabled: false, progress: 0, assetUrl: null, loadingStage: 'traveling' }); },
    destroy() { release(); subscribers.clear(); },
  };
}
