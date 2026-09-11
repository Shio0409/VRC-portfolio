import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { createEntryFlow } from '../src/entry-flow.js';

function setup() {
  let clock = 0;
  let nextId = 0;
  const frames = new Map();
  const requests = [];
  const flow = createEntryFlow({
    now: () => clock,
    requestFrame: (callback) => { frames.set(++nextId, callback); return nextId; },
    cancelFrame: (id) => frames.delete(id),
    loadAssets: (options) => new Promise((resolve, reject) => requests.push({ ...options, resolve, reject })),
  });
  const advance = (time) => {
    clock = time;
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback());
  };
  let disposed = 0;
  const assets = () => ({ imageUrl: 'blob:thumbnail', dispose: () => disposed++ });
  return { flow, advance, requests, assets, frames, get disposed() { return disposed; } };
}

test('initial entry is muted and does not load assets before a choice', async () => {
  const s = setup();
  await setImmediate();
  assert.equal(s.flow.getState().phase, 'entry');
  assert.equal(s.flow.getState().soundEnabled, false);
  assert.equal(s.requests.length, 0);
  assert.equal(s.frames.size, 0);
});

test('a cached image still waits the full two seconds after the sound choice', async () => {
  const s = setup();
  s.advance(5000); // Time spent choosing sound must not count toward Loading.
  s.flow.start(false);
  await setImmediate();
  s.requests[0].resolve(s.assets());
  await setImmediate();
  s.advance(6999);
  assert.equal(s.flow.getState().phase, 'loading');
  assert.ok(s.flow.getState().progress < 1);
  s.advance(7000);
  assert.equal(s.flow.getState().phase, 'top');
  assert.equal(s.disposed, 1);
  assert.equal(s.frames.size, 0);
});

test('slow loading waits beyond two seconds, including image decode readiness', async () => {
  const s = setup();
  s.flow.start(true);
  await setImmediate();
  s.requests[0].onProgress(1);
  s.advance(4000);
  assert.equal(s.flow.getState().phase, 'loading');
  assert.ok(s.flow.getState().progress < 1);
  s.requests[0].resolve(s.assets());
  await setImmediate();
  s.advance(4016);
  assert.equal(s.flow.getState().phase, 'top');
  assert.equal(s.flow.getState().soundEnabled, true);
});

test('SKIP aborts pending work immediately and a stale completion cannot replace TOP', async () => {
  const s = setup();
  s.flow.start(false);
  await setImmediate();
  s.advance(100);
  s.flow.skip();
  assert.equal(s.flow.getState().phase, 'top');
  assert.equal(s.requests[0].signal.aborted, true);
  assert.equal(s.frames.size, 0);
  s.requests[0].resolve(s.assets());
  await setImmediate();
  assert.equal(s.flow.getState().phase, 'top');
  assert.equal(s.flow.getState().assetUrl, null);
  assert.equal(s.disposed, 1);
});

test('failure stays actionable; retry gets a fresh timer and preserves sound choice', async () => {
  const s = setup();
  s.flow.start(true);
  await setImmediate();
  s.advance(300);
  s.requests[0].reject(new Error('Offline'));
  await setImmediate();
  assert.equal(s.flow.getState().phase, 'error');
  assert.equal(s.frames.size, 0);
  s.advance(3000);
  s.flow.retry();
  await setImmediate();
  s.requests[1].resolve(s.assets());
  await setImmediate();
  s.advance(4999);
  assert.equal(s.flow.getState().phase, 'loading');
  s.advance(5000);
  assert.equal(s.flow.getState().phase, 'top');
  assert.equal(s.flow.getState().soundEnabled, true);
});

test('an image failure also allows SKIP', async () => {
  const s = setup();
  s.flow.start();
  await setImmediate();
  s.requests[0].reject(new Error('Bad image'));
  await setImmediate();
  s.flow.skip();
  assert.equal(s.flow.getState().phase, 'top');
});

test('sound changes do not reset the loading timer; replay starts muted', async () => {
  const s = setup();
  s.flow.start(false);
  await setImmediate();
  s.requests[0].resolve(s.assets());
  await setImmediate();
  s.advance(1500);
  s.flow.setSound(true);
  s.advance(2000);
  assert.equal(s.flow.getState().phase, 'top');
  assert.equal(s.flow.getState().soundEnabled, true);
  s.flow.reset();
  assert.equal(s.flow.getState().phase, 'entry');
  assert.equal(s.flow.getState().soundEnabled, false);
  assert.equal(s.flow.getState().progress, 0);
});

test('restarting cancels the old request; an old failure cannot break the new run', async () => {
  const s = setup();
  s.flow.start(false);
  await setImmediate();
  s.flow.start(true);
  await setImmediate();
  assert.equal(s.requests[0].signal.aborted, true);
  s.requests[0].reject(new Error('Old request'));
  await setImmediate();
  assert.equal(s.flow.getState().phase, 'loading');
  assert.equal(s.flow.getState().soundEnabled, true);
  s.flow.destroy();
  assert.equal(s.requests[1].signal.aborted, true);
  assert.equal(s.frames.size, 0);
});

test('presentation progress varies its speed without moving backwards or finishing early', async () => {
  const s = setup();
  s.flow.start(false);
  await setImmediate();
  s.requests[0].resolve(s.assets());
  await setImmediate();
  const positions = [];
  for (let time = 0; time < 2000; time += 100) {
    s.advance(time);
    positions.push(s.flow.getState().progress);
    assert.equal(s.flow.getState().phase, 'loading');
  }
  const increments = positions.slice(1).map((position, i) => position - positions[i]);
  assert.ok(increments.every((value) => value >= 0));
  assert.ok(Math.max(...increments) > Math.min(...increments) * 3);
  s.advance(2000);
  assert.equal(s.flow.getState().phase, 'top');
});

test('loading copy moves from traveling to initializing after transfer readiness, and resets on replay', async () => {
  const s = setup();
  s.flow.start(false);
  await setImmediate();
  s.requests[0].onProgress(.2);
  s.advance(1200);
  assert.equal(s.flow.getState().loadingStage, 'traveling');
  s.requests[0].resolve(s.assets());
  await setImmediate();
  assert.equal(s.flow.getState().loadingStage, 'initializing');
  s.advance(1300);
  assert.equal(s.flow.getState().loadingStage, 'initializing');
  s.flow.reset();
  s.flow.start(false);
  assert.equal(s.flow.getState().loadingStage, 'traveling');
  s.flow.destroy();
});
