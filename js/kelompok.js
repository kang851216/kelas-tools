/* kelompok.js — pembagi kelompok acak */
(function () {
  const namesEl = document.getElementById('names');
  const countEl = document.getElementById('count');
  const groupsEl = document.getElementById('groups');
  const rolesEl = document.getElementById('roles');
  const goBtn = document.getElementById('go');
  const againBtn = document.getElementById('again');
  const outEl = document.getElementById('out');
  const actionsEl = document.getElementById('actions');

  const ROLE_SETS = {
    none: [],
    basic: ['Ketua', 'Notulis', 'Juru Bicara'],
    full: ['Ketua', 'Notulis', 'Juru Bicara', 'Anggota']
  };

  let names = [];
  let result = null; // [{title, members:[{name, role}]}]

  const saved = App.loadNames();
  if (saved.length) namesEl.value = saved.join('\n');
  names = App.parseNames(namesEl.value);
  updateCount();

  namesEl.addEventListener('input', () => {
    names = App.parseNames(namesEl.value);
    App.saveNames(names);
    updateCount();
  });

  function updateCount() {
    countEl.textContent = '(' + names.length + ' nama)';
  }

  function distribute(list, k) {
    const n = list.length;
    const base = Math.floor(n / k);
    const rem = n % k;
    const groups = [];
    let p = 0;
    for (let i = 0; i < k; i++) {
      const size = base + (i < rem ? 1 : 0);
      groups.push(list.slice(p, p + size));
      p += size;
    }
    return groups;
  }

  function build() {
    const k = parseInt(groupsEl.value, 10) || 2;
    if (names.length < k) {
      App.toast('Nama lebih sedikit dari jumlah kelompok');
      return;
    }
    if (names.length < 2) {
      App.toast('Masukkan minimal 2 nama');
      return;
    }
    const roleKey = rolesEl.value;
    const roles = ROLE_SETS[roleKey] || [];

    const shuffled = App.shuffle(names);
    const groups = distribute(shuffled, k);

    result = groups.map((members, gi) => {
      let roleOrder = roles.slice();
      if (roleKey === 'full') {
        // 'Anggota' fills the rest; shuffle the three named roles
        roleOrder = App.shuffle(ROLE_SETS.basic);
      } else if (roleOrder.length) {
        roleOrder = App.shuffle(roleOrder);
      }
      return {
        title: 'Kelompok ' + (gi + 1),
        members: members.map((name, mi) => ({
          name,
          role: roleOrder.length ? (roleOrder[mi] || (roleKey === 'full' ? 'Anggota' : '')) : ''
        }))
      };
    });

    render();
    againBtn.disabled = false;
    actionsEl.style.display = 'flex';
  }

  function render() {
    outEl.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'groups';
    for (const g of result) {
      const card = document.createElement('div');
      card.className = 'gcard';
      const h = document.createElement('h4');
      h.textContent = g.title + ' · ' + g.members.length + ' orang';
      card.appendChild(h);
      const ol = document.createElement('ol');
      for (const m of g.members) {
        const li = document.createElement('li');
        li.textContent = m.name + (m.role ? ' — ' + m.role : '');
        ol.appendChild(li);
      }
      card.appendChild(ol);
      wrap.appendChild(card);
    }
    outEl.appendChild(wrap);
  }

  function asText() {
    return result.map(g =>
      g.title + '\n' + g.members.map((m, i) => (i + 1) + '. ' + m.name + (m.role ? ' (' + m.role + ')' : '')).join('\n')
    ).join('\n\n');
  }

  function asCsv() {
    const rows = [['kelompok', 'nomor', 'nama', 'peran']];
    for (const g of result) {
      g.members.forEach((m, i) => rows.push([g.title, i + 1, m.name, m.role || '']));
    }
    return rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  }

  function makeCanvas() {
    const S = 1080;
    const pad = 56;
    const colW = (S - pad * 2 - 28) / 2;

    // measure pass
    const tmp = document.createElement('canvas').getContext('2d');
    tmp.font = '600 30px system-ui, sans-serif';
    const heights = result.map(g => 78 + g.members.length * 44 + 18);
    const rows = [];
    let i = 0;
    while (i < result.length) {
      const a = heights[i], b = heights[i + 1] || 0;
      rows.push(Math.max(a, b));
      i += 2;
    }
    const H = 300 + rows.reduce((s, h) => s + h + 20, 0) + 70;

    const c = document.createElement('canvas');
    c.width = S; c.height = H;
    const g2 = c.getContext('2d');

    g2.fillStyle = '#f6f7f9';
    g2.fillRect(0, 0, S, H);

    g2.fillStyle = '#1d4ed8';
    g2.fillRect(0, 0, S, 150);
    g2.fillStyle = '#ffffff';
    g2.font = '800 52px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    g2.textAlign = 'left';
    g2.textBaseline = 'middle';
    g2.fillText('Pembagian Kelompok', pad, 68);
    g2.font = '600 28px system-ui, sans-serif';
    g2.fillStyle = 'rgba(255,255,255,.85)';
    g2.fillText(names.length + ' siswa · ' + result.length + ' kelompok · ' + App.today(), pad, 116);

    let y = 200;
    for (let r = 0; r < rows.length; r++) {
      const left = result[r * 2];
      const right = result[r * 2 + 1];
      if (left) drawGroup(g2, left, pad, y, colW);
      if (right) drawGroup(g2, right, pad + colW + 28, y, colW);
      y += rows[r] + 20;
    }

    g2.fillStyle = '#6b7280';
    g2.font = '600 26px system-ui, sans-serif';
    g2.textAlign = 'center';
    g2.fillText('Dibuat dengan KelasTools · gratis & tanpa unggah', S / 2, H - 36);
    return c;
  }

  function drawGroup(g2, grp, x, y, w) {
    const h = 78 + grp.members.length * 44 + 18;
    g2.fillStyle = '#ffffff';
    roundRect(g2, x, y, w, h, 20);
    g2.fill();
    g2.strokeStyle = '#e5e7eb';
    g2.lineWidth = 2;
    g2.stroke();

    g2.fillStyle = '#6b7280';
    g2.font = '700 24px system-ui, sans-serif';
    g2.textAlign = 'left';
    g2.textBaseline = 'middle';
    g2.fillText(grp.title.toUpperCase() + ' · ' + grp.members.length, x + 24, y + 40);

    g2.fillStyle = '#111827';
    g2.font = '600 30px system-ui, sans-serif';
    grp.members.forEach((m, i) => {
      const line = m.name + (m.role ? '  ·  ' + m.role : '');
      g2.fillText(appFit(g2, line, w - 48), x + 24, y + 82 + i * 44);
    });
  }

  function appFit(g2, text, maxW) {
    if (g2.measureText(text).width <= maxW) return text;
    let t = text;
    while (t.length > 1 && g2.measureText(t + '…').width > maxW) t = t.slice(0, -1);
    return t + '…';
  }

  function roundRect(g2, x, y, w, h, r) {
    g2.beginPath();
    g2.moveTo(x + r, y);
    g2.arcTo(x + w, y, x + w, y + h, r);
    g2.arcTo(x + w, y + h, x, y + h, r);
    g2.arcTo(x, y + h, x, y, r);
    g2.arcTo(x, y, x + w, y, r);
    g2.closePath();
  }

  goBtn.addEventListener('click', build);
  againBtn.addEventListener('click', build);

  document.getElementById('copy').addEventListener('click', () => App.copy(asText(), 'Teks kelompok disalin'));
  document.getElementById('csv').addEventListener('click', () => {
    App.download(new Blob([asCsv()], { type: 'text/csv;charset=utf-8' }), 'kelompok-' + App.today() + '.csv');
  });
  document.getElementById('png').addEventListener('click', () => {
    App.shareOrDownload(makeCanvas(), 'kelompok-' + App.today() + '.png', 'Pembagian kelompok');
  });
})();
