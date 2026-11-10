// Ask Google to re-crawl the three queued URLs via URL inspection.
const puppeteer = require('puppeteer-core');

const OUT = 'C:/HermesProject/kelas_tools/tests';
const PROP = 'https://kang851216.github.io/kelas-tools/';
const BASE = 'https://kang851216.github.io/kelas-tools';
const URLS = [
  '/cara-mengundi-siswa.html',
  '/timer-ujian-30-menit.html',
  '/pembagi-kelompok-4-orang.html',
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

async function requestOne(p, path) {
  const target = encodeURIComponent(BASE + path);
  await p.goto(`https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(PROP)}&id=${target}`,
    { waitUntil: 'networkidle2', timeout: 60000 });

  // the panel renders asynchronously; poll for the request button
  let status = '';
  for (let i = 0; i < 12; i++) {
    await sleep(2500);
    const s = await p.evaluate(() => {
      const t = document.body.innerText || '';
      const btn = [...document.querySelectorAll('button,[role="button"]')]
        .find((e) => /request indexing|minta pengindeksan/i.test(e.innerText || ''));
      const line = (t.match(/(URL is on Google|URL is not on Google|Page is indexed|Discovered[^\n]{0,40}|Crawled[^\n]{0,40})/) || [''])[0];
      return { hasBtn: !!btn, btnText: btn ? btn.innerText.trim().slice(0, 30) : '', line, head: t.slice(0, 120).replace(/\n+/g, ' | ') };
    }).catch(() => ({ hasBtn: false }));
    status = s.line || status;
    if (s.hasBtn) {
      await p.evaluate(() => {
        const btn = [...document.querySelectorAll('button,[role="button"]')]
          .find((e) => /request indexing|minta pengindeksan/i.test(e.innerText || ''));
        btn.scrollIntoView({ block: 'center' });
        btn.click();
      });
      await sleep(4000);
      const dialog = await p.evaluate(() => {
        const t = document.body.innerText || '';
        const m = t.match(/(Indexing requested|Testing if live URL|Permintaan pengindeksan[^\n]{0,30}|GOT IT|MENGERTI)/i);
        return m ? m[0] : '(no dialog text)';
      });
      log('  clicked -> ' + dialog);
      break;
    }
    if (i === 11) log('  button never appeared; page said: ' + JSON.stringify(s.head));
  }
  await p.screenshot({ path: OUT + '/gsc-inspect-' + path.replace(/[^a-z0-9]+/gi, '-') + '.png' });
  return status;
}

(async () => {
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9333', defaultViewport: null });
  const pages = await b.pages();
  const p = pages.find((x) => /search\.google\.com/.test(x.url())) || pages[0];
  p.setDefaultTimeout(60000);

  for (const path of URLS) {
    log('INSPECT ' + path);
    const status = await requestOne(p, path);
    log('  status: ' + JSON.stringify(status));
    await sleep(3000);
  }
  b.disconnect();
})();
