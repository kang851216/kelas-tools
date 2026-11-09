const puppeteer=require('puppeteer-core');
(async()=>{const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox']});
const p=await b.newPage();await p.setViewport({width:390,height:844,deviceScaleFactor:1});
await p.goto('http://127.0.0.1:8765/roulette.html',{waitUntil:'networkidle2'});
const r=await p.evaluate(()=>{const w=window.innerWidth;const bad=[];document.querySelectorAll('*').forEach(e=>{const b=e.getBoundingClientRect();if(b.right>w+0.5||b.left<-0.5){bad.push(e.tagName+'.'+e.className+' L'+Math.round(b.left)+' R'+Math.round(b.right)+' W'+Math.round(b.width));}});return {w,scrollW:document.documentElement.scrollWidth,bad:bad.slice(0,12)};});
console.log(JSON.stringify(r,null,1));await b.close();})();
