const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'https://kang851216.github.io/kelas-tools';
const GL_ARGS = ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--disable-background-timer-throttling'];

async function run(label, args, vp) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args });
  const page = await browser.newPage();
  await page.setViewport(vp);
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto(BASE + '/roulette.html', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const t = document.getElementById('names');
    t.value = 'Ayu\nBudi\nCitra\nDewi\nEko\nFajar\nGita\nHadi';
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 1200));

  const state = await page.evaluate(() => ({
    glOn: document.body.classList.contains('gl-on'),
    hasGl: !!document.getElementById('gl'),
    canvasVisible: getComputedStyle(document.getElementById('wheel')).display !== 'none'
      && getComputedStyle(document.getElementById('wheel3d')).display !== 'none'
  }));

  await page.evaluate(() => document.getElementById('spin').click());
  const ok = await page.waitForFunction(() => document.getElementById('winner').textContent.trim() !== '', { timeout: 20000 })
    .then(() => true).catch(() => false);
  await new Promise((r) => setTimeout(r, 700));
  const out = {
    label,
    ...state,
    spinResolved: ok,
    winner: await page.$eval('#winner', (e) => e.textContent.trim()),
    scrollW: await page.evaluate(() => document.documentElement.scrollWidth),
    innerW: await page.evaluate(() => window.innerWidth),
    errors: errs
  };
  await page.screenshot({ path: 'tests/final-' + label + '.png', fullPage: label === 'mobile' });
  await browser.close();
  return out;
}

(async () => {
  const mobile = await run('mobile', GL_ARGS, { width: 390, height: 844, deviceScaleFactor: 2 });
  const noWebgl = await run('nowebgl', ['--no-sandbox', '--disable-webgl', '--disable-webgl2',
    '--disable-background-timer-throttling'], { width: 900, height: 1000, deviceScaleFactor: 1 });
  console.log(JSON.stringify({ mobile, noWebgl }, null, 2));
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
