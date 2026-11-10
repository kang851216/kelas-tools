const puppeteer=require('puppeteer-core');
(async()=>{
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox','--hide-scrollbars']});
const p=await b.newPage(); await p.setViewport({width:356,height:700,deviceScaleFactor:1});
await p.goto('https://kang851216.github.io/kelas-tools/roulette.html?embed=1',{waitUntil:'networkidle2'});
await new Promise(r=>setTimeout(r,1800));
console.log(JSON.stringify(await p.evaluate(()=>{
  const h=document.documentElement.scrollHeight;
  const parts=[...document.querySelectorAll('main > *')].map(e=>({t:e.tagName.toLowerCase(),c:(e.className||'').toString().slice(0,20),h:Math.round(e.getBoundingClientRect().height)}));
  return {h,parts};
})));
await b.close();})();
