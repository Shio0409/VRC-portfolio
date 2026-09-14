import { skills } from './skills.js';
import { setupDialogue } from './dialogue.js';
import { setupTopBackground } from './top-background.js';

const icons = {
  user: '<circle cx="12" cy="7" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/>',
  cube: '<path d="m12 2 9 5v10l-9 5-9-5V7Zm0 10 9-5M12 12 3 7m9 5v10"/>',
  code: '<path d="m7 6-5 6 5 6m10-12 5 6-5 6M14 3l-4 18"/>',
  design: '<path d="m4 17 1 4 4-1L21 8l-5-5Zm0 0 5 3M13 6l5 5"/>',
  music: '<path d="M9 18V5l12-3v13M9 8l12-3"/><ellipse cx="6" cy="19" rx="3" ry="2"/><ellipse cx="18" cy="16" rx="3" ry="2"/>',
  manage: '<circle cx="12" cy="6" r="3"/><path d="M6 21v-3a6 6 0 0 1 12 0v3M4 8a3 3 0 0 0 0 6m16-6a3 3 0 0 1 0 6M2 21v-2a4 4 0 0 1 3-4m17 6v-2a4 4 0 0 0-3-4"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;

export function setupTop(root) {
  const dialogue = setupDialogue(root);
  const background = setupTopBackground(document.getElementById('top-world'), document.getElementById('top-world-image'));
  const menu = root.querySelector('#skill-menu');
  const open = root.querySelector('#skill-open');
  const close = root.querySelector('#skill-close');
  const tabs = root.querySelector('#skill-tabs');
  const content = root.querySelector('#skill-panels');
  let selected = 0;
  const tabButtons = skills.map((skill, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.id = `skill-tab-${skill.id}`;
    button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', `skill-panel-${skill.id}`);
    button.innerHTML = `${icon(skill.icon)}<span>${skill.label}</span>`;
    const panel = document.createElement('section');
    panel.id = `skill-panel-${skill.id}`; panel.className = 'skill-panel'; panel.tabIndex = 0;
    panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', button.id);
    // All text is local, reviewed specification content, not external markup.
    panel.innerHTML = `<div class="skill-section-line"><span>${skill.label}</span><span>${String(index + 1).padStart(2, '0')} <i>/ 06</i></span></div><h2>${skill.title}</h2><p class="skill-description">${skill.description}</p>`;
    for (const group of skill.groups) {
      const block = document.createElement('div'); block.className = 'skill-group';
      const heading = document.createElement('h3'); heading.textContent = group.title; block.append(heading);
      if (group.text) { const text = document.createElement('p'); text.textContent = group.text; block.append(text); }
      const list = document.createElement('ul');
      for (const item of group.items) { const li = document.createElement('li'); li.textContent = item; list.append(li); }
      block.append(list); panel.append(block);
    }
    content.append(panel); tabs.append(button);
    button.addEventListener('click', () => select(index));
    button.addEventListener('keydown', event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % skills.length : event.key === 'ArrowLeft' ? (index + skills.length - 1) % skills.length : event.key === 'Home' ? 0 : event.key === 'End' ? skills.length - 1 : undefined;
      if (next === undefined) return;
      event.preventDefault(); select(next); tabButtons[next].focus();
    });
    return button;
  });
  function select(index) {
    selected = index;
    tabButtons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === selected)); button.tabIndex = i === selected ? 0 : -1;
      content.children[i].hidden = i !== selected;
      content.children[i].setAttribute('aria-hidden', String(i !== selected));
    });
  }
  function setOpen(value, focus = true) {
    menu.hidden = !value; open.hidden = value;
    open.setAttribute('aria-expanded', String(value));
    root.dataset.menuOpen = String(value);
    if (focus) (value ? tabButtons[selected] : open).focus({ preventScroll: true });
  }
  close.addEventListener('click', () => setOpen(false));
  open.addEventListener('click', () => setOpen(true));
  menu.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); } });
  select(0); setOpen(true, false);
  // Future avatar click handling can call openSkills without coupling to animation/rendering.
  return {
    openSkills: () => setOpen(true),
    setVisible(value) {
      background.setVisible(value);
      dialogue.setVisible(value);
    },
    reset: () => { select(0); setOpen(true, false); },
  };
}
