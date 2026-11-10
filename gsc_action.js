// Remove the stale sitemap entry, resubmit it, then read back the status row.
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

  await p.goto(`https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(PROP)}`,
    { waitUntil: 'networkidle2' });
  await sleep(4000);

  // 1) open the row actions menu for /sitemap.xml
  const opened = await p.evaluate(() => {
    const rows = [...document.querySelectorAll('tr, [role="row"]')];
    const row = rows.find((r) => /sitemap\.xml/.test(r.innerText || ''));
    if (!row) return 'no-row';
    const btn = row.querySelector('button,[role="button"],[aria-haspopup]');
    if (!btn) return 'no-button';
    btn.click();
    return (btn.getAttribute('aria-label') || btn.innerText || 'clicked').trim().slice(0, 40);
  });
  log('MENU', opened);
  await sleep(2000);

  // 2) click "Remove sitemap"
  const removed = await p.evaluate(() => {
    const item = [...document.querySelectorAll('[role="menuitem"],li,button')]
      .find((e) => /remove sitemap|hapus sitemap/i.test(e.innerText || ''));
    if (!item) return 'no-item';
    item.click();
    return 'clicked';
  });
  log('REMOVE_ITEM', removed);
  await sleep(2500);

  // 3) confirm the dialog
  const confirmed = await p.evaluate(() => {
    const btn = [...document.querySelectorAll('button,[role="button"]')]
      .filter((e) => /^(remove|hapus|delete)$/i.test((e.innerText || '').trim()))
      .pop();
    if (!btn) return 'no-confirm';
    btn.click();
    return 'confirmed';
  });
  log('CONFIRM', confirmed);
  await sleep(4000);
  await p.screenshot({ path: OUT + '/gsc-after-remove.png' });

  // 4) resubmit
  const submitted = await p.evaluate(() => {
    const input = [...document.querySelectorAll('input')]
      .find((i) => /enter sitemap url/i.test(i.getAttribute('aria-label') || i.placeholder || ''));
    if (!input) return 'no-input';
    input.focus();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'sitemap.xml');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return 'filled';
  });
  log('FILL', submitted);
  await sleep(1200);

  const clicked = await p.evaluate(() => {
    const btn = [...document.querySelectorAll('button,[role="button"]')]
      .find((e) => /^\s*(submit|kirim)\s*$/i.test(e.innerText || ''));
    if (!btn) return 'no-submit-button';
    btn.click();
    return 'submitted';
  });
  log('SUBMIT', clicked);
  await sleep(7000);
  await p.screenshot({ path: OUT + '/gsc-after-submit.png' });

  const table = await p.evaluate(() => {
    const t = document.body.innerText || '';
    const i = t.indexOf('Submitted sitemaps');
    return i > -1 ? t.slice(i, i + 400).replace(/\s+/g, ' ') : t.slice(0, 300).replace(/\s+/g, ' ');
  });
  log('TABLE ' + JSON.stringify(table));
  b.disconnect();
})();
