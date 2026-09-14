import test from 'node:test';
import assert from 'node:assert/strict';
import { setupCareer } from '../src/career.js';

test('career controls connect chapters, seek, reading pause, expansion and re-entry', t => {
  class Element extends EventTarget {
    constructor(tag='DIV') {super(); this.tagName=tag.toUpperCase();}
    children=[]; attributes={}; textContent=''; style={setProperty(){}}; value=0;
    classList={values:new Set(), toggle(name,value){if(value)this.values.add(name);else this.values.delete(name);}, contains(name){return this.values.has(name);}};
    append(child){this.children.push(child);}
    replaceChildren(){this.children=[];}
    setAttribute(name,value){this.attributes[name]=value;}
    removeAttribute(name){delete this.attributes[name];}
    click(){this.dispatchEvent(new Event('click'));}
    focus(){this.dispatchEvent(new Event('focus'));}
  }
  const elements=new Map();
  const query=selector=>{if(!elements.has(selector))elements.set(selector,new Element());return elements.get(selector);};
  const document=new EventTarget(); document.hidden=false; document.querySelector=query; document.createElement=tag=>new Element(tag);
  const media=new EventTarget(); media.matches=false;
  const originals={document:globalThis.document,matchMedia:globalThis.matchMedia};
  globalThis.document=document; globalThis.matchMedia=()=>media;
  t.after(()=>Object.assign(globalThis,originals));
  t.mock.timers.enable({apis:['setTimeout']});
  const career=setupCareer({querySelector:query});
  career.setVisible(true); assert.equal(query('#career-play').attributes['aria-label'],'一時停止');
  query('#career-next').click(); assert.equal(query('#career-heading').textContent,'大手学習塾で講師を経験');
  const seek=query('#career-seek'); seek.value=48; seek.dispatchEvent(new Event('input'));
  assert.equal(query('#career-heading').textContent,'プログラミング教室 主任講師');
  assert.equal(query('#career-year').textContent,'2022');
  query('#career-slide').focus(); assert.equal(query('#career-play').attributes['aria-label'],'再生');
  query('#career-expand').click(); assert.equal(query('#career-player').classList.contains('is-expanded'),true);
  assert.equal(query('.career-intro').inert,true);
  career.setVisible(false); assert.equal(query('.career-intro').inert,false);
  career.setVisible(true); assert.equal(query('#career-heading').textContent,'プログラミング教室 主任講師');
  assert.equal(query('#career-play').attributes['aria-label'],'再生');
  query('#career-years').children.at(-1).click(); assert.equal(query('#career-year').textContent,'NOW');
  career.setVisible(false); career.reset(); assert.equal(query('#career-heading').textContent,'心理学を学ぶ');
});
