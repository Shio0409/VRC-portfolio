// User-approved provisional copy; the final script remains editable here.
export const dialogueLines = [
  'こんにちは、sio0409です。',
  '企画・制作・技術・運営を横断して、アイデアを動く形にしています。',
  'このサイトでは、スキルやこれまでの経験、制作物をご紹介します。',
  'どうぞ、ゆっくり見ていってください。',
];

export function setupDialogue(root) {
  const button = root.querySelector('#dialogue');
  const text = root.querySelector('#dialogue-text');
  const accessible = root.querySelector('#dialogue-accessible');
  const count = root.querySelector('#dialogue-count');
  const hint = root.querySelector('#dialogue-hint');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = matchMedia('(pointer: coarse) and (max-width: 767px) and (orientation: portrait)');
  let visible = false, line = 0, letters = 0, timer;
  const characters = () => Array.from(dialogueLines[line]);
  const complete = () => letters >= characters().length;
  function render() {
    text.textContent = characters().slice(0, letters).join('');
    accessible.textContent = dialogueLines[line];
    count.textContent = `${String(line + 1).padStart(2, '0')} / 04`;
    hint.textContent = !complete() ? '全文表示 ▸' : line === dialogueLines.length - 1 ? 'もう一度 ↺' : '次へ ▸';
    button.setAttribute('aria-label', !complete() ? 'セリフを全文表示する' : line === dialogueLines.length - 1 ? '会話を最初から読む' : '次のセリフを読む');
    root.dataset.speaking = String(visible && !complete() && !document.hidden && !portrait.matches);
  }
  function schedule() {
    clearTimeout(timer);
    if (reduced.matches) letters = characters().length;
    render();
    if (!visible || document.hidden || portrait.matches || complete()) return;
    timer = setTimeout(() => { letters++; schedule(); }, 45);
  }
  button.addEventListener('click', () => {
    if (!complete()) letters = characters().length;
    else { line = (line + 1) % dialogueLines.length; letters = 0; }
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  portrait.addEventListener('change', schedule);
  reduced.addEventListener('change', schedule);
  return { setVisible(value) {
    if (visible === value) return;
    visible = value;
    if (value) { line = 0; letters = 0; }
    schedule();
  } };
}
