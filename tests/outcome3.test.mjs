import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.PLAYWRIGHT_MODULE ||
  `${process.env.USERPROFILE}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`;
const { chromium } = await import(pathToFileURL(modulePath).href);
const origin = process.env.OUTCOME3_TEST_URL || 'http://127.0.0.1:5179';
const totals = { trackedEvents: 7, visitors: 6, newUsers: 5, checkouts: 4, paidOrders: 3, revenue: 90000 };
const subscriptions = { activeMonthly: 2, activeYearly: 0, totalActive: 2, expiringIn30Days: 0, payingUsers: 2 };
const revenue = Object.fromEntries(['weekly', 'monthly', 'yearly', 'period'].map(key => [key, { amount: 90000 }]));
const base = { days: 30, totals, subscriptions, revenue, revenueTrend: [], funnel: [], channels: [] };
const outcome = {
  ...base,
  totals: { ...totals, totalUsers: 12, payingCustomers: 0, averageOrderValue: 0 },
  transactionGoal: { targetOrders: 20, paidOrders: 24, remainingOrders: 0, progressPercent: 120, achieved: true },
  channels: [{ source: 'fixture', medium: '', visitors: 6, newUsers: 5, checkouts: 4, paidOrders: 3, conversionRate: 12.5, averageOrderValue: 80000, revenue: 90000 }],
  reviews: { totalReviews: 1, verifiedReviews: 1, averageRating: 4.5, payingCustomers: 0, repeatPayingCustomers: 0 },
  subscriptionSales: { paidOrders: 3, revenue: 90000, newSubscriptions: 1, renewals: 2, payingClubs: 1,
    byPackage: [{ packageId: 1, code: 'MONTHLY', name: 'Gói tháng', cycle: 'MONTHLY', paidOrders: 3, newSubscriptions: 1, renewals: 2, revenue: 90000 }] },
};
const overview = {
  stats: Object.fromEntries(['totalUsers','activeUsers','bannedUsers','totalClubs','activeClubs','publicClubs','privateClubs','totalDocuments','totalEvents','totalForms','totalSheets'].map(key => [key, 0])),
  monthlyResourceUsage: [], currentClubs: [], recentActivities: [],
};
const statusRows = [
  { id: 1, orderCode: 900001, amount: 90000, status: 'PAID', customerName: '<b>Fixture</b>', customerEmail: 'fixture@example.test', transactionNo: 'FIXTURE-GATEWAY', referenceSource: 'GATEWAY' },
  { id: 2, orderCode: 900002, amount: 0, status: 'PENDING', referenceSource: 'MANUAL' },
  { id: 3, orderCode: 900003, amount: 0, status: 'CANCELLED' },
  { id: 4, orderCode: 900004, amount: 0, status: 'EXPIRED' },
];

test('Outcome 3 Admin and anonymous attribution contracts', async t => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    localStorage.setItem('token', 'fixture');
    localStorage.setItem('userId', '11');
    if (!localStorage.getItem('systemRole')) localStorage.setItem('systemRole', 'ADMIN');
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const events = [], orderQueries = [], errors = [];
  let analytics = outcome, orderStatus = 200, feedbackVerified = true;
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== origin) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const json = (data, status = 200) => route.fulfill({ json: data, status });
    switch (url.pathname) {
      case '/api/payments/check-permission': return json({ canPay: true });
      case '/api/payments/club/7/subscription': return json({}, 404);
      case '/api/packages': return json([{ id: 1, name: 'Fixture plan', price: 90000, durationDays: 30 }]);
      case '/api/payments/create-checkout': return json({ orderCode: 900009, status: 'PENDING', amount: 90000, packageName: 'Fixture plan' });
      case '/api/payments/order/900009': return json({ orderCode: 900009, status: 'PENDING', amount: 90000 });
      case '/api/users/11': return json({ role: 'ADMIN' });
      case '/api/admin/dashboard/overview': return json(overview);
      case '/api/admin/analytics': return json(analytics);
      case '/api/admin/feedbacks/summary': return json({ totalFeedbacks: 1, averageRating: 5, ratingCounts: {1:0,2:0,3:0,4:0,5:1} });
      case '/api/admin/feedbacks': return json({ page: 0, size: 20, totalPages: 1, totalElements: 1,
        content: [{ id: 1, rating: 5, fullName: 'Fixture reviewer', verified: feedbackVerified, orderCode: 900001 }] });
      case '/api/admin/orders': {
        orderQueries.push(Object.fromEntries(url.searchParams));
        const pageNumber = Number(url.searchParams.get('page')), size = Number(url.searchParams.get('size'));
        const search = url.searchParams.get('search'), status = url.searchParams.get('status');
        if (orderStatus !== 200) return json({}, orderStatus);
        if (search === '900004') await new Promise(resolve => setTimeout(resolve, 300));
        const matching = statusRows.filter(row => (!search || String(row.orderCode) === search) && (!status || status === row.status));
        const totalPages = search || status ? Number(matching.length > 0) : 2;
        return json({ page: pageNumber, size, totalPages, totalElements: matching.length, content: pageNumber ? matching.slice(0, 1) : matching });
      }
      case '/api/analytics/events':
        events.push({ body: request.postDataJSON(), auth: request.headers().authorization, referer: request.headers().referer });
        return json({}, 500);
      default: return route.abort();
    }
  });

  await page.goto(origin + '/admin');
  const menu = name => page.getByRole('button', { name, exact: true });
  await menu('Analytics').click();
  await page.getByText('Verified Paid Orders (All Time)', { exact: true }).waitFor();
  assert.equal(await page.getByRole('progressbar', { name: 'Transaction goal progress' }).getAttribute('value'), '100');
  for (const value of ['120%', 'Goal Status: Achieved', '12.5%', 'Monthly Plan', 'Review coverage target: 50%. Reported coverage: N/A.']) {
    await page.getByText(value, { exact: true }).waitFor();
  }
  analytics = base;
  await menu('Refresh').click();
  await page.getByText('Transaction goal data is unavailable.').waitFor();
  await page.getByText('Subscription sales data is unavailable.').waitFor();

  await menu('Orders').click();
  await page.getByText('FIXTURE-GATEWAY').waitFor();
  await page.getByText('Manual Reference', { exact: true }).waitFor();
  await page.getByText('<b>Fixture</b>', { exact: true }).waitFor();
  await menu('View details').first().click();
  await page.getByText('fixture@example.test', { exact: true }).waitFor();
  await menu('Next').click();
  await page.getByText(/Page 2 \/ 2/).waitFor();
  await page.getByLabel('Orders per page').selectOption('50');
  await page.getByText(/Page 1 \/ 2/).waitFor();
  await page.getByLabel('Created from').fill('2026-11-01');
  await page.getByLabel('Created through').fill('2026-11-02');
  await menu('Next').click();
  await page.getByText(/Page 2 \/ 2/).waitFor();
  await page.getByLabel('Order code').fill('900001');
  await Promise.all([page.waitForResponse(response => response.url().includes('search=900001')), menu('Search orders').click()]);
  assert.deepEqual(orderQueries.at(-1), { search: '900001', from: '2026-11-01', to: '2026-11-02', page: '0', size: '50' });
  await page.getByText('FIXTURE-GATEWAY').waitFor();
  const statusSelect = page.locator('select[aria-label="Payment status"]');
  await Promise.all([
    page.waitForResponse(response => response.url().includes('status=PAID')),
    statusSelect.selectOption('PAID', { force: true }),
  ]);
  const orderCodeInput = page.getByRole('searchbox', { name: 'Order code' });
  await orderCodeInput.fill('   ');
  await Promise.all([
    page.waitForResponse(response => {
      const url = new URL(response.url());
      return url.pathname === '/api/admin/orders' && url.searchParams.get('status') === 'PAID' && !url.searchParams.has('search');
    }),
    orderCodeInput.press('Enter'),
  ]);
  assert.deepEqual(orderQueries.at(-1), { status: 'PAID', from: '2026-11-01', to: '2026-11-02', page: '0', size: '50' });
  await orderCodeInput.fill('900001');
  await Promise.all([
    page.waitForResponse(response => response.url().includes('search=900001')),
    orderCodeInput.press('Enter'),
  ]);
  assert.deepEqual(orderQueries.at(-1), { search: '900001', status: 'PAID', from: '2026-11-01', to: '2026-11-02', page: '0', size: '50' });
  await page.getByText('FIXTURE-GATEWAY').waitFor();
  const beforeRepeat = orderQueries.length;
  await menu('Search orders').evaluate(button => { button.click(); button.click(); });
  await orderCodeInput.press('Enter');
  assert.equal(orderQueries.length, beforeRepeat);
  await statusSelect.selectOption('', { force: true });
  await page.getByLabel('Order code').fill('fixture@example.test');
  assert.equal(await menu('Search orders').isDisabled(), true);
  await page.getByLabel('Order code').fill('999999');
  await menu('Search orders').click();
  await page.getByText('No results found.').waitFor();
  await page.getByLabel('Order code').fill('900004');
  await Promise.all([page.waitForRequest(request => request.url().includes('search=900004')), menu('Search orders').click()]);
  await page.getByLabel('Order code').fill('900001');
  await menu('Search orders').click();
  await page.getByText('FIXTURE-GATEWAY').waitFor();
  await page.waitForTimeout(350);
  assert.equal(await page.getByText('900004', { exact: true }).count(), 0);
  orderStatus = 500;
  await orderCodeInput.fill('900002');
  await orderCodeInput.press('Enter');
  await page.getByText('The server could not load orders.').waitFor();
  assert.equal(await page.getByText('900002', { exact: true }).count(), 0);
  orderStatus = 200;
  await menu('Retry').click();
  await page.getByText('900002', { exact: true }).waitFor();
  assert.equal(orderQueries.at(-1).search, '900002');
  await orderCodeInput.fill('900001');
  await menu('Search orders').click();
  await page.getByText('FIXTURE-GATEWAY').waitFor();
  orderStatus = 404;
  await menu('Refresh orders').click();
  await page.getByText('The order ledger endpoint is unavailable.').waitFor();
  orderStatus = 200;
  await menu('Retry').click();
  await page.getByText('FIXTURE-GATEWAY').waitFor();

  await menu('Feedback').click();
  await page.getByText('Verified Purchase', { exact: true }).waitFor();
  await page.getByText('900001', { exact: true }).waitFor();
  feedbackVerified = undefined;
  await menu('Refresh').click();
  await page.getByText('Fixture reviewer').waitFor();
  assert.equal(await page.getByText('Verified Purchase', { exact: true }).count(), 0);

  for (const width of [320,375,390,768,1024,1440,1920]) {
    await page.setViewportSize({ width, height: 1000 });
    if (await menu('Open administration menu').isVisible()) await menu('Open administration menu').click();
    await menu('Orders').click();
    await page.getByText('FIXTURE-GATEWAY').waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Orders overflow at ${width}`);
    const layout = await page.locator('.admin-orders-search').evaluate(form => {
      const input = form.querySelector('input');
      const button = form.querySelector('button');
      const bounds = form.getBoundingClientRect();
      const field = input.getBoundingClientRect();
      const action = button.getBoundingClientRect();
      return {
        equalHeight: Math.abs(field.height - action.height) < 1,
        aligned: Math.abs(field.bottom - action.bottom) < 1,
        stacked: action.top >= field.bottom,
        contained: field.left >= bounds.left && action.right <= bounds.right + 1,
        noWrap: getComputedStyle(button).whiteSpace === 'nowrap' && button.scrollWidth <= button.clientWidth,
      };
    });
    assert.ok(layout.equalHeight && layout.contained && layout.noWrap, JSON.stringify({ width, layout }));
    assert.ok(width <= 480 ? layout.stacked : layout.aligned, JSON.stringify({ width, layout }));
    assert.ok(await page.getByRole('combobox', { name: 'Payment status' }).isVisible());
    assert.ok(await page.getByLabel('Created from').isVisible());
    assert.ok(await page.getByLabel('Created through').isVisible());
    assert.ok(await page.getByLabel('Orders per page').isVisible());
    await orderCodeInput.focus();
    await page.keyboard.press('Tab');
    assert.ok(await menu('Search orders').evaluate(button => {
      const css = getComputedStyle(button);
      return document.activeElement === button && css.outlineStyle !== 'none' && parseFloat(css.outlineWidth) > 0;
    }), `Missing keyboard focus indicator at ${width}`);

  }
  orderStatus = 403;
  await menu('Refresh orders').click();
  await page.waitForURL('**/select-club');
  assert.equal(await page.getByText('FIXTURE-GATEWAY').count(), 0);
  orderStatus = 200;
  await page.goto(origin + '/admin');
  await menu('Orders').click();
  await page.getByText('FIXTURE-GATEWAY').waitFor();
  orderStatus = 401;
  await menu('Refresh orders').click();
  await page.waitForURL('**/login');
  assert.equal(await page.getByText('FIXTURE-GATEWAY').count(), 0);
  const before = orderQueries.length;
  await page.evaluate(() => localStorage.setItem('systemRole', 'USER'));
  await page.goto(origin + '/admin');
  await page.waitForURL('**/select-club');
  assert.equal(orderQueries.length, before);

  await page.goto(origin + '/?utm_source=fixture&utm_medium=cpc&utm_campaign=launch&code=private&token=private', {
    referer: 'https://referrer.example.test/path?token=private',
  });
  const nav = page.getByRole('navigation', { name: 'Public navigation' });
  const featureView = page.waitForRequest(request =>
    new URL(request.url()).pathname === '/api/analytics/events' && request.postDataJSON()?.path === '/features');
  await nav.getByRole('link', { name: 'Features', exact: true }).click();
  await featureView;
  await nav.getByRole('link', { name: 'Features', exact: true }).click();
  await page.waitForURL('**/features');
  const publicViews = events.filter(event => event.body.eventName === 'page_view');
  assert.deepEqual(publicViews.map(event => event.body.path), ['/', '/features']);
  for (const { body, auth, referer } of publicViews) {
    assert.equal(auth, undefined);
    assert.equal(referer, undefined);
    assert.equal(body.sessionId, publicViews[0].body.sessionId);
    assert.match(body.sessionId, /^[0-9a-f-]{36}$/);
    assert.equal(body.referrer, 'https://referrer.example.test');
    assert.equal(body.utmSource, 'fixture');
    assert.equal(body.utmMedium, 'cpc');
    assert.equal(body.utmCampaign, 'launch');
    assert.equal(body.url, undefined);
    assert.ok(!JSON.stringify(body).includes('private'));
  }
  const ga4Views = await page.evaluate(() => window.dataLayer
    .filter(entry => entry[0] === 'event' && entry[1] === 'page_view')
    .map(entry => entry[2].page_path));
  assert.deepEqual(ga4Views, ['/', '/features']);

  await page.evaluate(() => {
    localStorage.setItem('selectedClubId', '7');
    localStorage.setItem('selectedClubRole', 'PRESIDENT');
    history.pushState({}, '', '/dashboard');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await menu('Upgrade / Renew').click();
  const checkoutEvent = page.waitForRequest(request =>
    new URL(request.url()).pathname === '/api/analytics/events' && request.postDataJSON()?.eventName === 'checkout_start');
  await menu('Pay Now').evaluate(button => { button.click(); button.click(); });
  await checkoutEvent;
  await page.getByRole('dialog').waitFor();
  const paymentEvents = events.filter(event => ['pricing_view', 'checkout_start'].includes(event.body.eventName));
  assert.deepEqual(paymentEvents.map(event => event.body.eventName), ['pricing_view', 'checkout_start']);
  for (const { body, auth, referer } of paymentEvents) {
    assert.equal(auth, undefined);
    assert.equal(referer, undefined);
    assert.equal(body.path, '/dashboard');
    assert.equal(body.utmSource, 'fixture');
    assert.equal(body.sessionId, publicViews[0].body.sessionId);
    assert.equal(body.orderCode, undefined);
  }
  const ga4Payments = await page.evaluate(() => window.dataLayer
    .filter(entry => entry[0] === 'event' && ['initiate_transaction','complete_payment'].includes(entry[1]))
    .map(entry => entry[1]));
  assert.deepEqual(ga4Payments, ['initiate_transaction']);
  assert.deepEqual(errors, []);
});
