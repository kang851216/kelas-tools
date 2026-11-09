/* roulette.js — roda putar nama */
(function () {
  const TAU = Math.PI * 2;
  const cvs = document.getElementById('wheel');
  const ctx = cvs.getContext('2d');
  const fx = document.getElementById('fx');
  const namesEl = document.getElementById('names');
  const countEl = document.getElementById('count');
  const winEl = document.getElementById('winner');
  const spinBtn = document.getElementById('spin');
  const removeBtn = document.getElementById('remove');
  const shuffleBtn = document.getElementById('shuffle');
  const clearBtn = document.getElementById('clear');
  const shareBtn = document.getElementById('share');
  const stage = document.getElementById('wheel3d');

  // extruded rim: stacked discs at negative Z give the wheel real thickness
  (function buildRim() {
    const LAYERS = 26, GAP = 3;
    for (let i = LAYERS; i >= 1; i--) {
      const d = document.createElement('div');
      d.className = 'rim';
      d.style.transform = 'translateZ(' + (-i * GAP).toFixed(1) + 'px)';
      d.style.background = 'hsl(218 28% ' + (6 + (LAYERS - i) * 0.55).toFixed(1) + '%)';
      stage.insertBefore(d, stage.firstChild);
    }
  })();

  const PALETTE = ['#1d4ed8', '#b45309', '#047857', '#b91c1c', '#6d28d9', '#0e7490', '#be185d', '#4d7c0f'];

  let names = [];
  let rotation = -Math.PI / 2;
  let spinning = false;
  let lastWinner = null;
  let removeMode = false;

  /* ---------- init ---------- */
  const saved = App.loadNames();
  if (saved.length) namesEl.value = saved.join('\n');
  names = App.parseNames(namesEl.value);
  rotation = -Math.PI / Math.max(names.length, 1) / 2;
  syncCount();
  draw();

  namesEl.addEventListener('input', () => {
    names = App.parseNames(namesEl.value);
    App.saveNames(names);
    syncCount();
    lastWinner = null;
    winEl.textContent = '';
    if (!spinning) {
      rotation = -Math.PI / Math.max(names.length, 1) / 2;
      draw();
    }
  });

  function syncCount() {
    countEl.textContent = '(' + names.length + ' nama)';
    spinBtn.disabled = names.length < 2;
    shareBtn.disabled = !lastWinner;
  }

  /* ---------- drawing ---------- */
  function draw(highlight) {
    const W = cvs.width, H = cvs.height;
    const cx = W / 2, cy = H / 2, r = W / 2 - 10;
    ctx.clearRect(0, 0, W, H);

    // shadow ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, TAU);
    ctx.fillStyle = 'rgba(17,24,39,.10)';
    ctx.fill();
    ctx.restore();

    if (names.length === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.fillStyle = '#e5e7eb';
      ctx.fill();
      ctx.fillStyle = '#6b7280';
      ctx.font = '600 34px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Masukkan nama', cx, cy - 20);
      ctx.font = '400 26px system-ui, sans-serif';
      ctx.fillText('di kotak di atas', cx, cy + 24);
      drawHub(cx, cy);
      return;
    }

    const n = names.length;
    const seg = TAU / n;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + i * seg;
      const a1 = a0 + seg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, a0, a1);
      ctx.closePath();
      ctx.fillStyle = PALETTE[i % PALETTE.length];
      ctx.fill();
      if (n > 1) {
        ctx.strokeStyle = 'rgba(255,255,255,.28)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // labels — flip on the left half so every name reads right-side up
    const fs = n <= 8 ? 40 : n <= 12 ? 33 : n <= 18 ? 27 : n <= 26 ? 22 : 18;
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.font = '700 ' + fs + 'px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,.28)';
    ctx.shadowBlur = 4;
    for (let i = 0; i < n; i++) {
      const mid = -Math.PI / 2 + i * seg + seg / 2;
      // flip must be judged on the on-screen angle (wheel rotation included),
      // otherwise labels that rotate into the left half end up upside down
      const screen = ((mid + rotation) % TAU + TAU) % TAU;
      const flipped = screen > Math.PI / 2 && screen < (3 * Math.PI) / 2;
      ctx.save();
      ctx.rotate(flipped ? mid + Math.PI : mid);
      const label = App.fitText(ctx, names[i], r * 0.62);
      if (flipped) {
        ctx.textAlign = 'left';
        ctx.fillText(label, -(r - 30), 0);
      } else {
        ctx.textAlign = 'right';
        ctx.fillText(label, r - 30, 0);
      }
      ctx.restore();
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    drawHub(cx, cy);
  }

  function drawHub(cx, cy) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 46, 0, TAU);
    const hg = ctx.createRadialGradient(cx - 14, cy - 16, 4, cx, cy, 52);
    hg.addColorStop(0, '#ffffff');
    hg.addColorStop(0.65, '#f3f4f6');
    hg.addColorStop(1, '#dfe3e8');
    ctx.fillStyle = hg;
    ctx.shadowColor = 'rgba(17,24,39,.28)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#111827';
    ctx.font = '700 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎯', cx, cy + 1);
  }

  /* ---------- spin ---------- */
  function currentIndex(rot) {
    const seg = TAU / names.length;
    let local = ((-rot) % TAU + TAU) % TAU;
    let idx = Math.floor(local / seg);
    if (idx >= names.length) idx = names.length - 1;
    return idx;
  }

  function spin() {
    if (spinning || names.length < 2) return;
    spinning = true;
    stage.classList.remove('settle');
    stage.classList.add('spinning');
    spinBtn.disabled = true;
    winEl.textContent = '';
    winEl.classList.remove('pop');
    lastWinner = null;

    // shuffle display order so position never correlates with list order
    names = App.shuffle(names);
    namesEl.value = names.join('\n');
    App.saveNames(names);

    const start = rotation;
    const turns = 6 + App.randInt(4);
    const target = start + TAU * turns + Math.random() * TAU;
    const dur = 4300;
    const t0 = performance.now();

    // Safety net: if requestAnimationFrame is throttled (background tab, battery saver,
    // some mobile browsers), force completion so the result never stalls.
    const guard = setTimeout(() => {
      if (spinning) { finish(target); }
    }, dur + 400);

    (function frame(now) {
      if (!spinning) { clearTimeout(guard); return; }
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4); // easeOutQuart
      rotation = start + (target - start) * e;
      draw();
      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        clearTimeout(guard);
        finish(target);
      }
    })(performance.now());

    // tick sounds
    let tick = 0;
    const tickTimer = setInterval(() => {
      tick++;
      App.beep(1200, 40, 0.02);
      if (tick > 26) clearInterval(tickTimer);
    }, 160);
    setTimeout(() => clearInterval(tickTimer), dur);
  }

  function finish(rot) {
    rotation = rot;
    spinning = false;
    stage.classList.remove('spinning');
    stage.classList.add('settle');
    setTimeout(() => stage.classList.remove('settle'), 650);
    const idx = currentIndex(rotation);
    lastWinner = names[idx];
    winEl.textContent = lastWinner;
    winEl.classList.add('pop');
    draw();
    App.beep(660, 120, 0.09);
    setTimeout(() => App.beep(990, 220, 0.09), 130);
    App.confetti(fx, 1800);
    syncCount();
    spinBtn.disabled = false;

    if (removeMode && names.length > 2) {
      setTimeout(() => {
        names = names.filter((_, i) => i !== idx);
        namesEl.value = names.join('\n');
        App.saveNames(names);
        syncCount();
        draw();
      }, 1400);
    }
  }

  /* ---------- share card ---------- */
  function makeCard() {
    const S = 1080;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');

    const grad = g.createLinearGradient(0, 0, S, S);
    grad.addColorStop(0, '#1d4ed8');
    grad.addColorStop(1, '#0e7490');
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);

    // card
    const pad = 90;
    g.fillStyle = 'rgba(255,255,255,.10)';
    roundRect(g, pad, pad, S - pad * 2, S - pad * 2, 56);
    g.fill();

    g.fillStyle = 'rgba(255,255,255,.85)';
    g.font = '600 40px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('PEMENANG PUTARAN', S / 2, 260);

    // winner name, auto-fit
    let fs = 132;
    g.fillStyle = '#ffffff';
    do {
      g.font = '800 ' + fs + 'px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      fs -= 6;
    } while (g.measureText(lastWinner).width > S - 260 && fs > 54);
    g.fillText(lastWinner, S / 2, S / 2 - 10);

    g.font = '600 42px system-ui, sans-serif';
    g.fillStyle = 'rgba(255,255,255,.9)';
    g.fillText(App.today(), S / 2, S / 2 + 130);

    g.font = '700 40px system-ui, sans-serif';
    g.fillStyle = 'rgba(255,255,255,.75)';
    g.fillText('KelasTools · Roda Putar Nama', S / 2, S - 190);

    return c;
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  /* ---------- events ---------- */
  spinBtn.addEventListener('click', spin);
  cvs.addEventListener('click', spin);

  shareBtn.addEventListener('click', () => {
    if (!lastWinner) return;
    App.shareOrDownload(makeCard(), 'pemenang-' + lastWinner.replace(/\s+/g, '-').toLowerCase() + '.png',
      'Pemenang: ' + lastWinner);
  });

  removeBtn.addEventListener('click', () => {
    removeMode = !removeMode;
    removeBtn.classList.toggle('primary', removeMode);
    removeBtn.textContent = removeMode ? 'Keluarkan: AKTIF' : 'Keluarkan pemenang';
    App.toast(removeMode ? 'Pemenang otomatis dikeluarkan' : 'Mode keluar dimatikan');
  });

  shuffleBtn.addEventListener('click', () => {
    names = App.shuffle(names);
    namesEl.value = names.join('\n');
    App.saveNames(names);
    draw();
    App.toast('Urutan diacak');
  });

  clearBtn.addEventListener('click', () => {
    if (!confirm('Hapus semua nama?')) return;
    names = [];
    namesEl.value = '';
    App.saveNames(names);
    lastWinner = null;
    winEl.textContent = '';
    syncCount();
    draw();
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); spin(); }
  });
})();
