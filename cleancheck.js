const puppeteer=require('puppeteer-core');
const NS='https://abacus.jasoncameron.dev/get/kelas-tools-web2/';
const read=async k=>{const r=await fetch(NS+k,{cache:'no-store'});if(r.status===404)return 0;const j=await r.json();return j.value??j.error;};
(async()=>{
const before=await read('v-2026-11-10');
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox','--hide-scrollbars']});
// 1) local preview must NOT count
const p1=await b.newPage();
await p1.goto('http://127.0.0.1:8765/roulette.html',{waitUntil:'load'});
await new Promise(r=>setTimeout(r,2500));
await p1.close();
const afterLocal=await read('v-2026-11-10');
// 2) live site with webdriver hidden must count
const p2=await b.newPage();
await p2.evaluateOnNewDocument(()=>{Object.defineProperty(navigator,'webdriver',{get:()=>false});});
await p2.goto('https://kang851216.github.io/kelas-tools/?ref=probe',{waitUntil:'load'});
await new Promise(r=>setTimeout(r,2500));
await p2.close();
await new Promise(r=>setTimeout(r,1500));
const afterLive=await read('v-2026-11-10');
const refProbe=await read('ref-probe');
console.log(JSON.stringify({before,afterLocal,afterLive,refProbe,localCounted:afterLocal-before,liveCounted:afterLive-afterLocal}));
await b.close();})();
