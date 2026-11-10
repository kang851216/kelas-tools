// Pin down the one keyword where our page appears: real organic block, its title/snippet,
// and a screenshot scrolled to it.
const puppeteer = require('puppeteer-core');

const PROFILE = 'C:/HermesProject/kelas_tools/.gsc_profile';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = 'C:/HermesProject/kelas_tools/tests';
const HOST = 'kang851216.github.io';
const Q = 'timer untuk proyektor kelas';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, userDataDir: PROFILE, headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--disable-blink-features=AutomationControlled'],
    defaultViewport: { width: 1366, height: 900 },
  });
  const p = (await b.pages())[0];
  await p.goto('https://www.google.com/search?hl=id&gl=id&num=30&pws=0&q=' + encodeURIComponent(Q),
    { waitUntil: 'domcontentloaded', timeout: 45000 });
  await sleep(3000);

  const info = await p.evaluate((host) => {
    const rso = document.querySelector('#rso');
    if (!rso) return { error: 'no #rso' };
    const blocks = [...rso.querySelectorAll('div[data-hveid]')]
      .filter((d) => d.querySelector('a[href^="http"], a[href^="/url?q="]'));
    const uniq = [];
    for (const bl of blocks) {
      const a = bl.querySelector('a[href^="http"], a[href^="/url?q="]');
      let h = a.getAttribute('href') || '';
      const m = h.match(/^\/url\?q=(https?:\/\/[^&]+)/);
      if (m) h = decodeURIComponent(m[1]);
      if (!/^https?:\/\//.test(h) || /google\./.test(h)) continue;
      if (uniq.some((u) => u.href === h)) continue;
      uniq.push({ href: h, block: bl });
    }
    const idx = uniq.findIndex((u) => {
      try { return new URL(u.href).hostname.replace(/^www\./, '') === host; } catch (e) { return false; }
    });
    if (idx < 0) return { found: false, organic: uniq.length };
    const el = uniq[idx].block;
    el.scrollIntoView({ block: 'center' });
    return {
      found: true, pos: idx + 1, organic: uniq.length, href: uniq[idx].href,
      text: (el.innerText || '').replace(/\s+/g, ' ').slice(0, 260),
    };
  }, HOST);

  console.log('DETAIL ' + JSON.stringify(info));
  await sleep(1200);
  await p.screenshot({ path: OUT + '/serp-our-result.png' });
  await b.close();
})();
