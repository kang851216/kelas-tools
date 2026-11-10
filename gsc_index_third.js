// Request indexing for the remaining URL (the previous run aborted on navigation).
const puppeteer = require('puppeteer-core');

const OUT = 'C:/HermesProject/kelas_tools/tests';
const PROP = 'https://kang851216.github.io/kelas-tools/';
const TARGET = 'https://kang851216.github.io/kelas-tools/pembagi-kelompok-4-orang.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

(async () => {
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9333', defaultViewport: null });
  const pages = await b.pages();
  const p = pages.find((x) => /search\.google\.com/.test(x.url())) || pages[0];
  p.setDefaultTimeout(60000);

  try {
    await p.goto(`https://search.google.com/search-console?resource_id=${encodeURIComponent(PROP)}`,
      { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (e) {
    log('nav warning: ' + e.message.slice(0, 60));
  }
  await sleep(5000);

  const sel = 'input[aria-label*="Inspect any URL"]';
  await p.waitForSelector(sel, { timeout: 30000 });
  await p.click(sel, { count: 3 });
  await p.keyboard.press('Backspace');
  await p.keyboard.type(TARGET, { delay: 12 });
  await sleep(900);
  await p.keyboard.press('Enter');
  log('typed ' + TARGET);

  let line = '';
  for (let i = 0; i < 14; i++) {
    await sleep(2500);
    const s = await p.evaluate(() => {
      const t = document.body.innerText || '';
      const btn = [...document.querySelectorAll('button,[role="button"]')]
        .find((e) => /request indexing|minta pengindeksan/i.test(e.innerText || ''));
      const m = t.match(/URL is on Google|URL is not on Google|Page is indexed|Page is not indexed/);
      return { hasBtn: !!btn, line: m ? m[0] : '' };
    }).catch(() => ({ hasBtn: false, line: '' }));
    if (s.line) line = s.line;
    if (s.hasBtn) {
      await p.evaluate(() => {
        const btn = [...document.querySelectorAll('button,[role="button"]')]
          .find((e) => /request indexing|minta pengindeksan/i.test(e.innerText || ''));
        btn.scrollIntoView({ block: 'center' });
        btn.click();
      });
      await sleep(4500);
      const dlg = await p.evaluate(() => {
        const t = document.body.innerText || '';
        const m = t.match(/Indexing requested[^\n]{0,40}|Testing if live URL[^\n]{0,30}|added to a priority crawl queue[^\n]{0,20}/i);
        return m ? m[0] : '(no confirmation text)';
      });
      log('REQUESTED -> ' + dlg);
      break;
    }
  }
  log('status: ' + JSON.stringify(line));
  await p.screenshot({ path: OUT + '/gsc-inspect-pembagi.png' });
  b.disconnect();
})();
