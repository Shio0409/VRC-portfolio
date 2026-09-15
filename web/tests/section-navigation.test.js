import test from 'node:test';
import assert from 'node:assert/strict';
import { setupSectionNavigation } from '../src/section-navigation.js';

function fixture(hash='') {
  const browser=new EventTarget(); browser.location={hash};
  const writes=[]; browser.history={state:null,pushState(_,__,hash){writes.push(['push',hash]);browser.location.hash=hash;},replaceState(_,__,hash){writes.push(['replace',hash]);browser.location.hash=hash;}};
  let allowed=false,current='entry'; const moves=[];
  const nav=setupSectionNavigation({browser,canNavigate:()=>allowed,getCurrent:()=>current,onNavigate:name=>{current=name;moves.push(name);}});
  return {browser,writes,moves,nav,ready(){allowed=true;current='top';}};
}
test('deep links remain deferred through entry and can be resolved after loading',()=>{
  const f=fixture('#career-title'); f.nav.navigate('career'); f.browser.dispatchEvent(new Event('hashchange'));
  assert.deepEqual(f.moves,[]); assert.equal(f.nav.requested(),'career');
  f.ready(); f.browser.dispatchEvent(new Event('popstate')); assert.deepEqual(f.moves,['career']);
  assert.deepEqual(f.writes,[]);
});
test('navigation adds history once and browser back/forward do not add entries',()=>{
  const f=fixture('#top-title');f.ready();f.nav.navigate('career');f.nav.navigate('career');
  assert.deepEqual(f.writes,[['push','#career-title']]);
  f.browser.location.hash='#top-title';f.browser.dispatchEvent(new Event('popstate'));f.browser.dispatchEvent(new Event('hashchange'));
  assert.deepEqual(f.moves,['career','top']);assert.equal(f.writes.length,1);
  f.browser.location.hash='#career-title';f.browser.dispatchEvent(new Event('popstate'));
  assert.deepEqual(f.moves,['career','top','career']);assert.equal(f.writes.length,1);
});
test('unknown sections never navigate; unknown hashes safely normalize to TOP',()=>{
  const f=fixture('#top-title');f.ready();f.nav.navigate('works');assert.equal(f.writes.length,0);
  f.nav.navigate('career');f.browser.location.hash='#missing';f.browser.dispatchEvent(new Event('hashchange'));
  assert.equal(f.moves.at(-1),'top');assert.deepEqual(f.writes.at(-1),['replace','#top-title']);
});

test('CONTACT has a direct route and participates in section history',()=>{
  const f=fixture('#contact-title');assert.equal(f.nav.requested(),'contact');
  f.ready();f.browser.dispatchEvent(new Event('hashchange'));assert.deepEqual(f.moves,['contact']);
  f.nav.navigate('career');f.nav.navigate('contact');assert.deepEqual(f.writes.at(-1),['push','#contact-title']);
});
