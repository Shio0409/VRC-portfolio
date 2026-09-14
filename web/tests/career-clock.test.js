import test from 'node:test';
import assert from 'node:assert/strict';
import { createCareerClock, chapterAt } from '../src/career-clock.js';
import { careerChapters } from '../src/career-data.js';

function fixture() {
  let now = 0, callback;
  const clock = createCareerClock({ duration:108, now:()=>now, onChange(){}, setTimer: fn => {callback=fn; return 1;}, clearTimer:()=>{callback=undefined;} });
  return {clock, advance(ms) {now+=ms; callback?.();}, pending:()=>Boolean(callback)};
}
test('autoplay uses elapsed time; inactive screens freeze and resume without a jump', () => {
  const f=fixture(); f.clock.setActive(true); f.clock.play(); f.advance(2500);
  assert.equal(f.clock.getState().time,2.5);
  f.clock.setActive(false); f.advance(50000); assert.equal(f.clock.getState().time,2.5);
  f.clock.setActive(true); f.advance(500); assert.equal(f.clock.getState().time,3);
  f.clock.pause(); f.advance(10000); assert.equal(f.clock.getState().time,3); assert.equal(f.pending(),false);
});
test('seeking clamps, end stops, replay starts at zero and reset cancels timer', () => {
  const f=fixture(); f.clock.setActive(true); f.clock.play();
  f.clock.seek(999); assert.deepEqual(f.clock.getState(), {time:108,playing:false,duration:108});
  assert.equal(f.pending(),false); f.clock.play(); assert.equal(f.clock.getState().time,0);
  f.clock.seek(-3); assert.equal(f.clock.getState().time,0);
  f.clock.seek(NaN); assert.equal(f.clock.getState().time,0);
  f.advance(110000); assert.equal(f.clock.getState().playing,false);
  f.clock.play(); f.clock.reset(); assert.equal(f.pending(),false); assert.equal(f.clock.getState().time,0);
});
test('same-year chapters remain independently reachable at exact boundaries', () => {
  assert.equal(careerChapters.length,9);
  assert.equal(chapterAt(careerChapters,11.9),0);
  assert.equal(chapterAt(careerChapters,12),1);
  assert.equal(careerChapters[0].year,careerChapters[1].year);
  assert.equal(chapterAt(careerChapters,108),8);
  assert.equal(careerChapters[4].year,'2022');
  assert.equal(careerChapters[5].title,'教室長代理に就任');
});
