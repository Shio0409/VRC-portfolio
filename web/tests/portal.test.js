import test from 'node:test';
import assert from 'node:assert/strict';
import { setupPortal } from '../src/portal.js';

function fixture(t) {
  const previous=globalThis.document;
  const document=new EventTarget(); document.hidden=false; globalThis.document=document;
  t.after(()=>{globalThis.document=previous;});
  const reduced=new EventTarget(); reduced.matches=false;
  const jobs=[];
  const layer={hidden:true,animate(){
    const job={canceled:false,cancel(){this.canceled=true;}};
    job.finished=new Promise(resolve=>{job.finish=resolve;}); jobs.push(job); return job;
  }};
  return {portal:setupPortal(layer,reduced),layer,jobs,document,reduced};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('new navigation replaces the effect; stale completion cannot hide the current effect',async t=>{
  const f=fixture(t); f.portal.play(); f.portal.play();
  assert.equal(f.jobs[0].canceled,true); assert.equal(f.layer.hidden,false);
  f.jobs[0].finish(); await flush(); assert.equal(f.layer.hidden,false);
  f.jobs[1].finish(); await flush(); assert.equal(f.layer.hidden,true);
});
test('hidden tabs, reduced motion and explicit exit cancel the effect',t=>{
  const f=fixture(t); f.portal.play(); f.document.hidden=true; f.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.layer.hidden,true); f.portal.play(); assert.equal(f.jobs.length,1);
  f.document.hidden=false; f.portal.play(); f.reduced.matches=true; f.reduced.dispatchEvent(new Event('change'));
  assert.equal(f.layer.hidden,true); f.portal.play(); assert.equal(f.jobs.length,2);
  f.reduced.matches=false; f.portal.play(); f.portal.cancel(); assert.equal(f.layer.hidden,true);
});
