import test from 'node:test';
import assert from 'node:assert/strict';
import {framingDistance,orbitDirection,viewBasis} from '../src/avatar-framing.js';

test('face-centered framing includes feet, ears and outstretched accessories over the entire orbit',()=>{
  const points=[];
  for(const x of [-.75,.8]) for(const y of [-1.4,.3]) for(const z of [-.6,.4]) points.push([x,y,z]);
  const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0),tanY=Math.tan(16*Math.PI/180);
  for(const aspect of [.45,.8,1.2,2.4]) {
    const distance=framingDistance(points,aspect);
    for(let ring=0;ring<=10;ring++) for(let step=0;step<256;step++) {
      const angle=step*Math.PI/128,n=orbitDirection(Math.cos(angle)*ring/10,Math.sin(angle)*ring/10);
      const {right,up}=viewBasis(n);
      for(const p of points) {
        const depth=distance-dot(p,n);
        assert.ok(depth>0);
        assert.ok(Math.abs(dot(p,right)/(depth*tanY*aspect))<.99);
        assert.ok(Math.abs(dot(p,up)/(depth*tanY))<.99);
      }
    }
  }
});

test('neutral camera retains the 30-degree downwards view and the same face pivot',()=>{
  const n=orbitDirection(0,0);
  assert.ok(Math.abs(n[1]-.5)<1e-12);
  assert.ok(Math.abs(n[2]-Math.sqrt(3)/2)<1e-12);
  for(const [x,y] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const d=orbitDirection(x,y);
    assert.ok(Math.abs(d.reduce((sum,v,i)=>sum+v*n[i],0)-Math.cos(Math.PI/6))<1e-12);
  }
});
