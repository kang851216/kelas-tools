const puppeteer=require('puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const B='https://kang851216.github.io/kelas-tools/';
(async()=>{
 const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox','--hide-scrollbars']});
 for (const [slug,out] of [['ice-breaking-kelas-4-sd.html','tests/qa-kelas4-full-mobile.png'],['roda-nama-arisan.html','tests/qa-arisan-full-desktop.png']]){
  const mob = out.includes('mobile');
  const p=await b.newPage();
  await p.setViewport({width:mob?390:1200,height:mob?844:900,isMobile:mob,hasTouch:mob});
  await p.goto(B+slug+'?v='+Date.now(),{waitUntil:'networkidle2'});
  await sleep(1200);
  // force lazy images to load by walking the page
  await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}window.scrollTo(0,0);});
  await sleep(1500);
  const info=await p.evaluate(()=>{
    const im=[...document.querySelectorAll('figure img')].map(i=>({ok:i.complete&&i.naturalWidth>0,nw:i.naturalWidth}));
    return {imgs:im, h:document.body.scrollHeight};
  });
  await p.screenshot({path:out,fullPage:true});
  console.log(slug, JSON.stringify(info));
  await p.close();
 }
 await b.close();
})();
