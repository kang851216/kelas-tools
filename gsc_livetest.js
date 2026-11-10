// Live-test the sitemap URL in Search Console: proves Google's fetcher can reach it.
const puppeteer = require('puppeteer-core');

const OUT = 'C:/HermesProject/kelas_tools/tests';
const PROP = 'https://kang851216.github.io/kelas-tools/';
const TARGET = 'https://kang851216.github.io/kelas-tools/sitemap.xml';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

(async () => {
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9333', defaultViewport: null });
  const pages = await b.pages();
  const p = pages.find((x) => /search\.google\.com/.test(x.url())) || pages[0];
  p.setDefaultTimeout(60000);

  await p.goto(`https://search.google.com/search-console?resource_id=${encodeURIComponent(PROP)}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(4500);

  const sel = 'input[aria-label*="Inspect any URL"]';
  await p.waitForSelector(sel, { timeout: 30000 });
  await p.click(sel, { count: 3 });
  await p.keyboard.press('Backspace');
  await p.keyboard.type(TARGET, { delay: 12 });
  await sleep(900);
  await p.keyboard.press('Enter');
  await sleep(9000);

  const clicked = await p.evaluate(() => {
    const btn = [...document.querySelectorAll('button,[role="button"]')]
      .find((e) => /test live url|uji url live/i.test(e.innerText || ''));
    if (!btn) return 'no-button';
    btn.scrollIntoView({ block: 'center' });
    btn.click();
    return 'clicked';
  });
  log('LIVE_TEST ' + clicked);
  await sleep(15000);

  const res = await p.evaluate(() => {
    const t = document.body.innerText || '';
    const m = t.match(/URL is available to Google|URL is not available to Google|Page fetch[^\n]{0,40}|Crawled successfully|Couldn't fetch[^\n]{0,30}/gi);
    return { hits: (m || []).slice(0, 4), snippet: t.slice(t.indexOf('Live Test'), t.indexOf('Live Test') + 700).replace(/\s+/g, ' ') };
  });
  log('RESULT ' + JSON.stringify(res).slice(0, 800));
  await p.screenshot({ path: OUT + '/gsc-sitemap-livetest.png' });
  b.disconnect();
})();
