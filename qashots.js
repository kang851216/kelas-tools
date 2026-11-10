const puppeteer=require('puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const B='https://kang851216.github.io/kelas-tools/';
(async()=>{
 const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox','--hide-scrollbars']});
 const jobs=[
  ['ice-breaking-kelas-4-sd.html',1200,900,'tests/qa-new-kelas4-desktop.png','full'],
  ['ice-breaking-kelas-4-sd.html',390,844,'tests/qa-new-kelas4-mobile.png','full'],
  ['cara-mengundi-siswa.html',390,844,'tests/qa-figure-mobile.png','figure'],
 ];
 for (const [slug,w,h,out,mode] of jobs){
  const p=await b.newPage();
  await p.setViewport({width:w,height:h,isMobile:w<600,hasTouch:w<600});
  await p.goto(B+slug+'?v='+Date.now(),{waitUntil:'networkidle2'});
  await sleep(2500);
  if (mode==='full'){ await p.screenshot({path:out,fullPage:true}); }
  else { const r=await p.evaluate(()=>{const f=document.querySelector('figure');f.scrollIntoView({block:'center'});const b=f.getBoundingClientRect();return{x:Math.max(0,b.left-6),y:Math.max(0,b.top-6),width:Math.min(b.width+12,window.innerWidth),height:b.height+12};}); await sleep(600); await p.screenshot({path:out,clip:r}); }
  const info=await p.evaluate(()=>{
    const f=document.querySelector('figure'), im=f&&f.querySelector('img');
    const fr=document.querySelector('.embedwrap iframe');
    return {imgLoaded: im? (im.complete && im.naturalWidth>0):null, imgW: im?im.naturalWidth:0,
            iframeH: fr? Math.round(fr.getBoundingClientRect().height):0,
            overflow: document.documentElement.scrollWidth>window.innerWidth, sw:document.documentElement.scrollWidth};
  });
  console.log(slug, w, JSON.stringify(info));
  await p.close();
 }
 await b.close();
})();
