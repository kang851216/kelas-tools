const puppeteer=require('puppeteer-core');
(async()=>{
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox','--hide-scrollbars']});
const p=await b.newPage();
const logs=[]; p.on('console',m=>logs.push(m.text())); p.on('pageerror',e=>logs.push('ERR '+e));
const reqs=[]; p.on('request',r=>{if(/stats|abacus/.test(r.url()))reqs.push(r.url().slice(0,80));});
await p.evaluateOnNewDocument(()=>{Object.defineProperty(navigator,'webdriver',{get:()=>false});});
await p.goto('https://kang851216.github.io/kelas-tools/?ref=probe2',{waitUntil:'networkidle2'});
await new Promise(r=>setTimeout(r,3000));
const inpage=await p.evaluate(async()=>{
  const res=performance.getEntriesByType('resource').filter(e=>/stats\.js|abacus/.test(e.name)).map(e=>e.name.split('/').slice(-2).join('/')+' @'+Math.round(e.responseEnd));
  let manual='n/a';
  try{ await fetch('https://abacus.jasoncameron.dev/hit/kelas-tools-web2/manualtest',{mode:'no-cors',cache:'no-store'}); manual='fetch ok'; }
  catch(e){ manual='fetch fail '+e.message; }
  return {res,manual,host:location.hostname};
});
console.log(JSON.stringify({inpage,reqs:reqs.slice(0,6),logs:logs.slice(0,4)},null,1));
await new Promise(r=>setTimeout(r,4000));
await b.close();})();
