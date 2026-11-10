// One-shot: is the automation profile still signed in after being moved?
const puppeteer = require('puppeteer-core');

(async () => {
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    userDataDir: 'C:/HermesProject/kelas_tools/.gsc_profile',
    headless: 'new',
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });
  const p = (await b.pages())[0];
  await p.goto('https://search.google.com/search-console', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 6000));
  const s = await p.evaluate(() => {
    const t = document.body.innerText || '';
    return { signedIn: !/Sign in|Start now/i.test(t.slice(0, 300)), head: t.slice(0, 90).replace(/\n+/g, ' | ') };
  });
  console.log('MOVE_CHECK ' + JSON.stringify(s));
  await b.close();
})();
