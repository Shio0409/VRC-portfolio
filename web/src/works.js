import {works} from './works-data.js';

/** A single gallery, with no model or media requests until official assets exist. */
export function setupWorks(root) {
  const get = id => root.querySelector(`#${id}`);
  const tabs = get('works-tabs'), panel = get('works-detail');
  let selected = 0, lit = false;
  const buttons = works.map((work,index) => {
    const button = document.createElement('button');
    button.type='button'; button.id=`work-tab-${work.id}`;
    button.setAttribute('role','tab'); button.setAttribute('aria-controls','works-detail');
    const number=document.createElement('span'); number.className='work-index'; number.setAttribute('aria-hidden','true'); number.textContent=String(index+1).padStart(2,'0');
    const title=document.createElement('span'); title.textContent=work.title;
    button.append(number,title); tabs.append(button);
    button.addEventListener('click',()=>select(index));
    button.addEventListener('keydown',event=>{
      const next = event.key==='ArrowRight' ? (index+1)%works.length : event.key==='ArrowLeft' ? (index+works.length-1)%works.length : event.key==='Home' ? 0 : event.key==='End' ? works.length-1 : null;
      if(next===null)return;
      event.preventDefault(); select(next); buttons[next].focus();
    });
    return button;
  });
  function select(index) {
    selected=index;
    const work=works[index], number=String(index+1).padStart(2,'0');
    buttons.forEach((button,i)=>{button.tabIndex=i===index?0:-1;button.setAttribute('aria-selected',String(i===index));});
    panel.setAttribute('aria-labelledby',buttons[index].id);
    get('work-title').textContent=work.title;
    get('work-counter').textContent=`${number} / 05`;
    get('work-display-number').textContent=number;
    get('work-display-label').textContent=work.formats[0];
    get('work-formats').replaceChildren(...work.formats.map(format=>{
      const item=document.createElement('li'); item.textContent=format; return item;
    }));
    get('work-description').textContent=work.description || '作品の詳細情報は準備中です。';
    for(const key of ['year','category','tools','role'])get(`work-${key}`).textContent=work[key] || '—';
    get('work-video-note').hidden=!work.formats.some(format=>format.includes('Video'));
    get('work-information').scrollTop=0;
  }
  get('works-light').addEventListener('click',()=>{
    lit=!lit; root.dataset.lit=String(lit);
    get('works-light').setAttribute('aria-pressed',String(lit));
    get('works-light-label').textContent=`LIGHT ${lit?'ON':'OFF'}`;
  });
  root.dataset.lit='false'; select(selected);
}
