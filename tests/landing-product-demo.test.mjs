import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||`${process.env.USERPROFILE}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`).href);
const origin=process.env.DEMO_TEST_URL||'http://127.0.0.1:5176';
const shots=process.env.DEMO_SCREENSHOTS;
test('Landing product demo: playback, controls, viewport, accessibility and responsive layouts',async t=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});t.after(()=>browser.close());
 const context=await browser.newContext({viewport:{width:1440,height:1100}});const page=await context.newPage();page.setDefaultTimeout(5000);const errors=[],api=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.pathname.startsWith('/api/')){api.push(url.pathname);return route.abort()}if(url.origin!==origin)return route.abort();return route.continue()});
 await page.goto(origin);const demo=page.getByRole('region',{name:'Interactive S-Club product demo'});await demo.waitFor();await demo.scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('.lpd').dataset.playing==='true');
 const advance=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const active=()=>page.locator('.lpd-sidebar button[aria-pressed=true]').innerText();
 assert.equal(await active(),'Google Docs');
 await advance(6800);await page.getByText('All changes saved',{exact:true}).waitFor();
 
 await advance(1000);await page.waitForFunction(()=>document.querySelector('.lpd-sidebar button[aria-pressed=true]').textContent==='Google Sheets');assert.equal(await active(),'Google Sheets');
 await page.getByRole('button',{name:'Pause demo'}).evaluate(button=>button.click());await page.waitForFunction(()=>document.querySelector('.lpd').dataset.playing==='false');await advance(200);let progress=await page.locator('.lpd-progress i').getAttribute('style');await advance(600);assert.equal(await page.locator('.lpd-progress i').getAttribute('style'),progress);
 await page.getByRole('button',{name:'Team Chat',exact:true}).evaluate(button=>button.click());assert.equal(await active(),'Team Chat');assert.equal(await page.locator('.lpd-scene').evaluate(el=>getComputedStyle(el).opacity),'1');
 await page.getByRole('button',{name:'Resume demo'}).evaluate(button=>button.click());await page.waitForFunction(()=>document.querySelector('.lpd').dataset.playing==='true');await advance(5700);await page.getByText('✓✓ Delivered',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Trello',exact:true}).evaluate(button=>button.click());await advance(5100);assert.equal(await page.locator('.lpd-column').nth(2).getByText('Design event poster').count(),1);
 await page.getByRole('button',{name:'Calendar',exact:true}).evaluate(button=>button.click());await advance(5900);await page.getByText('✓ Event added to your club calendar',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Finance',exact:true}).evaluate(button=>button.click());await advance(4700);await page.getByText('+500,000 ₫',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Google Forms',exact:true}).evaluate(button=>button.click());await advance(6500);await page.getByText('Form ready to share',{exact:true}).waitFor();await advance(1100);assert.equal(await active(),'Google Docs');
 await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await page.waitForFunction(()=>document.querySelector('.lpd').dataset.playing==='false');progress=await page.locator('.lpd-progress i').getAttribute('style');await advance(800);assert.equal(await page.locator('.lpd-progress i').getAttribute('style'),progress);
 await demo.scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.lpd').dataset.playing==='true');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'))});await page.waitForFunction(()=>document.querySelector('.lpd').dataset.playing==='false');await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'))});await page.waitForFunction(()=>document.querySelector('.lpd').dataset.playing==='true');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('.lpd').dataset.playing==='false');await page.getByText('All changes saved',{exact:true}).waitFor();
 if(shots)await page.screenshot({path:`${shots}/landing-demo-desktop.png`,fullPage:true});
 for(const width of [320,375,390,768,1024,1440,1920]){
  await page.setViewportSize({width,height:1000});await demo.scrollIntoViewIfNeeded();
  for(const name of ['Google Docs','Google Sheets','Team Chat','Trello','Calendar','Finance','Google Forms']){
   await page.getByRole('button',{name,exact:true}).evaluate(button=>button.click());
   const sizes=await demo.evaluate(el=>({width:el.getBoundingClientRect().width,scroll:el.scrollWidth,client:el.clientWidth,page:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert.ok(sizes.scroll<=sizes.client+1,`${width} ${name}: demo overflow ${JSON.stringify(sizes)}`);
   assert.ok(sizes.page<=sizes.viewport+1,`${width}: page overflow ${JSON.stringify(sizes)}`);
  }
  if(shots&&[390,768].includes(width))await page.screenshot({path:`${shots}/landing-demo-${width}.png`,fullPage:true});
 }
 assert.equal(await page.locator('h1').count(),1);assert.equal(await page.getByRole('link',{name:'Get Started →'}).getAttribute('href'),'/login');assert.equal(await page.locator('.problem-section').count(),1);assert.equal(await page.locator('.solution-section').count(),1);
 assert.deepEqual(api,[]);assert.deepEqual(errors,[]);
 await page.getByRole('link',{name:'Get Started →'}).evaluate(button=>button.click());await page.waitForURL('**/login');await advance(600);assert.deepEqual(errors,[]);
 await context.close();
});
