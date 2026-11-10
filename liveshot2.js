const puppeteer=require('puppeteer-core');
const args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
 '--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows'];
(async()=>{
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args});
const URL='https://kang851216.github.io/kelas-tools/roulette.html';
for (const [tag,w,h,dpr] of [['desktop',1000,1150,2],['mobile',390,844,3]]) {
  const p=await b.newPage(); await p.setViewport({width:w,height:h,deviceScaleFactor:dpr});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL,{waitUntil:'networkidle2'});
  await p.evaluate(()=>{const t=document.getElementById('names');
    t.value='Ayu\nBudi\nCitra\nDewi\nEko\nFajar\nGita\nHadi';t.dispatchEvent(new Event('input',{bubbles:true}));});
  await p.waitForFunction(()=>document.body.classList.contains('gl-on'),{timeout:20000}).catch(()=>{});
  await new Promise(r=>setTimeout(r,900));
  await (await p.$('.wheelbox')).screenshot({path:`tests/live2-${tag}-wheel.png`});
  await p.evaluate(()=>document.getElementById('spin').click());
  await p.waitForFunction(()=>document.getElementById('winner').textContent.trim()!=='',{timeout:20000});
  await new Promise(r=>setTimeout(r,500));
  await (await p.$('.wheelbox')).screenshot({path:`tests/live2-${tag}-win.png`});
  await p.screenshot({path:`tests/live2-${tag}-page.png`});
  console.log(tag, JSON.stringify({winner:await p.$eval('#winner',e=>e.textContent.trim()),
    glOn:await p.evaluate(()=>document.body.classList.contains('gl-on')),
    scrollW:await p.evaluate(()=>document.documentElement.scrollWidth),
    innerW:await p.evaluate(()=>window.innerWidth), errors:errs}));
  await p.close();
}
await b.close();})();
