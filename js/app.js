/* app.js — shared helpers (no dependencies) */
(function () {
  const KEY = {
    names: 'kelas.names',
    wheel: 'kelas.wheel.opts',
    groups: 'kelas.groups.opts'
  };

  const App = {
    KEY,

    /* ---------- storage ---------- */
    load(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) { return fallback; }
    },
    save(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    },

    /* ---------- names ---------- */
    // one name per line, or comma separated. trims, dedupes, drops empties.
    parseNames(text) {
      if (!text) return [];
      const parts = String(text).split(/[\n,;]+/);
      const out = [];
      const seen = new Set();
      for (let raw of parts) {
        const n = raw.trim().replace(/\s+/g, ' ');
        if (!n) continue;
        const k = n.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(n);
      }
      return out;
    },
    loadNames() {
      const saved = App.load(KEY.names, null);
      return Array.isArray(saved) ? saved : [];
    },
    saveNames(list) { App.save(KEY.names, list || []); },

    /* ---------- random ---------- */
    randInt(n) {
      if (n <= 0) return 0;
      // crypto for fairness where available
      if (window.crypto && window.crypto.getRandomValues) {
        const max = 0xFFFFFFFF;
        const limit = max - (max % n);
        const buf = new Uint32Array(1);
        let v;
        do { window.crypto.getRandomValues(buf); v = buf[0]; } while (v >= limit);
        return v % n;
      }
      return Math.floor(Math.random() * n);
    },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = App.randInt(i + 1);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },

    /* ---------- ui ---------- */
    toast(msg) {
      let el = document.querySelector('.toast');
      if (!el) {
        el = document.createElement('div');
        el.className = 'toast';
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.classList.add('show');
      clearTimeout(el._t);
      el._t = setTimeout(() => el.classList.remove('show'), 2200);
    },

    copy(text, okMsg) {
      const done = () => App.toast(okMsg || 'Disalin ke clipboard');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => App.fallbackCopy(text, done));
      } else {
        App.fallbackCopy(text, done);
      }
    },
    fallbackCopy(text, done) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { App.toast('Gagal menyalin'); }
      document.body.removeChild(ta);
    },

    download(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
    },

    // Share image if the browser supports file sharing, else download.
    async shareOrDownload(canvasOrBlob, filename, text) {
      let blob = canvasOrBlob;
      if (blob && blob.toBlob) {
        blob = await new Promise((res) => blob.toBlob(res, 'image/png'));
      }
      if (!blob) { App.toast('Gagal membuat gambar'); return; }
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: text || '' });
          return;
        } catch (e) { /* user cancelled -> fall through */ }
      }
      App.download(blob, filename);
      App.toast('Gambar diunduh');
    },

    /* ---------- pwa ---------- */
    registerSW() {
      if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
        window.addEventListener('load', () => {
          // resolve sw.js from the site root, works from /panduan/ pages too
          let swUrl = 'sw.js';
          const css = document.querySelector('link[rel="stylesheet"]');
          if (css && css.getAttribute('href')) {
            const href = css.getAttribute('href');
            const i = href.lastIndexOf('css/');
            if (i >= 0) swUrl = href.slice(0, i) + 'sw.js';
          }
          navigator.serviceWorker.register(swUrl).catch(() => {});
        });
      }
    },

    /* ---------- sound ---------- */
    beep(freq, ms, vol) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        App._ctx = App._ctx || new Ctx();
        const ctx = App._ctx;
        if (ctx.state === 'suspended') ctx.resume();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq || 880;
        g.gain.value = vol == null ? 0.08 : vol;
        o.connect(g); g.connect(ctx.destination);
        o.start();
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (ms || 140) / 1000);
        o.stop(ctx.currentTime + (ms || 140) / 1000 + 0.02);
      } catch (e) {}
    },

    /* ---------- confetti ---------- */
    confetti(canvas, durationMs) {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const colors = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];
      const parts = [];
      for (let i = 0; i < 90; i++) {
        parts.push({
          x: W / 2 + (Math.random() - 0.5) * W * 0.5,
          y: H * 0.42,
          vx: (Math.random() - 0.5) * 7,
          vy: -Math.random() * 9 - 2,
          r: 3 + Math.random() * 4,
          c: colors[(Math.random() * colors.length) | 0],
          a: 1,
          rot: Math.random() * Math.PI
        });
      }
      const end = performance.now() + (durationMs || 1600);
      function frame(now) {
        ctx.clearRect(0, 0, W, H);
        for (const p of parts) {
          p.vy += 0.22; p.x += p.vx; p.y += p.vy; p.rot += 0.08; p.a -= 0.008;
          if (p.a <= 0) continue;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.a);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.c;
          ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 1.3);
          ctx.restore();
        }
        if (now < end) requestAnimationFrame(frame);
        else ctx.clearRect(0, 0, W, H);
      }
      requestAnimationFrame(frame);
    },

    /* ---------- text helpers ---------- */
    // break a name into one or two lines: used by the wheel so long names get
    // bigger text instead of shrinking to an unreadable size
    splitLabel(text, measure, limit) {
      const str = String(text).trim();
      if (measure(str) <= limit * 1.75) return [str];
      const words = str.split(/\s+/).filter(Boolean);
      if (words.length < 2) return [str]; // never break inside a single word
      let best = null;
      for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i).join(' ');
        const b = words.slice(i).join(' ');
        const score = Math.max(measure(a), measure(b));
        if (!best || score < best.score) best = { score, lines: [a, b] };
      }
      return best.lines;
    },

    fitText(ctx, text, maxW) {
      if (ctx.measureText(text).width <= maxW) return text;
      let t = text;
      while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
      return t + '…';
    },

    today() {
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    }
  };

  window.App = App;
  App.registerSW();
})();
