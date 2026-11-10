// Connect to the automation Chrome (port 9333) and inspect the Search Console
// sitemap page state before touching anything.
const puppeteer = require('puppeteer-core');

const OUT = 'C:/HermesProject/kelas_tools/tests';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9333', defaultViewport: null });
  const pages = await b.pages();
  const p = pages.find((x) => /search\.google\.com/.test(x.url())) || pages[0];
  p.setDefaultTimeout(60000);

  await p.goto('https://search.google.com/search-console', { waitUntil: 'networkidle2' });
  await sleep(3500);
  const state = await p.evaluate(() => {
    const t = document.body.innerText || '';
    const links = [...document.querySelectorAll('a')]
      .map((a) => a.href).filter((h) => h.includes('resource_id='));
    const ids = [...new Set(links.map((h) => decodeURIComponent(h.split('resource_id=')[1].split('&')[0])))];
    return {
      url: location.href,
      signedIn: !/Start now|Sign in/i.test(t.slice(0, 300)),
      ids: ids.slice(0, 8),
      head: t.slice(0, 200).replace(/\n+/g, ' | '),
    };
  });
  console.log('STATE ' + JSON.stringify(state));

  const prop = (state.ids || []).find((i) => /kang851216/.test(i));
  if (!prop) { console.log('NO_PROPERTY'); await p.screenshot({ path: OUT + '/gsc-home.png' }); b.disconnect(); return; }
  console.log('PROPERTY ' + prop);

  const res = encodeURIComponent(prop);
  await p.goto(`https://search.google.com/search-console/sitemaps?resource_id=${res}`, { waitUntil: 'networkidle2' });
  await sleep(4000);
  const page = await p.evaluate(() => {
    const inputs = [...document.querySelectorAll('input')].map((i) => ({
      type: i.type, ph: i.placeholder || '', aria: i.getAttribute('aria-label') || '', val: i.value || '' }));
    const buttons = [...document.querySelectorAll('button,[role="button"]')]
      .map((x) => (x.innerText || x.getAttribute('aria-label') || '').trim())
      .filter(Boolean).slice(0, 25);
    return { text: (document.body.innerText || '').slice(0, 700).replace(/\s+/g, ' '), inputs, buttons };
  });
  console.log('PAGE ' + JSON.stringify(page).slice(0, 1500));
  await p.screenshot({ path: OUT + '/gsc-sitemaps-before.png' });
  console.log('SHOT gsc-sitemaps-before.png');
  b.disconnect();
})();
