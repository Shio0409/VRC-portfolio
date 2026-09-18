import test from 'node:test';
import assert from 'node:assert/strict';
import {setupWorks} from '../src/works.js';
import {works} from '../src/works-data.js';

function fixture(t) {
  let focused;
  class Element extends EventTarget {
    children=[]; attributes={}; dataset={}; hidden=false; scrollTop=0;
    append(...children){this.children.push(...children);}
    replaceChildren(...children){this.children=children;}
    setAttribute(key,value){this.attributes[key]=value;}
    focus(){focused=this;}
  }
  const elements=new Map();
  const get=selector=>{if(!elements.has(selector))elements.set(selector,new Element());return elements.get(selector);};
  const previous=globalThis.document;
  globalThis.document={createElement:()=>new Element()};
  t.after(()=>{globalThis.document=previous;});
  const root={querySelector:get,dataset:{}};setupWorks(root);
  return {get,root,buttons:get('#works-tabs').children,focused:()=>focused};
}
test('all five works stay in one gallery, and selection clears old details and reading position',t=>{
  const f=fixture(t);assert.equal(f.buttons.length,5);
  assert.equal(f.get('#work-title').textContent,'生意気pupil');
  assert.equal(f.get('#work-video-note').hidden,true);
  f.get('#work-information').scrollTop=200;
  f.buttons[2].dispatchEvent(new Event('click'));
  assert.equal(f.get('#work-title').textContent,'ムチォOSC割り込みシステム');
  assert.deepEqual(f.get('#work-formats').children.map(e=>e.textContent),['概要','仕組み説明','Demo Video']);
  assert.equal(f.get('#work-video-note').hidden,false);
  assert.equal(f.get('#work-information').scrollTop,0);
  assert.equal(f.buttons.filter(b=>b.tabIndex===0).length,1);
  f.buttons[1].dispatchEvent(new Event('click'));assert.equal(f.get('#work-video-note').hidden,true);
  assert.ok(works.every(w=>!w.model&&!w.video&&!w.link&&!w.year&&!w.category&&!w.role&&!w.tools&&!w.description));
});
test('arrow and Home/End selection updates focus and the associated panel label',t=>{
  const f=fixture(t);
  function key(index,key){const event=new Event('keydown',{cancelable:true});event.key=key;f.buttons[index].dispatchEvent(event);assert.equal(event.defaultPrevented,true);}
  key(0,'ArrowLeft');assert.equal(f.focused(),f.buttons[4]);
  assert.equal(f.get('#works-detail').attributes['aria-labelledby'],'work-tab-instruments');
  key(4,'ArrowRight');assert.equal(f.focused(),f.buttons[0]);
  key(0,'End');assert.equal(f.focused(),f.buttons[4]);
  key(4,'Home');assert.equal(f.focused(),f.buttons[0]);
});
test('exhibit lighting is initially off and toggles without changing selected work',t=>{
  const f=fixture(t);assert.equal(f.root.dataset.lit,'false');
  f.buttons[3].dispatchEvent(new Event('click'));
  f.get('#works-light').dispatchEvent(new Event('click'));
  assert.equal(f.root.dataset.lit,'true');assert.equal(f.get('#works-light').attributes['aria-pressed'],'true');
  assert.equal(f.get('#work-title').textContent,'Syncパーティクルシステム');
  f.get('#works-light').dispatchEvent(new Event('click'));assert.equal(f.root.dataset.lit,'false');
});
