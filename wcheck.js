const puppeteer=require('puppeteer-core');
(async()=>{
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox','--hide-scrollbars']});
const p=await b.newPage(); await p.setViewport({width:390,height:844,deviceScaleFactor:2});
await p.goto('https://kang851216.github.io/kelas-tools/ide-ice-breaking-kelas.html',{waitUntil:'networkidle2'});
await new Promise(r=>setTimeout(r,1500));
const out=await p.evaluate(()=>{
  const vw=document.documentElement.clientWidth;
  const bad=[];
  document.querySelectorAll('*').forEach(el=>{
    const r=el.getBoundingClientRect();
    if(r.width>vw+1||r.right>vw+1){bad.push({tag:el.tagName.toLowerCase(),cls:(el.className||'').toString().slice(0,28),w:Math.round(r.width),right:Math.round(r.right)});}
  });
  return {vw, scrollW:document.documentElement.scrollWidth, bad:bad.slice(0,12)};
});
console.log(JSON.stringify(out,null,1));
await b.close();})();
