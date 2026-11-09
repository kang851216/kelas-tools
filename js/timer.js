/* timer.js — timer kelas */
(function () {
  const face = document.getElementById('face');
  const startBtn = document.getElementById('start');
  const plusBtn = document.getElementById('plus');
  const resetBtn = document.getElementById('reset');
  const customEl = document.getElementById('custom');

  let totalMs = 5 * 60 * 1000;
  let remaining = totalMs;
  let running = false;
  let endAt = 0;
  let raf = null;
  let wakeLock = null;

  function fmt(ms) {
    const t = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(t / 60);
    const s = t % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function paint() {
    face.textContent = fmt(remaining);
    const pct = totalMs ? remaining / totalMs : 0;
    face.style.color = remaining <= 10000 && remaining > 0 ? '#ef4444' : '';
    face.style.opacity = running ? '1' : '.92';
    document.title = running ? fmt(remaining) + ' · Timer Kelas' : 'Timer Kelas Online — Penghitung Waktu Kegiatan Belajar | KelasTools';
    if (pct < 0) return;
  }

  function tick() {
    remaining = endAt - performance.now();
    if (remaining <= 0) {
      remaining = 0;
      paint();
      stop();
      done();
      return;
    }
    paint();
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (running) { pause(); return; }
    if (remaining <= 0) remaining = totalMs;
    endAt = performance.now() + remaining;
    running = true;
    startBtn.textContent = 'Jeda';
    startBtn.classList.remove('primary');
    requestWakeLock();
    raf = requestAnimationFrame(tick);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(raf);
    startBtn.textContent = 'Lanjut';
    startBtn.classList.add('primary');
    releaseWakeLock();
    paint();
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    startBtn.textContent = 'Mulai';
    startBtn.classList.add('primary');
    releaseWakeLock();
  }

  function reset() {
    stop();
    remaining = totalMs;
    paint();
  }

  function done() {
    App.beep(880, 200, 0.12);
    setTimeout(() => App.beep(880, 200, 0.12), 320);
    setTimeout(() => App.beep(1320, 400, 0.12), 660);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    face.textContent = '00:00';
    face.style.color = '#ef4444';
    App.toast('Waktu habis');
  }

  function setMinutes(m) {
    const v = Math.max(1, Math.min(180, m || 1));
    totalMs = v * 60 * 1000;
    remaining = totalMs;
    stop();
    paint();
    customEl.value = v;
  }

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
      }
    } catch (e) {}
  }
  function releaseWakeLock() {
    try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch (e) {}
  }

  startBtn.addEventListener('click', start);
  plusBtn.addEventListener('click', () => {
    const add = 60 * 1000;
    totalMs += add;
    if (running) endAt += add; else remaining += add;
    paint();
  });
  resetBtn.addEventListener('click', reset);
  customEl.addEventListener('change', () => setMinutes(parseInt(customEl.value, 10)));

  document.querySelectorAll('.pillbar .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.pillbar .chip').forEach(c => c.style.borderColor = '');
      chip.style.borderColor = 'var(--accent)';
      setMinutes(parseInt(chip.dataset.min, 10));
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && running) {
      remaining = endAt - performance.now();
      if (remaining <= 0) { remaining = 0; paint(); stop(); done(); }
      else paint();
    }
  });

  setMinutes(5);
})();
