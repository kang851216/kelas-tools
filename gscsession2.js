// Does a full copy of the Chrome profile keep the Google session alive?
const puppeteer = require('puppeteer-core');

const DIR = process.argv[2] || 'C:/Users/paul/AppData/Local/hermes/cache/scratch/chrome-full';

(async () => {
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    userDataDir: DIR,
    headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--disable-blink-features=AutomationControlled'],
  });
  const p = await b.newPage();
  try {
    await p.goto('https://accounts.google.com/', { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 2500));
    const a = await p.evaluate(() => {
      const t = document.body.innerText || '';
      return { url: location.href.slice(0, 70), signIn: /Sign in|Masuk|로그인/i.test(t), head: t.slice(0, 100).replace(/\n+/g, ' | ') };
    });
    console.log('ACCT ' + JSON.stringify(a));
    await p.goto('https://search.google.com/search-console', { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 3000));
    const g = await p.evaluate(() => {
      const t = document.body.innerText || '';
      return { url: location.href.slice(0, 70), signedIn: !/Start now|Sign in/i.test(t.slice(0, 400)), props: (t.match(/kang851216[^\s]*/g) || []).slice(0, 4), head: t.slice(0, 140).replace(/\n+/g, ' | ') };
    });
    console.log('GSC ' + JSON.stringify(g));
  } catch (e) {
    console.log('ERR ' + e.message.slice(0, 120));
  }
  await b.close();
})();
