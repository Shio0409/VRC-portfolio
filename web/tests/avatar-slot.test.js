import test from 'node:test';
import assert from 'node:assert/strict';
import { setupAvatarSlot } from '../src/avatar-slot.js';

class Element extends EventTarget { hidden=false; disabled=false; dataset={}; textContent=''; click() { this.dispatchEvent(new Event('click')); } }
const flush = () => new Promise(resolve => setImmediate(resolve));
function fixture(loader) {
  const elements = Object.fromEntries(['avatar-button','top-avatar-canvas','avatar-message','avatar-retry'].map(id=>[id,new Element()]));
  let opened=0;
  const slot=setupAvatarSlot({querySelector: selector=>elements[selector.slice(1)]},()=>opened++,loader);
  return {slot,elements,opened:()=>opened};
}
test('Three.js is deferred until TOP; ready avatar opens skills and leaving releases scene once',async()=>{
  let imports=0,disposed=0;
  const f=fixture(async()=>{imports++;return {createAvatarScene:async()=>({dispose:()=>disposed++})};});
  assert.equal(imports,0); f.slot.setVisible(true); await flush();
  assert.equal(f.elements['avatar-button'].disabled,false);
  f.elements['avatar-button'].click(); assert.equal(f.opened(),1);
  f.slot.setVisible(false); f.slot.setVisible(false); assert.equal(disposed,1);
  f.slot.setVisible(true); await flush(); assert.equal(imports,2); f.slot.setVisible(false);
});
test('a stale completed parse is disposed and cannot enable an avatar after leaving TOP',async()=>{
  let resolve,disposed=0,signal;
  const f=fixture(async()=>({createAvatarScene:args=>{signal=args.signal;return new Promise(r=>resolve=r);}}));
  f.slot.setVisible(true); await flush(); f.slot.setVisible(false);
  assert.equal(signal.aborted,true); resolve({dispose:()=>disposed++}); await flush();
  assert.equal(disposed,1); assert.equal(f.elements['avatar-button'].disabled,true);
});
test('a failed load remains retryable and a retry can become ready',async()=>{
  let calls=0; const original=console.error; console.error=()=>{};
  try {
    const f=fixture(async()=>({createAvatarScene:async()=>{if(++calls===1)throw Error('test failure');return {dispose(){}};}}));
    f.slot.setVisible(true); await flush();
    assert.equal(f.elements['avatar-retry'].hidden,false); assert.equal(f.elements['avatar-button'].disabled,true);
    f.elements['avatar-retry'].click(); await flush();
    assert.equal(f.elements['avatar-retry'].hidden,true); assert.equal(f.elements['avatar-message'].hidden,true);
    assert.equal(f.elements['avatar-button'].dataset.ready,'true'); f.slot.setVisible(false);
  } finally {console.error=original;}
});
