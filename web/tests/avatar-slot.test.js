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

test('latest pointer view is applied when loading completes and subsequent motion reaches the scene',async()=>{
  const views=[];
  const f=fixture(async()=>({createAvatarScene:async()=>({dispose(){},setView:(x,y)=>views.push([x,y])})}));
  f.slot.setVisible(true); f.slot.setView(.5,-.4); await flush();
  assert.deepEqual(views.at(-1),[.5,-.4]);
  f.slot.setView(-.7,.2); assert.deepEqual(views.at(-1),[-.7,.2]);
  f.slot.setVisible(false); const count=views.length;
  f.slot.setView(0,0); assert.equal(views.length,count);
});
test('Loading preloads once, and repeated TOP visits reuse the scene',async()=>{
  let imports=0,disposed=0;const visibility=[];
  const f=fixture(async()=>{imports++;return {createAvatarScene:async()=>({dispose:()=>disposed++,setVisible:v=>visibility.push(v)})};});
  const first=f.slot.preload();assert.equal(f.slot.preload(),first);await first;
  assert.equal(imports,1);assert.equal(visibility.at(-1),false);
  f.slot.setVisible(true);f.elements['avatar-button'].click();assert.equal(f.opened(),1);
  f.slot.setVisible(false);f.slot.setVisible(true);await flush();
  assert.equal(imports,1);assert.equal(disposed,0);assert.equal(visibility.at(-1),true);
  f.slot.dispose();f.slot.dispose();assert.equal(disposed,1);
});

test('leaving TOP during preparation retains the result for re-entry',async()=>{
  let resolve,disposed=0,signal;
  const f=fixture(async()=>({createAvatarScene:args=>{signal=args.signal;return new Promise(r=>resolve=r);}}));
  f.slot.setVisible(true);await flush();f.slot.setVisible(false);
  assert.equal(signal.aborted,false);resolve({dispose:()=>disposed++});await flush();
  assert.equal(disposed,0);assert.equal(f.elements['avatar-button'].dataset.ready,'true');
  f.slot.setVisible(true);assert.equal(f.elements['avatar-button'].disabled,false);f.slot.dispose();
});

test('explicit disposal invalidates a pending scene and allows a fresh load',async()=>{
  let resolve,disposed=0;
  const f=fixture(async()=>({createAvatarScene:()=>new Promise(r=>resolve=r)}));
  const waiting=f.slot.preload();await flush();f.slot.dispose();resolve({dispose:()=>disposed++});await waiting;
  assert.equal(disposed,1);assert.equal(f.elements['avatar-button'].disabled,true);
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
