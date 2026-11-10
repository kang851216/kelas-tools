const puppeteer=require('puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
  userDataDir:'C:/HermesProject/kelas_tools/.gsc_profile',headless:'new',
  args:['--no-sandbox','--hide-scrollbars','--disable-blink-features=AutomationControlled'],
  defaultViewport:{width:1366,height:1000}});
 const p=(await b.pages())[0];
 await p.goto('https://www.google.com/search?hl=id&gl=id&num=30&pws=0&q='+encodeURIComponent('timer untuk proyektor kelas'),{waitUntil:'domcontentloaded'});
 await sleep(3000);
 const y=await p.evaluate(()=>{
   const a=[...document.querySelectorAll('#rso a[href^="http"],#rso a[href^="/url?q="]')]
     .find(x=>{let h=x.getAttribute('href')||'';const m=h.match(/^\/url\?q=(https?:\/\/[^&]+)/);if(m)h=decodeURIComponent(m[1]);return h.includes('kang851216');});
   if(!a) return -1;
   let el=a; for(let i=0;i<6&&el;i++){ if(el.getAttribute&&el.getAttribute('data-hveid')) break; el=el.parentElement; }
   const box=(el||a).getBoundingClientRect();
   return Math.max(0, box.top+window.scrollY-260);
 });
 console.log('scrollY',y);
 await p.evaluate(v=>window.scrollTo(0,v),y);
 await sleep(2000);
 await p.screenshot({path:'C:/HermesProject/kelas_tools/tests/serp-scrolled.png'});
 await b.close();
})();
