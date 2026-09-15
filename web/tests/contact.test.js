import test from 'node:test';
import assert from 'node:assert/strict';
import {setupContact} from '../src/contact.js';

function fixture(t, profile) {
  class Element {
    children=[];hidden=false;dataset={};textContent='';
    append(child){this.children.push(child);}
  }
  const elements=new Map();
  const get=selector=>{if(!elements.has(selector))elements.set(selector,new Element());return elements.get(selector);};
  const previous=globalThis.document;
  globalThis.document={getElementById:id=>get('#'+id),createElement:tag=>{const e=new Element();e.tagName=tag.toUpperCase();return e;}};
  t.after(()=>{globalThis.document=previous;});
  setupContact({querySelector:get},profile);
  return get;
}
test('unconfigured profile exposes no invented status, language, contact target or image',t=>{
  const get=fixture(t);
  assert.equal(get('#contact-name').textContent,'sio0409');
  assert.equal(get('#contact-status').dataset.configured,'false');
  assert.equal(get('#contact-languages').children[0].textContent,'—');
  const links=get('#contact-links').children;
  assert.equal(links.length,5);assert.ok(links.every(link=>link.disabled && !link.href));
  assert.equal(get('#contact-avatar-icon').src,undefined);
});
test('supplied profile text uses text nodes and links open safely without inventing destinations',t=>{
  const get=fixture(t,{name:'Example',status:'<b>hello</b>',bio:['<script>text only</script>'],languages:['日本語'],avatarImage:'./assets/portrait.png',links:[{id:'github',label:'GitHub',url:'https://github.com/example'},{id:'email',label:'Email',url:'mailto:example@example.com'}]});
  assert.equal(get('#contact-bio').children[0].textContent,'<script>text only</script>');
  const [github,email]=get('#contact-links').children;
  assert.equal(github.target,'_blank');assert.equal(github.rel,'noopener noreferrer');
  assert.equal(email.href,'mailto:example@example.com');assert.equal(email.target,undefined);
  assert.equal(get('#contact-avatar-icon').src,'./assets/portrait.png');
  assert.equal(get('#contact-image-placeholder').hidden,true);
});
