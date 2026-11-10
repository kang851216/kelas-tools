const puppeteer=require('puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox','--hide-scrollbars']});
 const p=await b.newPage(); await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
 await p.goto('https://kang851216.github.io/kelas-tools/ice-breaking-kelas-4-sd.html?v='+Date.now(),{waitUntil:'networkidle2'});
 await p.evaluate(()=>{const f=document.querySelector('figure'); f.scrollIntoView({block:'center'});});
 await sleep(2500);
 const r=await p.evaluate(()=>{const im=document.querySelector('figure img');const b=im.getBoundingClientRect();
   return {loaded: im.complete&&im.naturalWidth>0, nw:im.naturalWidth, nh:im.naturalHeight, box:{w:Math.round(b.width),h:Math.round(b.height)}};});
 console.log(JSON.stringify(r));
 await p.screenshot({path:'tests/qa-kelas4-figure.png',clip:await p.evaluate(()=>{const f=document.querySelector('figure');const b=f.getBoundingClientRect();return{x:0,y:Math.max(0,b.top-8),width:390,height:Math.min(b.height+40,700)};})});
 await b.close();
})();
