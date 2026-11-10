// Verify the two things the first pass could not pin down:
//   1) how many of our pages Google lists for a site: query
//   2) whether the one "hit" on a keyword query is a real organic result or a footer link
const puppeteer = require('puppeteer-core');

const PROFILE = 'C:/HermesProject/kelas_tools/.gsc_profile';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = 'C:/HermesProject/kelas_tools/tests';
const HOST = 'kang851216.github.io';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(p, q) {
  await p.goto('https://www.google.com/search?hl=id&gl=id&num=30&pws=0&q=' + encodeURIComponent(q),
    { waitUntil: 'domcontentloaded', timeout: 45000 });
  await sleep(2500);
}

async function readOrganic(p) {
  return p.evaluate((host) => {
    const rso = document.querySelector('#rso') || document.body;
    const blocks = [...rso.querySelectorAll('div[data-hveid]')].filter((d) => d.querySelector('a[href^="http"], a[href^="/url?q="]'));
    const items = [];
    const seen = new Set();
    for (const b of blocks) {
      const a = b.querySelector('a[href^="http"], a[href^="/url?q="]');
      if (!a) continue;
      let h = a.getAttribute('href') || '';
      const m = h.match(/^\/url\?q=(https?:\/\/[^&]+)/);
      if (m) h = decodeURIComponent(m[1]);
      if (!/^https?:\/\//.test(h) || /google\./.test(h)) continue;
      let hostname = '';
      try { hostname = new URL(h).hostname.replace(/^www\./, ''); } catch (e) { continue; }
      if (seen.has(h)) continue;
      seen.add(h);
      items.push({ pos: items.length + 1, host: hostname, url: h.slice(0, 110) });
    }
    const stats = (document.querySelector('#result-stats') || {}).innerText || '';
    return { stats: (stats || '').replace(/\s+/g, ' ').slice(0, 60), items: items.slice(0, 15) };
  }, HOST);
}

(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, userDataDir: PROFILE, headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--disable-blink-features=AutomationControlled'],
    defaultViewport: { width: 1366, height: 950 },
  });
  const p = (await b.pages())[0];
  p.setDefaultTimeout(45000);

  // 1) site: query
  await open(p, 'site:' + HOST);
  const site = await readOrganic(p);
  const ours = site.items.filter((i) => i.host === HOST);
  console.log('SITE ' + JSON.stringify({ stats: site.stats, organic: site.items.length, ours: ours.length, urls: ours.map((o) => o.pos + ':' + o.url) }));
  await p.screenshot({ path: OUT + '/serp-site.png' });

  // 2) brand + long tail checks
  for (const q of ['KelasTools', 'kelas tools guru', 'timer ujian 30 menit untuk proyektor', 'timer untuk proyektor kelas']) {
    await open(p, q);
    const r = await readOrganic(p);
    const hit = r.items.find((i) => i.host === HOST);
    console.log('Q ' + JSON.stringify({ q, stats: r.stats, organic: r.items.length, oursPos: hit ? hit.pos : 0, top3: r.items.slice(0, 3).map((i) => i.host) }));
    if (/proyektor/.test(q)) await p.screenshot({ path: OUT + '/serp-proyektor.png' });
    await sleep(2000);
  }

  await b.close();
})();
