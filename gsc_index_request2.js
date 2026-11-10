// Ask Google to crawl the three queued URLs. Uses the real UI path (paste URL into the
// inspection box) because the /inspect?resource_id=...&id=... deep link 404s.
const puppeteer = require('puppeteer-core');

const OUT = 'C:/HermesProject/kelas_tools/tests';
const PROP = 'https://kang851216.github.io/kelas-tools/';
const BASE = 'https://kang851216.github.io/kelas-tools';
const URLS = ['/cara-mengundi-siswa.html', '/timer-ujian-30-menit.html', '/pembagi-kelompok-4-orang.html'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

async function inspectUrl(p, url) {
  await p.goto(`https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(PROP)}`,
    { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(4000);

  const inputSel = 'input[aria-label^="Inspect any URL"], input[aria-label*="Inspect any URL"]';
  await p.waitForSelector(inputSel, { timeout: 30000 });
  await p.click(inputSel, { clickCount: 3 });
  await p.keyboard.press('Backspace');
  await p.keyboard.type(url, { delay: 12 });
  await sleep(800);
  await p.keyboard.press('Enter');
  log('  typed ' + url);

  // wait for the result panel
  let line = '';
  for (let i = 0; i < 14; i++) {
    await sleep(2500);
    const s = await p.evaluate(() => {
      const t = document.body.innerText || '';
      const btn = [...document.querySelectorAll('button,[role="button"]')]
        .find((e) => /request indexing|minta pengindeksan/i.test(e.innerText || ''));
      const m = t.match(/URL is on Google|URL is not on Google|Page is indexed|Page is not indexed|Discovered[^\n]{0,30}|Crawled[^\n]{0,30}/);
      return { hasBtn: !!btn, line: m ? m[0] : '', head: t.slice(0, 160).replace(/\n+/g, ' | ') };
    }).catch(() => ({ hasBtn: false, line: '', head: 'evaluate failed' }));
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
        const m = t.match(/Indexing requested[^\n]{0,40}|Testing if live URL[^\n]{0,30}|Permintaan pengindeksan[^\n]{0,30}/i);
        return m ? m[0] : '(no confirmation text)';
      });
      log('  REQUESTED -> ' + dlg);
      return line || 'requested';
    }
    if (i === 13) log('  no button; page: ' + JSON.stringify(s.head));
  }
  return line || 'unknown';
}

(async () => {
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9333', defaultViewport: null });
  const pages = await b.pages();
  const p = pages.find((x) => /search\.google\.com/.test(x.url())) || pages[0];
  p.setDefaultTimeout(60000);

  for (const path of URLS) {
    log('INSPECT ' + path);
    const st = await inspectUrl(p, BASE + path);
    log('  status: ' + JSON.stringify(st));
    await p.screenshot({ path: OUT + '/gsc-inspect-' + path.replace(/[^a-z0-9]+/gi, '-') + '.png' });
    await sleep(4000);
  }
  b.disconnect();
})();
