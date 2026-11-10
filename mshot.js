const puppeteer=require('puppeteer-core');
(async()=>{
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',
 args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars',
 '--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const p=await b.newPage();
await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.goto('https://kang851216.github.io/kelas-tools/ide-ice-breaking-kelas.html',{waitUntil:'networkidle2'});
await new Promise(r=>setTimeout(r,2500));
await p.screenshot({path:'tests/land-live-mobile.png',fullPage:true});
const h=await p.evaluate(()=>({scrollW:document.documentElement.scrollWidth,frames:[...document.querySelectorAll('.embedwrap iframe')].map(f=>Math.round(f.getBoundingClientRect().width)+'x'+Math.round(f.getBoundingClientRect().height))}));
console.log(JSON.stringify(h));
await b.close();})();
