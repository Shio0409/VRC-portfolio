export async function loadInitialAssets({ signal, onProgress }) {
  const url = new URL('../assets/playing.png', import.meta.url);
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Loading image: HTTP ${response.status}`);

  const total = Number(response.headers.get('content-length'));
  let blob;
  if (response.body) {
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.byteLength;
        if (total > 0) onProgress(Math.min(received / total, .99));
      }
      blob = new Blob(chunks, { type: response.headers.get('content-type') || 'image/png' });
    } finally {
      reader.releaseLock();
    }
  } else {
    blob = await response.blob();
  }
  signal.throwIfAborted();
  const imageUrl = URL.createObjectURL(blob);
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    URL.revokeObjectURL(imageUrl);
  };
  const preview = new Image();
  signal.addEventListener('abort', dispose, { once: true });
  try {
    preview.src = imageUrl;
    await preview.decode();
    signal.throwIfAborted();
    onProgress(1);
    return { imageUrl, dispose };
  } catch (error) {
    dispose();
    throw error;
  } finally {
    signal.removeEventListener('abort', dispose);
    preview.removeAttribute('src');
  }
}
