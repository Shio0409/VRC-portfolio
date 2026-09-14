import test from 'node:test';
import assert from 'node:assert/strict';
import { setupDialogue, dialogueLines } from '../src/dialogue.js';

function fixture(t, reduce = false) {
  class Element extends EventTarget {
    textContent = ''; attributes = {};
    setAttribute(key, value) { this.attributes[key] = value; }
    click() { this.dispatchEvent(new Event('click')); }
  }
  const document = new EventTarget(); document.hidden = false;
  const reduced = new EventTarget(); reduced.matches = reduce;
  const portrait = new EventTarget(); portrait.matches = false;
  const previous = {document: globalThis.document, matchMedia: globalThis.matchMedia};
  globalThis.document = document;
  globalThis.matchMedia = query => query.includes('reduced-motion') ? reduced : portrait;
  t.after(() => Object.assign(globalThis, previous));
  t.mock.timers.enable({apis:['setTimeout']});
  const elements = Object.fromEntries(['dialogue','dialogue-text','dialogue-accessible','dialogue-count','dialogue-hint'].map(id => [id, new Element()]));
  const root = {dataset:{}, querySelector: selector => elements[selector.slice(1)]};
  const dialogue = setupDialogue(root);
  t.after(() => dialogue.setVisible(false));
  return {dialogue, elements, document, portrait, root};
}

test('click completes typing before advancing; last line replays and re-entry resets', t => {
  const f = fixture(t); const button = f.elements.dialogue;
  f.dialogue.setVisible(true);
  t.mock.timers.tick(45);
  assert.equal(f.elements['dialogue-text'].textContent, 'こ');
  button.click(); assert.equal(f.elements['dialogue-text'].textContent, dialogueLines[0]);
  for (let i = 1; i < 4; i++) {
    button.click(); assert.equal(f.elements['dialogue-text'].textContent, '');
    button.click(); assert.equal(f.elements['dialogue-text'].textContent, dialogueLines[i]);
  }
  assert.equal(button.attributes['aria-label'], '会話を最初から読む');
  button.click(); assert.equal(f.elements['dialogue-count'].textContent, '01 / 04');
  f.dialogue.setVisible(false); t.mock.timers.tick(1000);
  assert.equal(f.elements['dialogue-text'].textContent, '');
  f.dialogue.setVisible(true); assert.equal(f.elements['dialogue-count'].textContent, '01 / 04');
});

test('typing pauses in hidden tabs and portrait and resumes without advancing a line', t => {
  const f = fixture(t); f.dialogue.setVisible(true); t.mock.timers.tick(45);
  f.document.hidden = true; f.document.dispatchEvent(new Event('visibilitychange'));
  t.mock.timers.tick(1000); assert.equal(f.elements['dialogue-text'].textContent, 'こ');
  assert.equal(f.root.dataset.speaking, 'false');
  f.document.hidden = false; f.portrait.matches = true; f.document.dispatchEvent(new Event('visibilitychange'));
  t.mock.timers.tick(1000); assert.equal(f.elements['dialogue-text'].textContent, 'こ');
  f.portrait.matches = false; f.portrait.dispatchEvent(new Event('change'));
  t.mock.timers.tick(45); assert.equal(f.elements['dialogue-text'].textContent, 'こん');
});

test('reduced motion immediately reveals full lines without speaking animation', t => {
  const f = fixture(t, true); f.dialogue.setVisible(true);
  assert.equal(f.elements['dialogue-text'].textContent, dialogueLines[0]);
  assert.equal(f.root.dataset.speaking, 'false');
  f.elements.dialogue.click(); assert.equal(f.elements['dialogue-text'].textContent, dialogueLines[1]);
});
