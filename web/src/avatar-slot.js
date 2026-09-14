/** Delays Three.js and GLB requests until TOP; owns cancellation and retries. */
export function setupAvatarSlot(root, openSkills, loadScene = () => import('./avatar-scene.js')) {
  const button = root.querySelector('#avatar-button'), canvas = root.querySelector('#top-avatar-canvas');
  const message = root.querySelector('#avatar-message'), retry = root.querySelector('#avatar-retry');
  let visible = false, request, scene;
  let view = {x:0,y:0};
  button.addEventListener('click', openSkills);
  async function load() {
    request?.abort(); scene?.dispose(); scene = undefined;
    const current = new AbortController(); request = current;
    button.disabled = true; button.dataset.ready = 'false'; retry.hidden = true;
    message.hidden = false; message.textContent = 'アバターを読み込んでいます…';
    try {
      const { createAvatarScene } = await loadScene();
      current.signal.throwIfAborted();
      const loaded = await createAvatarScene({ canvas, signal:current.signal });
      if (current.signal.aborted || !visible) { loaded.dispose(); return; }
      scene = loaded; scene.setView?.(view.x, view.y); button.disabled = false; button.dataset.ready = 'true'; message.hidden = true;
    } catch (error) {
      if (current.signal.aborted) return;
      console.error('Avatar load failed', error);
      message.textContent = 'アバターを表示できませんでした。スキルメニューは引き続きご覧いただけます。';
      retry.hidden = false;
    }
  }
  retry.addEventListener('click', () => { if (visible) void load(); });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); request?.abort(); scene?.dispose(); scene = undefined;
    button.disabled = true; message.hidden = false; message.textContent = 'アバターの表示が中断されました。'; retry.hidden = false;
  });
  return {
    setView(x, y) { view = {x,y}; scene?.setView?.(x,y); },
    setVisible(value) {
      if (visible === value) return;
      visible = value;
      if (value) void load();
      else { request?.abort(); scene?.dispose(); scene = undefined; button.disabled = true; }
    },
  };
}
