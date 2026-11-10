const puppeteer=require('puppeteer-core');
(async()=>{
 const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox']});
 const p=await b.newPage();
 await p.evaluateOnNewDocument(()=>{Object.defineProperty(navigator,'webdriver',{get:()=>false});});
 const seen=[];
 p.on('requestfinished',async r=>{ if(/abacus/.test(r.url())) { const resp=r.response(); seen.push({url:r.url().slice(-40), status: resp?resp.status():'?'}); }});
 p.on('requestfailed',r=>{ if(/abacus/.test(r.url())) seen.push({url:r.url().slice(-40), failed:r.failure()&&r.failure().errorText}); });
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,120)));
 await p.goto('https://kang851216.github.io/kelas-tools/roulette.html',{waitUntil:'networkidle2'});
 await new Promise(r=>setTimeout(r,4000));
 console.log(JSON.stringify({abacus:seen,errors:errs}));
 await b.close();
})();
