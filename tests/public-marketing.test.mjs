import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE || `${process.env.USERPROFILE}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`).href);
const origin=process.env.MARKETING_TEST_URL||'http://127.0.0.1:5176';
const shots=process.env.MARKETING_SCREENSHOTS;

test('Public Features, shared navigation/footer, ChromaGrid, CTA and SEO',async t=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});t.after(()=>browser.close());
 const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();page.setDefaultTimeout(7000);const errors=[],api=[],external=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin===origin&&url.pathname==='/api/analytics/events')return route.fulfill({json:{}});if(url.pathname.startsWith('/api/')){api.push(url.pathname);return route.abort()}if(url.origin!==origin){external.push(url.href);return route.abort()}return route.continue()});
 await page.goto(`${origin}/features`);await page.getByRole('heading',{level:1,name:'Powerful Features for Every Student Club'}).waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('token')),null);
 assert.equal(await page.title(),'Features | S-Club — Club Management Platform');
 assert.equal(await page.locator('link[rel=canonical]').count(),1);
 assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://sclub.io.vn/features');
 assert.equal(await page.locator('meta[name=description]').getAttribute('content'),'Explore S-Club features for managing members, departments, events, documents, tasks, communication, and club finances.');
 assert.equal(await page.locator('h1').count(),1);
 assert.equal(await page.locator('.chroma-card').count(),12);
 assert.equal(await page.locator('.public-nav a[aria-current=page]').innerText(),'Features');
 await page.getByRole('link',{name:'Explore Features',exact:true}).click();
 assert.equal(await page.locator('#features-grid').evaluate(el=>document.activeElement===el),true);
 for(const card of await page.locator('.chroma-card').all()){
   const href=await card.getAttribute('href');assert.ok(href.startsWith('#workflow-'));
   assert.equal(await page.locator(href).count(),1);
   assert.ok((await card.locator('p').innerText()).length>40);
   await card.scrollIntoViewIfNeeded();
 }
 const card=page.locator('.chroma-card').first();await card.scrollIntoViewIfNeeded();await card.hover();
 await page.waitForFunction(()=>parseFloat(document.querySelector('.chroma-grid').style.getPropertyValue('--chroma-power'))>.4);
 const glow=await page.locator('.chroma-grid').evaluate(el=>[el.style.getPropertyValue('--chroma-x'),el.style.getPropertyValue('--chroma-y')]);assert.ok(glow.every(value=>value.endsWith('px')));
 await page.keyboard.press('Tab');await card.focus();assert.equal(await card.evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
 await card.click();await page.waitForURL('**/features#workflow-people');
 await page.locator('.marketing-cta').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.marketing-cta').dataset.active==='true');
 assert.equal(await page.locator('.marketing-cta h2').innerText(),'Ready to Take Your Club\nto the Next Level?');
 assert.equal(await page.locator('.marketing-cta-button').getAttribute('href'),'/register');assert.equal(await page.locator('.marketing-cta h2').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)');
 await page.locator('.marketing-cta').hover();assert.ok(await page.locator('.marketing-cta').evaluate(el=>getComputedStyle(el,'::before').backgroundImage.includes('radial-gradient')));
 assert.equal(await page.locator('.marketing-footer a[href="#"]').count(),0);
 assert.equal(await page.locator('.marketing-footer').getByText(/500 clubs/).count(),0);
 assert.equal(await page.locator('.marketing-footer-contact a').getAttribute('href'),'mailto:sclub.management.platform@gmail.com');
 assert.ok((await page.locator('.marketing-footer-bottom').innerText()).includes(String(new Date().getFullYear())));
 const footerLinks=[...new Set(await page.locator('.marketing-footer a[href^="/"]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href'))))];
 assert.deepEqual(footerLinks.sort(),['/','/features','/login','/privacy','/register','/terms'].sort());
 if(shots){for(const block of ['.features-workflows','.features-how','.marketing-cta'])await page.locator(block).scrollIntoViewIfNeeded();await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(600);await page.screenshot({path:`${shots}/features-desktop.png`,fullPage:true});await page.locator('.marketing-cta').scrollIntoViewIfNeeded();await page.locator('.marketing-cta').screenshot({path:`${shots}/marketing-cta-desktop.png`})}
 // Router navigation must clean metadata and reuse exactly one footer/navbar.
 await page.locator('.public-nav').getByRole('link',{name:'Home',exact:true}).click();await page.waitForURL(origin+'/');await page.locator('.lpd').waitFor();
 assert.equal(await page.locator('.lpd').count(),1);assert.equal(await page.locator('.marketing-footer').count(),1);assert.equal(await page.locator('link[rel=canonical]').count(),0);assert.equal(await page.title(),'S-Club');
 await page.locator('.lpd').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.lpd').dataset.playing==='true');
 await page.locator('.lpd').getByRole('button',{name:'Finance',exact:true}).click();assert.equal(await page.locator('.lpd-workspace h3').innerText(),'Finance');
 await page.locator('.public-nav').getByRole('link',{name:'Features',exact:true}).click();await page.waitForURL('**/features');await page.locator('.chroma-card').first().waitFor();await page.waitForFunction(()=>document.querySelector('link[rel=canonical]')?.getAttribute('href')==='https://sclub.io.vn/features');assert.equal(await page.locator('link[rel=canonical]').count(),1);
 for(const path of footerLinks){
   const footer=page.locator('.marketing-footer');await footer.locator(`a[href="${path}"]`).first().evaluate(el=>el.click());await page.waitForURL(origin+path);await page.waitForTimeout(100);
   if(path==='/privacy')assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://sclub.io.vn/privacy');
   if(path==='/login')await page.getByRole('heading',{name:/Welcome|Login|Sign in/i}).first().waitFor();
   if(path==='/terms')await page.getByRole('heading',{name:'Terms of Service'}).waitFor();
   await page.goto(`${origin}/features`);await page.locator('.chroma-card').first().waitFor();assert.equal(await page.locator('link[rel=canonical]').count(),1);
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,375,390,768,1024,1440,1920]){
   await page.setViewportSize({width,height:1000});
   for(const path of ['/features','/']){
     await page.goto(origin+path);await page.locator('.marketing-footer').waitFor();
     const sizes=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));assert.ok(sizes.page<=sizes.viewport+1,`${path} overflow at ${width}: ${JSON.stringify(sizes)}`);
     assert.equal(await page.locator('.public-nav').count(),1);assert.equal(await page.locator('.marketing-footer').count(),1);
     for(const link of await page.locator('.public-nav a').all())assert.ok(await link.isVisible());
     if(path==='/features'){
       assert.equal(await page.locator('.chroma-card').count(),12);assert.equal(await page.locator('.chroma-card h3').count(),12);
       assert.equal(await page.locator('.features-steps').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),width<=560?1:3);
       assert.equal(await page.locator('.chroma-grid .chroma-mono').first().evaluate(el=>getComputedStyle(el).filter),'none');
       await page.locator('.marketing-cta').scrollIntoViewIfNeeded();assert.equal(await page.locator('.marketing-cta').evaluate(el=>getComputedStyle(el).animationName),'none');
       if(shots&&[390,768].includes(width))await page.screenshot({path:`${shots}/features-${width}.png`,fullPage:true});
     }
   }
 }
 assert.deepEqual(api,[]);assert.deepEqual(errors,[]);assert.ok(!external.some(url=>/unsplash|images\./.test(url)));
 await context.close();
});
