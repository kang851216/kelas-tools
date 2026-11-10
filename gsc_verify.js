// Verify one URL's index status in Search Console and dump the verdict block.
const puppeteer = require('puppeteer-core');

const PROP = 'https://kang851216.github.io/kelas-tools/';
const TARGET = process.argv[2] || 'https://kang851216.github.io/kelas-tools/timer-ujian-30-menit.html';
const PROFILE = 'C:/HermesProject/kelas_tools/.gsc_profile';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    userDataDir: PROFILE, headless: 'new',
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
    defaultViewport: { width: 1400, height: 950 },
  });
  const p = (await b.pages())[0];
  p.setDefaultTimeout(60000);
  await p.goto(`https://search.google.com/search-console?resource_id=${encodeURIComponent(PROP)}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(4000);
  const sel = 'input[aria-label*="Inspect any URL"]';
  await p.waitForSelector(sel, { timeout: 30000 });
  await p.click(sel, { count: 3 });
  await p.keyboard.press('Backspace');
  await p.keyboard.type(TARGET, { delay: 10 });
  await sleep(700);
  await p.keyboard.press('Enter');
  await sleep(11000);
  const r = await p.evaluate(() => {
    const t = document.body.innerText || '';
    const i = t.search(/URL is (not )?on Google/);
    return {
      verdict: i > -1 ? t.slice(i, i + 40).split('\n')[0] : 'unknown',
      block: i > -1 ? t.slice(i, i + 420).replace(/\s+/g, ' ') : t.slice(0, 300).replace(/\s+/g, ' '),
      indexedWord: /Page is indexed/i.test(t),
    };
  });
  console.log('VERDICT ' + JSON.stringify(r));
  await p.screenshot({ path: 'C:/HermesProject/kelas_tools/tests/gsc-verify.png' });
  await b.close();
})();
