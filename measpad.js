const puppeteer=require('puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox']});
 const p=await b.newPage(); await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
 await p.goto('https://kang851216.github.io/kelas-tools/ice-breaking-kelas-4-sd.html?v='+Date.now(),{waitUntil:'networkidle2'});
 await sleep(1200);
 const r=await p.evaluate(()=>{
  const main=document.querySelector('main'), nav=document.querySelector('.bottomnav'), body=document.body;
  const cs=getComputedStyle(body);
  return {mainBottom:Math.round(main.getBoundingClientRect().bottom+window.scrollY),
          docH:document.documentElement.scrollHeight,
          bodyPadBottom:cs.paddingBottom, mainPadBottom:getComputedStyle(main).paddingBottom,
          navH:Math.round(nav.getBoundingClientRect().height)};
 });
 // scroll to the very bottom and see if the last paragraph is visible above the nav
 await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
 await sleep(600);
 const vis=await p.evaluate(()=>{const nav=document.querySelector('.bottomnav').getBoundingClientRect();
   const last=document.querySelector('section.related').getBoundingClientRect();
   return {navTop:Math.round(nav.top), lastBottom:Math.round(last.bottom)};});
 console.log(JSON.stringify({...r, ...vis}));
 await b.close();
})();
