const puppeteer=require('puppeteer-core');
(async()=>{
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',
 args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage(); await p.setViewport({width:1000,height:1150,deviceScaleFactor:2});
await p.goto('https://kang851216.github.io/kelas-tools/roulette.html',{waitUntil:'networkidle2'});
await p.evaluate(()=>{const t=document.getElementById('names');
 t.value='Ayu\nBudi\nCitra\nDewi\nEko\nFajar\nGita\nHadi';t.dispatchEvent(new Event('input',{bubbles:true}));});
await p.waitForFunction(()=>document.body.classList.contains('gl-on'),{timeout:20000}).catch(()=>{});
await new Promise(r=>setTimeout(r,1000));
await (await p.$('.wheelbox')).screenshot({path:'tests/live-3d-wheel.png'});
await p.evaluate(()=>document.getElementById('spin').click());
await p.waitForFunction(()=>document.getElementById('winner').textContent.trim()!=='',{timeout:20000}).catch(()=>{});
await new Promise(r=>setTimeout(r,900));
await p.screenshot({path:'tests/live-3d-page.png'});
console.log('winner', await p.$eval('#winner',e=>e.textContent));
await b.close();})();
