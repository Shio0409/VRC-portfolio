/** Optional scenery never blocks navigation, dialogue or the avatar. */
export function setupTopBackground(world, image, source = '../assets/top-world.webp') {
  let pending = false, ready = false;
  world.dataset.ready = 'false';
  async function load() {
    pending = true;
    try {
      image.src = new URL(source, import.meta.url).href;
      await image.decode();
      ready = true;
      world.dataset.ready = 'true';
    } catch {
      // Keep the CSS night backdrop; retry only on the next visit, without a request loop.
      image.removeAttribute('src');
    } finally { pending = false; }
  }
  return { setVisible(value) {
    world.hidden = !value;
    if (value && !ready && !pending) void load();
  } };
}
