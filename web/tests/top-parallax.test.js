import test from 'node:test';
import assert from 'node:assert/strict';
import { pointerView, setupTopParallax, backgroundView, backgroundTransform } from '../src/top-parallax.js';

test('background follows the orbit and brings the camera-side edge closer', () => {
  const right=backgroundView(1,0,1440,900), above=backgroundView(0,1,1440,900);
  assert.ok(right.translateX>0 && right.rotateY<0);
  assert.ok(above.translateY<0 && above.rotateX<0);
  assert.ok(backgroundView(-1,0,1440,900).translateX<0);
  assert.ok(backgroundView(0,-1,1440,900).translateY>0);
  assert.equal(backgroundTransform(0,0,1440,900),'translate3d(0%, 0%, 0) perspective(2304px) rotateX(0deg) rotateY(0deg) scale(1.2)');
});

test('projected scenery covers every viewport corner throughout the view cone', () => {
  // Project the image corners in CSS transform order; test containment rather
  // than just checking the overscan constant, including very wide screens.
  for (const [w,h] of [[568,320],[844,390],[1440,900],[907,742],[3840,720]]) {
    for(let step=0;step<64;step++) for(const radius of [0,.5,1]) {
      const angle=step*Math.PI/32, v=backgroundView(Math.cos(angle)*radius,Math.sin(angle)*radius,w,h);
      const rx=v.rotateX*Math.PI/180,ry=v.rotateY*Math.PI/180;
      const polygon=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sy])=>{
        const x=sx*w/2*v.scale,y=sy*h/2*v.scale;
        const x1=x*Math.cos(ry),z1=-x*Math.sin(ry);
        const y2=y*Math.cos(rx)-z1*Math.sin(rx),z2=y*Math.sin(rx)+z1*Math.cos(rx);
        const perspective=v.perspective/(v.perspective-z2);
        return [x1*perspective+v.translateX*w/100,y2*perspective+v.translateY*h/100];
      });
      for(const [cx,cy] of [[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]]) {
        for(let i=0;i<4;i++) {
          const a=polygon[i],b=polygon[(i+1)%4];
          assert.ok((b[0]-a[0])*(cy-a[1])-(b[1]-a[1])*(cx-a[0])>=0,`uncovered corner at ${w}x${h}, step ${step}`);
        }
      }
    }
  }
});

test('pointer center is neutral and all edges/corners stay inside the 30-degree cone', () => {
  assert.deepEqual(pointerView(500,300,1000,600),{x:0,y:0});
  assert.deepEqual(pointerView(1000,300,1000,600),{x:-1,y:0});
  assert.deepEqual(pointerView(500,0,1000,600),{x:0,y:-1});
  assert.deepEqual(pointerView(0,300,1000,600),{x:1,y:0});
  assert.deepEqual(pointerView(500,600,1000,600),{x:0,y:1});
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
  assert.deepEqual(latest,{x:-1,y:0}); assert.equal(queued,undefined);
  const previous=calls; controller.setVisible(false); window.dispatchEvent(move);
  assert.deepEqual(latest,{x:0,y:0}); assert.equal(calls,previous+1); assert.equal(queued,undefined);
  controller.setVisible(true); window.dispatchEvent(move); reduced.matches=true; reduced.dispatchEvent(new Event('change'));
  assert.equal(queued,undefined); assert.deepEqual(latest,{x:0,y:0});
});
