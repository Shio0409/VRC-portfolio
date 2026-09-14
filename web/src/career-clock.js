/** Presentation time, independent of video playback and calendar-year spacing. */
export function createCareerClock({ duration, now, onChange, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let time = 0, playing = false, active = false, timer, last;
  const state = () => ({ time, playing, duration });
  function stopTimer() { clearTimer(timer); timer = undefined; }
  function tick() {
    stopTimer();
    if (!active || !playing) return;
    const current = now(); time = Math.min(duration, time + Math.max(0, current - last) / 1000); last = current;
    if (time === duration) playing = false;
    onChange(state());
    if (playing) timer = setTimer(tick, 100);
  }
  return {
    getState: state,
    setActive(value) { if (active === value) return; active = value; last = now(); stopTimer(); if (active) tick(); },
    play() { if (time >= duration) time = 0; playing = true; last = now(); tick(); onChange(state()); },
    pause() { tick(); playing = false; stopTimer(); onChange(state()); },
    seek(value) { if (!Number.isFinite(value)) return; time = Math.max(0, Math.min(duration, value)); last = now(); if (time === duration) { playing = false; stopTimer(); } onChange(state()); },
    reset() { stopTimer(); time = 0; playing = false; onChange(state()); },
  };
}

export function chapterAt(chapters, time) {
  let start = 0;
  for (let index = 0; index < chapters.length; index++) {
    start += chapters[index].duration;
    if (time < start) return index;
  }
  return chapters.length - 1;
}
