// Live Google SERP test, run through the signed-in automation profile.
// Reports, per keyword: result count, whether our host appears (and at what position),
// and the domains that actually rank.
const puppeteer = require('puppeteer-core');

const PROFILE = 'C:/HermesProject/kelas_tools/.gsc_profile';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = 'C:/HermesProject/kelas_tools/tests';
const HOST = 'kang851216.github.io';

const KEYWORDS = [
  'roda putar nama',
  'roda nama acak',
  'cara mengundi siswa di kelas',
  'timer ujian 30 menit',
  'pembagi kelompok 4 orang',
  'roda nama offline',
  'ide ice breaking kelas',
  'timer untuk proyektor kelas',
  'aplikasi pembagi kelompok gratis',
  'cara membagi kelompok belajar siswa',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function handleConsent(p) {
  const clicked = await p.evaluate(() => {
    const b = [...document.querySelectorAll('button, div[role="button"]')]
      .find((e) => /accept all|setuju|saya setuju|agree/i.test(e.innerText || ''));
    if (b) { b.click(); return true; }
    return false;
  }).catch(() => false);
  if (clicked) await sleep(2500);
  return clicked;
}

async function search(p, q) {
  await p.goto('https://www.google.com/search?hl=id&gl=id&num=20&pws=0&q=' + encodeURIComponent(q),
    { waitUntil: 'domcontentloaded', timeout: 45000 });
  await sleep(2200);
  await handleConsent(p);

  const data = await p.evaluate((host) => {
    const body = (document.body.innerText || '');
    const blocked = /unusual traffic|sistem kami mendeteksi|recaptcha|not a robot/i.test(body);
    const none = /did not match any documents|tidak cocok dengan dokumen/i.test(body);
    const stats = (body.match(/(Sekitar |About )?[\d.,]+ (hasil|results)/i) || [''])[0];
    const anchors = [...document.querySelectorAll('a[href]')];
    const out = [];
    const seen = new Set();
    for (const a of anchors) {
      let h = a.getAttribute('href') || '';
      const m = h.match(/^\/url\?q=(https?:\/\/[^&]+)/);
      if (m) h = decodeURIComponent(m[1]);
      if (!/^https?:\/\//.test(h)) continue;
      if (/google\.|gstatic|googleusercontent|schema\.org|youtube\.com\/redirect/.test(h)) continue;
      let host2 = '';
      try { host2 = new URL(h).hostname.replace(/^www\./, ''); } catch (e) { continue; }
      if (seen.has(host2 + h)) continue;
      seen.add(host2 + h);
      out.push({ host: host2, url: h, ours: host2 === host });
    }
    const domains = [];
    for (const o of out) if (!domains.includes(o.host)) domains.push(o.host);
    const ourIdx = out.findIndex((o) => o.ours);
    return { blocked, none, stats, domains: domains.slice(0, 8), ourPos: ourIdx + 1, total: out.length };
  }, HOST);

  return data;
}

(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME,
    userDataDir: PROFILE,
    headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--disable-blink-features=AutomationControlled'],
    defaultViewport: { width: 1366, height: 900 },
  });
  const p = (await b.pages())[0];
  p.setDefaultTimeout(45000);

  const rows = [];
  for (const q of KEYWORDS) {
    let r;
    try {
      r = await search(p, q);
    } catch (e) {
      r = { error: e.message.slice(0, 60) };
    }
    rows.push({ q, ...r });
    console.log(JSON.stringify({ q, ...r }));
    await sleep(2500);
  }

  try {
    await p.goto('https://www.google.com/search?hl=id&gl=id&num=20&pws=0&q=' +
      encodeURIComponent('site:kang851216.github.io'), { waitUntil: 'domcontentloaded' });
    await sleep(2500);
    const site = await p.evaluate(() => {
      const t = document.body.innerText || '';
      return {
        noResults: /did not match any documents|tidak cocok dengan dokumen/i.test(t),
        stats: (t.match(/(Sekitar |About )?[\d.,]+ (hasil|results)/i) || [''])[0],
        hasHost: /kang851216/.test(t),
      };
    });
    console.log('SITE_QUERY ' + JSON.stringify(site));
    await p.screenshot({ path: OUT + '/serp-site-query.png' });
  } catch (e) {
    console.log('SITE_QUERY error ' + e.message.slice(0, 60));
  }

  await b.close();
  const hits = rows.filter((r) => r.ourPos > 0).length;
  console.log('SUMMARY ' + JSON.stringify({ keywords: rows.length, ranked: hits,
    blocked: rows.filter((r) => r.blocked).length }));
})();
