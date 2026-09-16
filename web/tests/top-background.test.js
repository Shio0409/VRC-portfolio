import test from 'node:test';
import assert from 'node:assert/strict';
import { setupTopBackground } from '../src/top-background.js';

const flush = () => new Promise(resolve => setImmediate(resolve));
test('section scenery uses its own source and stays deferred until the section opens', async () => {
  const world={dataset:{},hidden:true};
  const image={async decode(){}};
  const background=setupTopBackground(world,image,'../assets/lounge-world.webp');
  assert.equal(image.src,undefined);
  background.setVisible(true); await flush();
  assert.ok(image.src.endsWith('/assets/lounge-world.webp'));
  assert.equal(world.dataset.ready,'true');
  background.setVisible(false);assert.equal(world.hidden,true);
});
test('background stays invisible until decode, does not reopen TOP after exit, and is reused', async () => {
  let resolve, calls = 0;
  const world = {dataset:{}, hidden:true};
  const image = {decode() { calls++; return new Promise(r => { resolve = r; }); }};
  const background = setupTopBackground(world, image);
  assert.equal(calls, 0);
  background.setVisible(true); background.setVisible(true);
  assert.equal(calls, 1); assert.equal(world.dataset.ready, 'false');
  background.setVisible(false); resolve(); await flush();
  assert.equal(world.hidden, true); assert.equal(world.dataset.ready, 'true');
  background.setVisible(true); assert.equal(calls, 1); assert.equal(world.hidden, false);
});
test('decode failure removes broken image and allows retry on re-entry', async () => {
  let calls = 0;
  const world = {dataset:{}, hidden:true};
  const image = {
    async decode() { if (++calls === 1) throw Error('decode failure'); },
    removeAttribute(name) { delete this[name]; },
  };
  const background = setupTopBackground(world, image);
  background.setVisible(true); await flush();
  assert.equal(world.dataset.ready, 'false'); assert.equal(image.src, undefined);
  assert.equal(calls, 1);
  background.setVisible(false); background.setVisible(true); await flush();
  assert.equal(world.dataset.ready, 'true'); assert.equal(calls, 2);
});
