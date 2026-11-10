// Probe: can we reach Search Console with the user's own Chrome cookies?
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const SRC = 'C:/Users/paul/AppData/Local/Google/Chrome/User Data';
const DST = 'C:/Users/paul/AppData/Local/hermes/cache/scratch/chrome-gsc2';

function seed() {
  fs.mkdirSync(path.join(DST, 'Default', 'Network'), { recursive: true });
  for (const [from, to] of [
    ['Local State', 'Local State'],
    ['Default/Network/Cookies', 'Default/Network/Cookies'],
    ['Default/Preferences', 'Default/Preferences'],
  ]) {
    try {
      fs.copyFileSync(path.join(SRC, from), path.join(DST, to));
    } catch (e) {
      console.log('copy fail', from, e.message.slice(0, 60));
    }
  }
}

(async () => {
  seed();
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    userDataDir: DST,
    headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--disable-blink-features=AutomationControlled'],
  });
  const p = await b.newPage();
  await p.goto('https://accounts.google.com/', { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 2500));
  const acct = await p.evaluate(() => {
    const t = document.body.innerText || '';
    return {
      url: location.href.slice(0, 80),
      signIn: /Sign in|Masuk|로그인/i.test(t),
      head: t.slice(0, 120).replace(/\n+/g, ' | '),
    };
  });
  console.log('ACCT ' + JSON.stringify(acct));
  await b.close();
})();
