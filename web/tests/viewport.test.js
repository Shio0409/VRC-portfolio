import test from 'node:test';
import assert from 'node:assert/strict';
import { setupOrientationGate, setupScrollHints } from '../src/viewport.js';

function setup(portrait) {
  const listeners = new Set();
  const media = {
    matches: portrait,
    addEventListener: (_, listener) => listeners.add(listener),
    removeEventListener: (_, listener) => listeners.delete(listener),
  };
  const shell = { inert: false };
  const gate = { hidden: false, focusCount: 0, focus() { this.focusCount++; } };
  let currentTarget = { focusCount: 0, focus() { this.focusCount++; } };
  const dispose = setupOrientationGate({ media, shell, gate, getResumeTarget: () => currentTarget });
  return {
    shell, gate, dispose,
    get target() { return currentTarget; },
    set target(value) { currentTarget = value; },
    rotate(matches) { media.matches = matches; listeners.forEach(listener => listener()); },
  };
}

test('landscape entry stays interactive without stealing initial focus', () => {
  const s = setup(false);
  assert.equal(s.shell.inert, false);
  assert.equal(s.gate.hidden, true);
  assert.equal(s.target.focusCount, 0);
});

test('portrait blocks the underlying screen and focuses the rotation instructions', () => {
  const s = setup(true);
  assert.equal(s.shell.inert, true);
  assert.equal(s.gate.hidden, false);
  assert.equal(s.gate.focusCount, 1);
  s.rotate(false);
  assert.equal(s.shell.inert, false);
  assert.equal(s.gate.hidden, true);
  assert.equal(s.target.focusCount, 1);
});

test('rotation resumes at the current screen if loading finished behind the gate', () => {
  const s = setup(false);
  const entry = s.target;
  s.rotate(true);
  const top = { focusCount: 0, focus() { this.focusCount++; } };
  s.target = top;
  s.rotate(false);
  assert.equal(entry.focusCount, 0);
  assert.equal(top.focusCount, 1);
  s.rotate(true);
  s.rotate(false);
  assert.equal(top.focusCount, 2);
});

test('disposing the gate removes the media listener', () => {
  const s = setup(false);
  s.dispose();
  s.rotate(true);
  assert.equal(s.shell.inert, false);
  assert.equal(s.gate.hidden, true);
});

test('scroll hints follow overflow, reading position and resizing without idle polling', t => {
  const saved={document:globalThis.document,ResizeObserver:globalThis.ResizeObserver,MutationObserver:globalThis.MutationObserver};
  let resized,mutated,hint,disconnected=0;
  globalThis.document={createElement:()=>hint={style:{},setAttribute(){},remove(){this.removed=true;}}};
  globalThis.ResizeObserver=class {constructor(fn){resized=fn;} observe(){} disconnect(){disconnected++;}};
  globalThis.MutationObserver=class {constructor(fn){mutated=fn;} observe(){} disconnect(){disconnected++;}};
  t.after(()=>Object.assign(globalThis,saved));
  const element=new EventTarget();
  Object.assign(element,{clientHeight:100,scrollHeight:240,scrollTop:0,offsetLeft:10,offsetTop:20,clientWidth:300,parentElement:{classList:{add(){}},append(){}},attributes:{},getAttribute(name){return this.attributes[name]??null;},setAttribute(name,value){this.attributes[name]=value;},removeAttribute(name){delete this.attributes[name];}});
  const dispose=setupScrollHints([element]);
  assert.equal(hint.hidden,false); assert.equal(element.getAttribute('tabindex'),'0');
  element.scrollTop=140;element.dispatchEvent(new Event('scroll'));assert.equal(hint.hidden,true);
  element.scrollHeight=300;mutated();assert.equal(hint.hidden,false);
  element.clientHeight=400;resized();assert.equal(hint.hidden,true);assert.equal(element.getAttribute('tabindex'),null);
  dispose();assert.equal(disconnected,2);assert.equal(hint.removed,true);
});
