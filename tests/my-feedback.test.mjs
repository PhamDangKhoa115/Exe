import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

// Run with Vite running; all API traffic is mocked, including mutations.
// PLAYWRIGHT_MODULE may point to an existing Playwright installation.
const modulePath = process.env.PLAYWRIGHT_MODULE || `${process.env.USERPROFILE}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`;
const { chromium } = await import(pathToFileURL(modulePath).href);
const origin = process.env.FEEDBACK_TEST_URL || 'http://127.0.0.1:5174';
const empty = { error: 'Bạn chưa gửi feedback nào!' };
const existing = { id: 3, rating: 3, ratingLabel: 'Bình thường', comment: 'Original comment', userId: 11, verified: true, orderCode: 900001 };
const html = `<div id="root"></div><script type="module">
import RefreshRuntime from '/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
await import('/tests/feedback-harness.jsx');</script>`;

test('My Feedback verified contracts and protected mutation flows', async t => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  t.after(() => browser.close());
  async function setup({ status = 200, data = existing, network = false, delay = 0 } = {}) {
    const context = await browser.newContext();
    await context.addInitScript(() => { localStorage.setItem('userId','11');localStorage.setItem('token','fixture-session'); });
    const page = await context.newPage(); page.setDefaultTimeout(5000); page.on('pageerror',error=>console.error(error.message));
    const state = { status, data, network, delay, mutations: [], reads: 0 };
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if(url.origin !== origin) return route.abort();
      if(url.pathname === '/__feedback_test') return route.fulfill({ contentType:'text/html', body:html });
      if(!url.pathname.startsWith('/api/')) return route.continue();
      if(url.pathname.endsWith('/rating-options')) return route.fulfill({ json:[1,2,3,4,5].map(value=>({value,label:'Backend label'})) });
      if(!['/api/feedbacks','/api/feedbacks/me'].includes(url.pathname)) return route.abort();
      const method = route.request().method();
      if(method === 'GET') {
        state.reads++;
        const snapshot={status:state.status,data:state.data,network:state.network};
        if(state.delay) await new Promise(resolve=>setTimeout(resolve,state.delay));
        if(snapshot.network) return route.abort('failed');
        return route.fulfill({status:snapshot.status,json:snapshot.data});
      }
      state.mutations.push({method,body:route.request().postDataJSON()});
      await new Promise(resolve=>setTimeout(resolve,150));
      state.status=method==='DELETE'?404:200;
      state.data=method==='DELETE'?empty:{...existing,...route.request().postDataJSON()};
      return route.fulfill({json:{message:'Success'}});
    });
    await page.goto(`${origin}/__feedback_test`);
    return {page,state,close:()=>context.close()};
  }
  await t.test('200: selected English rating, PUT refresh, confirmed DELETE refresh and double submit', async()=>{
    const {page,state,close}=await setup();
    await page.getByText('Verified Purchase', { exact: true }).waitFor();
    await page.getByText('Order reference: 900001', { exact: true }).waitFor();
    await page.getByRole('button',{name:'Update Feedback',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'3 stars — Average'}).getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('textarea').inputValue(),'Original comment');
    assert.equal(await page.getByRole('button',{name:'Submit Feedback',exact:true}).count(),0);
    await page.locator('textarea').fill('Updated comment');
    await page.getByRole('button',{name:'Update Feedback',exact:true}).evaluate(button=>{button.click();button.click()});
    await page.getByRole('button',{name:'Update Feedback',exact:true}).waitFor();
    assert.deepEqual(state.mutations,[{method:'PUT',body:{rating:3,comment:'Updated comment'}}]);
    assert.equal(await page.locator('textarea').inputValue(),'Updated comment');
    await page.getByRole('button',{name:'Delete My Feedback',exact:true}).click();
    await page.getByRole('button',{name:'Cancel',exact:true}).click();
    assert.equal(state.mutations.length,1);
    await page.getByRole('button',{name:'Delete My Feedback',exact:true}).click();
    await page.getByRole('button',{name:'Confirm Delete',exact:true}).evaluate(button=>{button.click();button.click()});
    await page.getByText("You haven't submitted any feedback yet.",{exact:true}).waitFor();
    assert.equal(state.mutations.filter(row=>row.method==='DELETE').length,1);
    assert.ok(state.reads>=3);await close();
  });
  await t.test('exact 404: empty state, required rating, POST refresh, no Vietnamese error',async()=>{
    const {page,state,close}=await setup({status:404,data:{error:`  ${empty.error}  `}});
    await page.getByText("You haven't submitted any feedback yet.",{exact:true}).waitFor();
    assert.equal(await page.getByRole('alert').count(),0);
    assert.equal(await page.getByText(empty.error,{exact:true}).count(),0);
    await page.getByRole('button',{name:'Submit Feedback',exact:true}).click();
    assert.equal(state.mutations.length,0);
    await page.getByRole('button',{name:'5 stars — Excellent'}).click();
    await page.getByRole('button',{name:'Submit Feedback',exact:true}).evaluate(button=>{button.click();button.click()});
    await page.getByRole('button',{name:'Update Feedback',exact:true}).waitFor();
    assert.deepEqual(state.mutations,[{method:'POST',body:{rating:5,comment:''}}]);
    assert.equal(await page.locator('textarea').getAttribute('maxlength'),'2000');await close();
  });
  for(const scenario of [
    {name:'400 validation',status:400,data:{error:'Invalid request'}},
    {name:'unexpected 404',status:404,data:{error:'Route missing'}},
    {name:'non-string 404',status:404,data:{error:123}},
    {name:'403 forbidden',status:403,data:{error:'Forbidden'}},
    {name:'500 server',status:500,data:{error:'Server error'}},
    {name:'network',network:true},
    {name:'malformed 200',data:{message:'Unknown envelope'}},
    {name:'null 200',data:null},
    {name:'wrong ownership',data:{...existing,userId:12}},
  ]) await t.test(`${scenario.name}: error only, retry works`,async()=>{
    const {page,state,close}=await setup(scenario);
    await page.getByRole('button',{name:'Retry feedback'}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Submit Feedback',exact:true}).count(),0);
    state.status=404;state.data=empty;state.network=false;
    await page.getByRole('button',{name:'Retry feedback'}).click();
    await page.getByRole('button',{name:'Submit Feedback',exact:true}).waitFor();await close();
  });
  await t.test('401 clears authentication and redirects without create',async()=>{
    const {page,close}=await setup({status:401,data:{error:'Authentication required'}});
    await page.waitForURL('**/login');
    assert.equal(await page.evaluate(()=>localStorage.getItem('token')),null);
    assert.equal(await page.getByRole('button',{name:'Submit Feedback',exact:true}).count(),0);await close();
  });
  await t.test('stale response from previous token cannot replace new session',async()=>{
    const {page,state,close}=await setup({delay:350});
    await page.getByText('Loading your feedback...').waitFor();
    await page.waitForFunction(()=>document.querySelector('section')!==null);
    state.status=404;state.data=empty;state.delay=0;
    await page.evaluate(()=>{localStorage.setItem('token','new-session');window.renderFeedback()});
    await page.getByText("You haven't submitted any feedback yet.",{exact:true}).waitFor();
    await new Promise(resolve=>setTimeout(resolve,450));
    assert.equal(await page.getByRole('button',{name:'Update Feedback',exact:true}).count(),0);await close();
  });
});
