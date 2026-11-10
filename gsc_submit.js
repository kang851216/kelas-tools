// GSC sitemap resubmit + index requests, driven through the user's own signed-in Chrome.
//
// Requires Chrome to be fully closed: it launches the real profile (cookies are
// App-Bound-Encrypted since Chrome 127, so a copied profile cannot be used).
// Usage: node gsc_submit.js [--dry]
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROFILE = 'C:/Users/paul/AppData/Local/Google/Chrome/User Data';
const OUT = 'C:/HermesProject/kelas_tools/tests';
const SITE = 'kang851216.github.io';
const QUEUE = [
  '/cara-mengundi-siswa.html',
  '/timer-ujian-30-menit.html',
  '/pembagi-kelompok-4-orang.html',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

async function shot(p, name) {
  fs.mkdirSync(OUT, { recursive: true });
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  log('shot', name);
}

(async () => {
  const dry = process.argv.includes('--dry');
  const b = await puppeteer.launch({
    executablePath: CHROME,
    userDataDir: PROFILE,
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--start-maximized', '--disable-blink-features=AutomationControlled'],
  });
  const p = (await b.pages())[0];
  p.setDefaultTimeout(45000);

  // 1) signed in?
  await p.goto('https://search.google.com/search-console', { waitUntil: 'networkidle2' });
  await sleep(3000);
  const state = await p.evaluate(() => {
    const t = document.body.innerText || '';
    return {
      url: location.href,
      signedIn: !/Start now|Sign in/i.test(t.slice(0, 400)),
      properties: [...new Set((t.match(/kang851216[^\s]*/g) || []))].slice(0, 6),
      head: t.slice(0, 200).replace(/\n+/g, ' | '),
    };
  });
  log('STATE ' + JSON.stringify(state));
  if (!state.signedIn) {
    await shot(p, 'gsc-not-signed-in');
    log('NOT_SIGNED_IN');
    await b.close();
    return;
  }

  const resource = encodeURIComponent(`https://${SITE}/`);
  const sitemaps = `https://search.google.com/search-console/sitemaps?resource_id=${resource}`;
  await p.goto(sitemaps, { waitUntil: 'networkidle2' });
  await sleep(3500);
  await shot(p, 'gsc-sitemaps-before');

  // 2) remove the stale entry, then submit a fresh one
  const removed = await p.evaluate(() => {
    const btn = [...document.querySelectorAll('button,[role="button"],span[role="button"]')]
      .find((e) => /remove sitemap|hapus sitemap|delete/i.test(e.getAttribute('aria-label') || ''));
    if (btn) { btn.click(); return true; }
    return false;
  });
  log('REMOVE_BUTTON_CLICKED', removed);
  await sleep(1500);
  if (removed) {
    await p.evaluate(() => {
      const ok = [...document.querySelectorAll('button,[role="button"]')]
        .find((e) => /remove|hapus|delete/i.test(e.innerText || ''));
      if (ok) ok.click();
    });
    await sleep(2500);
    await shot(p, 'gsc-sitemaps-removed');
  }

  if (dry) { log('DRY_STOP'); await b.close(); return; }

  // 3) submit sitemap.xml
  const submitted = await p.evaluate(() => {
    const input = [...document.querySelectorAll('input')]
      .find((i) => /sitemap/i.test(i.placeholder || '') || i.type === 'text');
    if (!input) return 'no-input';
    input.focus();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'sitemap.xml');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const btn = [...document.querySelectorAll('button')]
      .find((e) => /submit|kirim|add sitemap|tambahkan/i.test(e.innerText || ''));
    if (!btn) return 'no-button';
    btn.click();
    return 'clicked';
  });
  log('SUBMIT', submitted);
  await sleep(6000);
  await shot(p, 'gsc-sitemaps-after');
  const after = await p.evaluate(() => (document.body.innerText || '').slice(0, 1200));
  log('AFTER_TEXT ' + JSON.stringify(after.replace(/\s+/g, ' ').slice(0, 500)));

  // 4) request indexing for the queued URLs (best effort, 3/day)
  for (const path of QUEUE) {
    const url = encodeURIComponent(`https://${SITE}/kelas-tools${path}`);
    await p.goto(`https://search.google.com/search-console/inspect?resource_id=${resource}&id=${url}`, { waitUntil: 'networkidle2' });
    await sleep(5000);
    const clicked = await p.evaluate(() => {
      const btn = [...document.querySelectorAll('button,[role="button"]')]
        .find((e) => /request indexing|minta pengindeksan|test live url/i.test(e.innerText || ''));
      if (btn) { btn.click(); return btn.innerText.trim().slice(0, 40); }
      return 'no-button';
    });
    log('INSPECT', path, clicked);
    await sleep(4000);
    await shot(p, 'gsc-inspect-' + path.replace(/[^a-z0-9]+/gi, '-'));
  }

  await b.close();
})();
