const puppeteer=require('puppeteer-core');
(async()=>{
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',
 args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage(); await p.setViewport({width:900,height:1000,deviceScaleFactor:1});
await p.goto('http://127.0.0.1:8765/roulette.html',{waitUntil:'networkidle2'});
await p.evaluate(()=>{const t=document.getElementById('names');t.value='Ayu\nBudi\nCitra\nDewi\nEko\nFajar\nGita\nHadi';t.dispatchEvent(new Event('input',{bubbles:true}));});
await p.waitForFunction(()=>document.body.classList.contains('gl-on'),{timeout:15000}).catch(()=>{});
await new Promise(r=>setTimeout(r,900));
console.log('upDeg', JSON.stringify(await p.evaluate(()=>window.__read())));
await b.close();})();
