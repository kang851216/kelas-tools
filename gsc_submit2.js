// Resubmit sitemap.xml from a fresh page load, then read the toast + table.
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
  await sleep(5000);

  // remember the row before submitting
  const before = await p.evaluate(() => {
    const t = document.body.innerText || '';
    const i = t.indexOf('Submitted sitemaps');
    return i > -1 ? t.slice(i, i + 220).replace(/\s+/g, ' ') : '';
  });
  log('BEFORE ' + JSON.stringify(before));

  // fill the sitemap input
  const filled = await p.evaluate(() => {
    const input = [...document.querySelectorAll('input')]
      .find((i) => /enter sitemap url/i.test(i.getAttribute('aria-label') || ''));
    if (!input) return 'no-input';
    input.scrollIntoView({ block: 'center' });
    input.click();
    input.focus();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'sitemap.xml');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'l' }));
    return { value: input.value, visible: input.offsetParent !== null };
  });
  log('FILL ' + JSON.stringify(filled));
  await sleep(1500);

  // submit: try the button first, then Enter as a fallback
  const btn = await p.evaluate(() => {
    const b = [...document.querySelectorAll('button,[role="button"]')]
      .find((e) => /^\s*(submit|kirim)\s*$/i.test(e.innerText || ''));
    if (!b) return 'none';
    const dis = b.disabled || b.getAttribute('aria-disabled') === 'true';
    b.click();
    return dis ? 'clicked-but-disabled' : 'clicked';
  });
  log('BUTTON ' + btn);
  await sleep(2500);

  const toast = await p.evaluate(() => {
    const t = [...document.querySelectorAll('[role="alert"],[aria-live],[role="status"],.VfPpkd-fmcmS-wGMbrd')]
      .map((e) => (e.innerText || '').trim()).filter(Boolean).join(' || ');
    return t.slice(0, 300) || '(no toast)';
  });
  log('TOAST ' + JSON.stringify(toast));
  await p.screenshot({ path: OUT + '/gsc-submit-toast.png' });

  if (btn === 'none') {
    const typed = await p.evaluate(() => {
      const input = [...document.querySelectorAll('input')]
        .find((i) => /enter sitemap url/i.test(i.getAttribute('aria-label') || ''));
      if (!input) return 'no-input';
      input.focus();
      input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'Enter', keyCode: 13 }));
      input.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: 'Enter', code: 'Enter', keyCode: 13 }));
      input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter', code: 'Enter', keyCode: 13 }));
      return 'enter-sent';
    });
    log('ENTER ' + typed);
    await sleep(3000);
  }

  await sleep(5000);
  await p.reload({ waitUntil: 'networkidle2' });
  await sleep(5000);
  const after = await p.evaluate(() => {
    const t = document.body.innerText || '';
    const i = t.indexOf('Submitted sitemaps');
    return i > -1 ? t.slice(i, i + 300).replace(/\s+/g, ' ') : '';
  });
  log('AFTER ' + JSON.stringify(after));
  await p.screenshot({ path: OUT + '/gsc-after-submit2.png' });
  b.disconnect();
})();
