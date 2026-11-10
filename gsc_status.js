// Check whether the site root is in Google's index, then read the Pages (coverage) counts.
const puppeteer = require('puppeteer-core');

const OUT = 'C:/HermesProject/kelas_tools/tests';
const PROP = 'https://kang851216.github.io/kelas-tools/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

(async () => {
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9333', defaultViewport: null });
  const pages = await b.pages();
  const p = pages.find((x) => /search\.google\.com/.test(x.url())) || pages[0];
  p.setDefaultTimeout(60000);

  await p.goto(`https://search.google.com/search-console?resource_id=${encodeURIComponent(PROP)}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(5000);

  const sel = 'input[aria-label*="Inspect any URL"]';
  await p.waitForSelector(sel, { timeout: 30000 });
  await p.click(sel, { count: 3 });
  await p.keyboard.press('Backspace');
  await p.keyboard.type(PROP, { delay: 12 });
  await sleep(900);
  await p.keyboard.press('Enter');
  await sleep(9000);

  const rootState = await p.evaluate(() => {
    const t = document.body.innerText || '';
    const m = t.match(/URL is on Google|URL is not on Google|Page is indexed|Page is not indexed/);
    const disp = t.match(/Discovered[^\n]{0,40}|Crawled[^\n]{0,40}|Last crawl[^\n]{0,40}/g);
    return { verdict: m ? m[0] : 'unknown', detail: (disp || []).slice(0, 3) };
  });
  log('ROOT ' + JSON.stringify(rootState));
  await p.screenshot({ path: OUT + '/gsc-root.png' });

  // coverage report
  await p.goto(`https://search.google.com/search-console/index?resource_id=${encodeURIComponent(PROP)}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(8000);
  const cov = await p.evaluate(() => {
    const t = document.body.innerText || '';
    const i = t.indexOf('Indexed');
    return { snippet: (i > -1 ? t.slice(Math.max(0, i - 200), i + 500) : t.slice(0, 500)).replace(/\s+/g, ' ') };
  });
  log('PAGES ' + JSON.stringify(cov).slice(0, 700));
  await p.screenshot({ path: OUT + '/gsc-pages.png' });

  // sitemap page evidence
  await p.goto(`https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(PROP)}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(6000);
  const sm = await p.evaluate(() => {
    const t = document.body.innerText || '';
    const i = t.indexOf('Submitted sitemaps');
    return i > -1 ? t.slice(i, i + 260).replace(/\s+/g, ' ') : '';
  });
  log('SITEMAP ' + JSON.stringify(sm));
  await p.screenshot({ path: OUT + '/gsc-sitemaps-final.png' });
  b.disconnect();
})();
