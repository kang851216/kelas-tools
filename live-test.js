const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'https://kang851216.github.io/kelas-tools';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage',
      '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 900 });
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) errs.push('HTTP' + r.status() + ' ' + r.url()); });

  const out = {};

  // --- pages reachable + canonical ---
  const pages = ['/', '/roulette.html', '/kelompok.html', '/timer.html',
    '/panduan/cara-membagi-kelompok-belajar.html', '/panduan/ide-memilih-siswa-acak.html'];
  out.http = {};
  for (const p of pages) {
    const res = await page.goto(BASE + p, { waitUntil: 'domcontentloaded' });
    const canon = await page.evaluate(() => (document.querySelector('link[rel=canonical]') || {}).href || '');
    out.http[p] = { status: res.status(), canonical: canon, title: await page.title() };
  }
  // 404 handling
  const nf = await page.goto(BASE + '/tidak-ada.html', { waitUntil: 'domcontentloaded' });
  out.http['/404'] = { status: nf.status() };

  // --- roulette live ---
  await page.goto(BASE + '/roulette.html', { waitUntil: 'networkidle2' });
  const names = ['Ayu', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fajar'];
  await page.evaluate((n) => {
    const t = document.getElementById('names');
    t.value = n.join('\n');
    t.dispatchEvent(new Event('input', { bubbles: true }));
  }, names);
  await page.evaluate(() => document.getElementById('spin').click());
  await page.waitForFunction(() => document.getElementById('winner').textContent.trim() !== '', { timeout: 15000 });
  out.winner = await page.$eval('#winner', (e) => e.textContent);
  out.winner_valid = names.includes(out.winner);
  await page.screenshot({ path: 'tests/live-roulette.png' });

  // --- group live ---
  await page.goto(BASE + '/kelompok.html', { waitUntil: 'networkidle2' });
  await page.evaluate((n) => {
    const t = document.getElementById('names');
    t.value = n.join('\n');
    t.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('groups').value = '4';
    document.getElementById('roles').value = 'full';
    document.getElementById('go').click();
  }, ['A1', 'B2', 'C3', 'D4', 'E5', 'F6', 'G7', 'H8', 'I9', 'J10', 'K11', 'L12', 'M13']);
  await new Promise((r) => setTimeout(r, 500));
  out.group_sizes = await page.$$eval('.gcard ol', (els) => els.map((o) => o.children.length));
  out.group_total = out.group_sizes.reduce((a, b) => a + b, 0);
  await page.screenshot({ path: 'tests/live-kelompok.png', fullPage: true });

  // --- timer live ---
  await page.goto(BASE + '/timer.html', { waitUntil: 'networkidle2' });
  await page.click('.pillbar .chip[data-min="1"]');
  out.timer_start_val = await page.$eval('#face', (e) => e.textContent);
  await page.evaluate(() => document.getElementById('start').click());
  await new Promise((r) => setTimeout(r, 2500));
  out.timer_after = await page.$eval('#face', (e) => e.textContent);
  out.timer_btn = await page.$eval('#start', (e) => e.textContent);

  // --- sw + manifest ---
  await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2500));
  out.sw = await page.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistrations();
    return r.length ? 'registered:' + (r[0].active ? 'active' : 'installing') : 'none';
  });
  out.manifest = await page.evaluate(async () => {
    const l = document.querySelector('link[rel=manifest]');
    const res = await fetch(l.href);
    return res.status + ' ' + (await res.json()).short_name;
  });

  // --- mobile ---
  await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
  await page.goto(BASE + '/kelompok.html', { waitUntil: 'networkidle2' });
  out.mobile = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth
  }));

  out.errors = errs;
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
