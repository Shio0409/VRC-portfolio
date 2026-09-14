import test from 'node:test';
import assert from 'node:assert/strict';
import { pointerView, setupTopParallax } from '../src/top-parallax.js';

test('pointer center is neutral and all edges/corners stay inside the 30-degree cone', () => {
  assert.deepEqual(pointerView(500,300,1000,600),{x:0,y:0});
  assert.deepEqual(pointerView(1000,300,1000,600),{x:1,y:0});
  for (const [x,y] of [[0,0],[1000,600],[-100,900],[2000,-30]]) {
    const p=pointerView(x,y,1000,600); assert.ok(Math.hypot(p.x,p.y)<=1.00000001);
  }
});
test('motion settles, stops on exit and resets for reduced motion', t => {
  const original = Object.fromEntries(['window','document','matchMedia','requestAnimationFrame','cancelAnimationFrame','innerWidth','innerHeight'].map(k=>[k,globalThis[k]]));
  const window=new EventTarget(), document=new EventTarget(); document.documentElement=new EventTarget(); document.hidden=false;
  const fine=new EventTarget(), reduced=new EventTarget(); fine.matches=true; reduced.matches=false;
  let queued, time=0, latest, calls=0;
  Object.assign(globalThis,{window,document,innerWidth:1000,innerHeight:600,matchMedia:q=>q.includes('reduced')?reduced:fine,requestAnimationFrame:fn=>{queued=fn;return 1;},cancelAnimationFrame:()=>{queued=undefined;}});
  t.after(()=>Object.assign(globalThis,original));
  const controller=setupTopParallax((x,y)=>{latest={x,y};calls++;}); controller.setVisible(true);
  const move=new Event('pointermove'); Object.assign(move,{clientX:1000,clientY:300,pointerType:'mouse'}); window.dispatchEvent(move);
  for(let i=0;i<120&&queued;i++){const fn=queued;queued=undefined;fn(time+=16);}
  assert.deepEqual(latest,{x:1,y:0}); assert.equal(queued,undefined);
  const previous=calls; controller.setVisible(false); window.dispatchEvent(move);
  assert.deepEqual(latest,{x:0,y:0}); assert.equal(calls,previous+1); assert.equal(queued,undefined);
  controller.setVisible(true); window.dispatchEvent(move); reduced.matches=true; reduced.dispatchEvent(new Event('change'));
  assert.equal(queued,undefined); assert.deepEqual(latest,{x:0,y:0});
});
