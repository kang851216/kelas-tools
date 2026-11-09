const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://127.0.0.1:8765';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage',
      '--disable-background-timer-throttling', '--disable-renderer-backgrounding']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 820, height: 1000, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });

  await page.goto(BASE + '/roulette.html', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const t = document.getElementById('names');
    t.value = 'Ayu\nBudi\nCitra\nDewi\nEko\nFajar\nGita\nHadi';
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 400));

  for (const tilt of [22, 30, 40]) {
    await page.evaluate((d) => document.getElementById('wheel3d').style.setProperty('--tilt', d + 'deg'), tilt);
    await new Promise((r) => setTimeout(r, 350));
    const el = await page.$('.wheelbox');
    await el.screenshot({ path: 'tests/3d-tilt' + tilt + '.png' });
  }

  // restore default and verify a full spin still resolves
  await page.evaluate(() => document.getElementById('wheel3d').style.removeProperty('--tilt'));
  await page.evaluate(() => document.getElementById('spin').click());
  const spinning = await page.evaluate(() => document.getElementById('wheel3d').className);
  await page.waitForFunction(() => document.getElementById('winner').textContent.trim() !== '', { timeout: 15000 });
  const out = {
    class_during_spin: spinning,
    class_after: await page.evaluate(() => document.getElementById('wheel3d').className),
    winner: await page.$eval('#winner', (e) => e.textContent),
    rim_layers: await page.$$eval('.rim', (e) => e.length),
    errors: errs
  };
  await page.screenshot({ path: 'tests/3d-after-spin.png' });
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
