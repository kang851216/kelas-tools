const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://127.0.0.1:8765';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-timer-throttling']
  });
  const out = {};

  for (const [name, vp] of Object.entries({
    mobile: { width: 390, height: 844, deviceScaleFactor: 2 },
    desktop: { width: 1280, height: 900, deviceScaleFactor: 1 }
  })) {
    const page = await browser.newPage();
    await page.setViewport(vp);
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(BASE + '/roulette.html', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const t = document.getElementById('names');
      t.value = 'Ayu\nBudi\nCitra\nDewi\nEko\nFajar\nGita\nHadi';
      t.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: 'tests/3d-full-' + name + '.png', fullPage: name === 'mobile' });

    const m = await page.evaluate(() => {
      const box = document.querySelector('.wheelbox').getBoundingClientRect();
      const ptr = document.getElementById('pointer').getBoundingClientRect();
      const win = document.querySelector('.winner').getBoundingClientRect();
      const cnt = document.querySelector('#count, .count, [id*=count]');
      return {
        wheelbox: [Math.round(box.top), Math.round(box.bottom), Math.round(box.width)],
        pointer_top: Math.round(ptr.top),
        winner_top: Math.round(win.top),
        overlap_winner: ptr.bottom > win.top,
        scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
        errors: []
      };
    });
    m.errors = errs;
    out[name] = m;
    await page.close();
  }
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
