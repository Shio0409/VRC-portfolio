import {contactProfile} from './contact-data.js';
import {setupTopBackground} from './top-background.js';

const paths = {
  github:'M9 19c-4 1-4-2-6-2m12 5v-4c0-1 .2-2-1-3 4 0 7-2 7-6 0-2-1-3-2-4 0-1 0-2-1-3-2 0-3 1-4 1H10C9 2 7 2 6 2c-1 1-1 2-1 3-1 1-2 2-2 4 0 4 3 6 7 6-1 1-1 2-1 3v4',
  x:'M4 3h5l11 18h-5ZM20 3l-7 8M4 21l7-8',
  vrchat:'M3 4h18v13h-6l-3 4-3-4H3ZM6 8l2 5 2-5m3 5V8h3v3h-3m2 0 2 2',
  youtube:'M21 6c1 3 1 9 0 12-4 1-14 1-18 0-1-3-1-9 0-12 4-1 14-1 18 0ZM10 9v6l5-3Z',
  email:'M3 5h18v14H3Zm0 1 9 7 9-7',
};
const icon = id => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[id]}"/></svg>`;

export function setupContact(root, profile = contactProfile) {
  const get = id => root.querySelector(`#${id}`);
  const background = setupTopBackground(document.getElementById('contact-world'),document.getElementById('contact-world-image'));
  get('contact-name').textContent = profile.name;
  get('contact-status').textContent = profile.status || 'Status —';
  get('contact-status').dataset.configured = String(Boolean(profile.status));
  for (const text of profile.bio.length ? profile.bio : ['プロフィールは準備中です。']) {
    const p = document.createElement('p'); p.textContent = text; get('contact-bio').append(p);
  }
  for (const language of profile.languages.length ? profile.languages : ['—']) {
    const span=document.createElement('span'); span.textContent=language; get('contact-languages').append(span);
  }
  for (const link of profile.links) {
    const active = Boolean(link.url);
    const element = document.createElement(active ? 'a' : 'button');
    if (active) {
      element.href = link.url;
      if (link.id !== 'email') {element.target='_blank';element.rel='noopener noreferrer';}
    } else {element.type='button';element.disabled=true;element.title='準備中';}
    element.className='contact-link';
    element.innerHTML=icon(link.id);
    const label=document.createElement('span');label.textContent=link.label;element.append(label);
    if (!active) { const note=document.createElement('small');note.textContent='準備中';element.append(note); }
    get('contact-links').append(element);
  }
  get('contact-link-note').hidden = profile.links.some(link=>link.url);
  if (profile.avatarImage) {
    for (const id of ['contact-avatar-icon','contact-avatar-image']) {
      const image=get(id);image.src=profile.avatarImage;image.hidden=false;
    }
    get('contact-avatar-monogram').hidden=true;get('contact-image-placeholder').hidden=true;
  }
  return {setVisible: value=>background.setVisible(value)};
}
