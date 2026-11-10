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
  const waBtn = document.getElementById('wa');
  const stage = document.getElementById('wheel3d');
  let wheel3d = null;

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
      refreshNames();
    }
  });

  function refreshNames() {
    if (wheel3d) {
      wheel3d.setNames(names);
      wheel3d.setRotation(rotation, spinning);
    } else {
      draw();
    }
  }

  function syncCount() {
    countEl.textContent = '(' + names.length + ' nama)';
    spinBtn.disabled = names.length < 2;
    shareBtn.disabled = !lastWinner;
    if (waBtn) waBtn.disabled = !lastWinner;
  }

  /* ---------- drawing ---------- */
  function draw(highlight) {
    if (wheel3d) { wheel3d.setRotation(rotation, spinning); return; }
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
    const fs = n <= 8 ? 60 : n <= 12 ? 50 : n <= 18 ? 40 : n <= 26 ? 33 : 27;
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
      const maxW = r * 0.80; // room from just outside the hub to just inside the rim
      const font = (px) => '700 ' + px + 'px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      let lfs = fs;
      ctx.font = font(lfs);
      // over 20 names: one line, capped so the glyphs stay readable
      const full = names[i];
      const shown = n > 20 && full.length > 13 ? full.slice(0, 12).trimEnd() + '…' : full;
      const lines = n > 20 ? [shown] : App.splitLabel(full, (t) => ctx.measureText(t).width, maxW);
      while (Math.max(...lines.map((l) => ctx.measureText(l).width)) > maxW && lfs > fs * 0.32) {
        lfs -= 1;
        ctx.font = font(lfs);
      }
      const step = lfs * 1.14;
      const y0 = -((lines.length - 1) * step) / 2;
      const x = flipped ? -(r - 14) : r - 14;
      ctx.textAlign = flipped ? 'left' : 'right';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(2, lfs * 0.14);
      ctx.strokeStyle = 'rgba(6,10,20,.55)';
      lines.forEach((ln, k) => {
        const t = ctx.measureText(ln).width > maxW ? App.fitText(ctx, ln, maxW) : ln;
        ctx.strokeText(t, x, y0 + k * step);
      });
      ctx.fillStyle = '#ffffff';
      lines.forEach((ln, k) => {
        const t = ctx.measureText(ln).width > maxW ? App.fitText(ctx, ln, maxW) : ln;
        ctx.fillText(t, x, y0 + k * step);
      });
      ctx.restore();
      ctx.font = '700 ' + fs + 'px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
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
    refreshNames();

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

    let lastTickIdx = currentIndex(rotation);
    let lastTickAt = 0;

    (function frame(now) {
      if (!spinning) { clearTimeout(guard); return; }
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4); // easeOutQuart
      rotation = start + (target - start) * e;

      // click every time a segment boundary passes the pointer
      const idx = currentIndex(rotation);
      if (idx !== lastTickIdx) {
        lastTickIdx = idx;
        if (now - lastTickAt > 45) {
          lastTickAt = now;
          App.beep(1120 + Math.random() * 110, 20, 0.013);
        }
      }
      draw();
      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        clearTimeout(guard);
        finish(target);
      }
    })(performance.now());
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
    if (wheel3d) wheel3d.highlight(idx);
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
        refreshNames();
      }, 1400);
    }
  }

  /* ---------- share card ---------- */
  /* QR on the card points back at this page with ref=qr, so scans are measurable */
  const qrImg = new Image();
  qrImg.decoding = 'async';
  qrImg.src = 'img/qr-roulette.png';

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

    // bottom band: QR + address, so a shared card can actually bring people back
    const by = S - 306, bh = 196;
    g.fillStyle = 'rgba(255,255,255,.95)';
    roundRect(g, pad, by, S - pad * 2, bh, 42);
    g.fill();
    const qs = 140, qx = pad + 30, qy = by + (bh - qs) / 2;
    if (qrImg.complete && qrImg.naturalWidth) {
      g.drawImage(qrImg, qx, qy, qs, qs);
    } else {
      g.fillStyle = '#e2e8f0';
      roundRect(g, qx, qy, qs, qs, 12);
      g.fill();
    }
    const tx = qx + qs + 32;
    const avail = S - pad - 26 - tx;
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = '#64748b';
    g.font = '600 27px system-ui, sans-serif';
    g.fillText('Coba gratis · tanpa daftar', tx, by + 58);
    const addr = 'kang851216.github.io/kelas-tools';
    let us = 36;
    do { g.font = '800 ' + us + 'px system-ui, sans-serif'; us -= 1; }
    while (g.measureText(addr).width > avail && us > 20);
    g.fillStyle = '#0f172a';
    g.fillText(addr, tx, by + 120);

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

  if (waBtn) {
    waBtn.addEventListener('click', () => {
      if (!lastWinner) return;
      const url = 'https://kang851216.github.io/kelas-tools/roulette.html?ref=wa';
      const text = 'Pemenang undian: ' + lastWinner +
        '\nRoda putar nama gratis untuk kelas (bisa offline): ' + url;
      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
  }

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
    refreshNames();
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
    refreshNames();
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); spin(); }
  });

  /* ---------- optional three.js renderer (progressive enhancement) ---------- */
  const probe = document.createElement('canvas');
  const webglOK = !!(probe.getContext('webgl2') || probe.getContext('webgl'));
  if (webglOK) {
    let loading3D = false;
    const loadThree = () => {
      if (loading3D || wheel3d) return;
      loading3D = true;
      import(new URL('js/roulette3d.js', document.baseURI).href)
        .then((mod) => {
          const w = mod.createWheel3D({
            container: document.querySelector('.wheelbox'),
            palette: PALETTE
          });
          if (!w) { loading3D = false; return; }
          const activate = () => {
            // never swap renderers mid-spin: the wheel would visibly jump
            if (spinning) { setTimeout(activate, 400); return; }
            wheel3d = w;
            wheel3d.setNames(names);
            wheel3d.setRotation(rotation, false);
            document.body.classList.add('gl-on');
            const gl = document.getElementById('gl');
            if (gl) gl.addEventListener('click', spin);
          };
          activate();
        })
        .catch(() => { loading3D = false; /* keep the canvas wheel */ });
    };
    // three.js is ~165 KB gzip — half of what a teacher on a metered phone would
    // download. Fetch it only once they show intent (typing names, touching the
    // wheel, pressing play), with a late fallback for passive visitors.
    const engage = { once: true, passive: true };
    namesEl.addEventListener('input', loadThree, engage);
    namesEl.addEventListener('paste', loadThree, engage);
    if (spinBtn) spinBtn.addEventListener('click', loadThree, engage);
    const box = document.querySelector('.wheelbox');
    if (box) {
      ['pointerdown', 'touchstart'].forEach((ev) => box.addEventListener(ev, loadThree, engage));
    }
    window.addEventListener('keydown', loadThree, engage);
    setTimeout(loadThree, 15000);
  }
})();
