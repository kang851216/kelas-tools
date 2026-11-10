const puppeteer=require('puppeteer-core');
(async()=>{
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',
 args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars','--disable-background-timer-throttling']});
const p=await b.newPage(); await p.setViewport({width:900,height:1000});
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('https://kang851216.github.io/kelas-tools/roulette.html',{waitUntil:'load'});
await new Promise(r=>setTimeout(r,1500));
const before=await p.evaluate(()=>({gl:document.body.classList.contains('gl-on'),kb:Math.round(performance.getEntriesByType('resource').filter(e=>/three/.test(e.name)).reduce((s,e)=>s+(e.encodedBodySize||0),0)/1024)}));
// simulate a teacher pasting names
await p.evaluate(()=>{const t=document.querySelector('textarea');t.value='Ayu\nBudi\nCitra\nDimas';t.dispatchEvent(new Event('input',{bubbles:true}));});
await new Promise(r=>setTimeout(r,4000));
const after=await p.evaluate(()=>({gl:document.body.classList.contains('gl-on'),kb:Math.round(performance.getEntriesByType('resource').filter(e=>/three/.test(e.name)).reduce((s,e)=>s+(e.encodedBodySize||0),0)/1024)}));
// spin and see a winner without errors
await p.click('#spin');
await new Promise(r=>setTimeout(r,5600));
const win=await p.evaluate(()=>document.getElementById('winner').textContent.trim());
await p.screenshot({path:'tests/live-3d-after-perf.png'});
console.log(JSON.stringify({before,after,winner:win,errors:errs}));
await b.close();})();
