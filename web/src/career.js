import { careerChapters as chapters } from './career-data.js';
import { createCareerClock, chapterAt } from './career-clock.js';

export function setupCareer(root) {
  const get = id => root.querySelector(`#${id}`);
  const player = get('career-player'), content = get('career-content');
  const play = get('career-play'), seek = get('career-seek'), expand = get('career-expand');
  const portrait = matchMedia('(pointer: coarse) and (max-width: 767px) and (orientation: portrait)');
  let visible = false, selected = -1, started = false;
  const duration = chapters.reduce((sum, chapter) => sum + chapter.duration, 0);
  const starts = chapters.map((_, index) => chapters.slice(0, index).reduce((sum, chapter) => sum + chapter.duration, 0));
  const format = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  seek.max = duration;
  const clock = createCareerClock({duration, now: () => performance.now(), onChange: render});
  const yearButtons = [];
  chapters.forEach((chapter, index) => {
    if (index && chapter.year === chapters[index - 1].year) return;
    const button = document.createElement('button'); button.type = 'button';
    button.textContent = chapter.year; button.style.left = `${starts[index] / duration * 100}%`;
    button.setAttribute('aria-label', `${chapter.year}の経歴へ移動`);
    button.addEventListener('click', () => clock.seek(starts[index]));
    get('career-years').append(button); yearButtons.push({button, year:chapter.year});
  });
  function render(state) {
    const index = chapterAt(chapters, state.time), chapter = chapters[index];
    seek.value = state.time;
    seek.style.setProperty('--played', `${state.time / duration * 100}%`);
    seek.setAttribute('aria-valuetext', `${format(state.time)} / ${format(duration)}、${chapter.year} ${chapter.title}`);
    get('career-time').textContent = `${format(state.time)} / ${format(duration)}`;
    play.textContent = state.playing ? 'Ⅱ' : '▶';
    play.setAttribute('aria-label', state.playing ? '一時停止' : state.time === duration ? '最初から再生' : '再生');
    get('career-prev').disabled = index === 0;
    get('career-next').disabled = index === chapters.length - 1;
    if (index === selected) return;
    selected = index;
    get('career-year').textContent = chapter.year;
    get('career-chapter-number').textContent = `${String(index + 1).padStart(2,'0')} / ${String(chapters.length).padStart(2,'0')}`;
    get('career-label').textContent = chapter.label;
    get('career-heading').textContent = chapter.title;
    content.replaceChildren();
    for (const paragraph of chapter.paragraphs) {
      const element = document.createElement(paragraph.startsWith('- ') ? 'ul' : 'p');
      if (element.tagName === 'UL') {
        paragraph.split('\n').forEach(line => { const li = document.createElement('li'); li.textContent = line.replace(/^- /, ''); element.append(li); });
      } else element.textContent = paragraph;
      content.append(element);
    }
    get('career-keywords').textContent = chapter.keywords.join(' / ');
    get('career-slide').scrollTop = 0;
    for (const item of yearButtons) {
      if (item.year === chapter.year) item.button.setAttribute('aria-current', 'step');
      else item.button.removeAttribute('aria-current');
    }
  }
  function setExpanded(value) {
    player.classList.toggle('is-expanded', value);
    root.querySelector('.career-intro').inert = value;
    document.querySelector('.site-header').inert = value;
    document.querySelector('.site-footer').inert = value;
    expand.setAttribute('aria-pressed', String(value));
    expand.setAttribute('aria-label', value ? '通常表示に戻す' : 'プレイヤーを拡大表示');
  }
  play.addEventListener('click', () => clock.getState().playing ? clock.pause() : clock.play());
  seek.addEventListener('input', () => clock.seek(Number(seek.value)));
  get('career-prev').addEventListener('click', () => clock.seek(starts[Math.max(0, selected - 1)]));
  get('career-next').addEventListener('click', () => clock.seek(starts[Math.min(chapters.length - 1, selected + 1)]));
  expand.addEventListener('click', () => setExpanded(!player.classList.contains('is-expanded')));
  player.addEventListener('keydown', event => { if (event.key === 'Escape') { setExpanded(false); expand.focus(); } });
  // Reading or selecting long text should not advance the chapter behind the user.
  get('career-slide').addEventListener('pointerdown', () => clock.pause());
  get('career-slide').addEventListener('wheel', () => clock.pause(), {passive:true});
  get('career-slide').addEventListener('focus', () => clock.pause());
  const updateActive = () => clock.setActive(visible && !document.hidden && !portrait.matches);
  document.addEventListener('visibilitychange', updateActive);
  portrait.addEventListener('change', updateActive);
  render(clock.getState());
  return {
    setVisible(value) {
      visible = value; updateActive();
      if (value && !started) { started = true; clock.play(); }
      if (!value) setExpanded(false);
    },
    reset() { clock.reset(); started = false; },
  };
}
