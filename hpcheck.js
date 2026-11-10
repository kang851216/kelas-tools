const puppeteer=require('puppeteer-core');
const NS='https://abacus.jasoncameron.dev/get/kelas-tools-web3/';
const read=async k=>{const r=await fetch(NS+k,{cache:'no-store'});if(r.status===404)return 0;const j=await r.json();return j.value??0;};
(async()=>{
 const before=await read('hp-roulette');
 const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox']});
 const p=await b.newPage(); await p.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36');
 await p.evaluateOnNewDocument(()=>{Object.defineProperty(navigator,'webdriver',{get:()=>false});});
 await p.goto('https://kang851216.github.io/kelas-tools/roulette.html',{waitUntil:'networkidle2'});
 await new Promise(r=>setTimeout(r,3500)); await b.close();
 await new Promise(r=>setTimeout(r,2000));
 console.log(JSON.stringify({before,after:await read('hp-roulette'),h_all:await read('h-all')}));
})();
