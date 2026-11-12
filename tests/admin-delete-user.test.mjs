import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const playwright = process.env.PLAYWRIGHT_MODULE ||
  `${process.env.USERPROFILE}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`;
const { chromium } = await import(pathToFileURL(playwright).href);
const origin = process.env.OUTCOME3_TEST_URL || 'http://127.0.0.1:5179';
const self = { userId: 11, fullName: 'Admin Fixture', role: 'ADMIN' };
const other = { userId: 12, fullName: 'Target Fixture', email: 'target@example.test', role: 'USER', managedClubsCount: 1 };
const overview = {
  stats: Object.fromEntries(['totalUsers','activeUsers','bannedUsers','totalClubs','activeClubs','publicClubs','privateClubs','totalDocuments','totalEvents','totalForms','totalSheets'].map(key => [key, 0])),
  monthlyResourceUsage: [], currentClubs: [], recentActivities: [],
};

test('Admin Users deletion is guarded, refreshes server state and handles failures', async t => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  t.after(() => browser.close());
  async function setup({ status = 200, body = {}, role = 'ADMIN', verified = true, refreshError = false, staleRead = false, delay = 0, record = other } = {}) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.addInitScript(role => {
      localStorage.setItem('token', 'fixture');
      localStorage.setItem('userId', '11');
      localStorage.setItem('systemRole', role);
    }, role);
    const state = { deletes: [], userQueries: [], overviewReads: 0, deleted: false };
    await page.route('**/*', async route => {
      const req = route.request();
      const url = new URL(req.url());
      if (url.origin !== origin) return route.abort();
      if (!url.pathname.startsWith('/api/')) return route.continue();
      const json = (body, status = 200) => route.fulfill({ json: body, status });
      if (url.pathname === '/api/users/11') return json({ role, userId: verified ? 11 : 88 });
      if (url.pathname === '/api/admin/dashboard/overview') {
        state.overviewReads++;
        return json(overview);
      }
      if (url.pathname === '/api/admin/users' && req.method() === 'GET') {
        state.userQueries.push(Object.fromEntries(url.searchParams));
        if (state.deleted && refreshError) return json({ message: 'Fixture user list refresh failed' }, 500);
        const records = [self, ...(state.deleted ? [] : [record])];
        if (staleRead && url.searchParams.has('search') && !state.deleted) {
          await new Promise(resolve => setTimeout(resolve, 950));
        }
        return json(records);
      }
      if (url.pathname.startsWith('/api/admin/users/') && req.method() === 'DELETE') {
        state.deletes.push({ path: url.pathname, query: url.search, body: req.postData(), auth: req.headers().authorization });
        if (delay) await new Promise(resolve => setTimeout(resolve, delay));
        if (status === 'network') return route.abort('failed');
        if (status === 'timeout') return new Promise(resolve => {
          const timer = setTimeout(resolve, 11000);
          page.once('close', () => { clearTimeout(timer); resolve(); });
        });
        if (status === 200) state.deleted = true;
        return json(body, status);
      }
      return route.abort();
    });
    await page.goto(origin + '/admin');
    const button = name => page.getByRole('button', { name, exact: true });
    const target = page.getByRole('button', { name: 'Delete User', exact: true }).nth(1);
    const dialog = page.getByRole('dialog', { name: 'Delete User Account' });
    const open = async () => { await target.click(); await dialog.waitFor(); };
    const confirm = async () => {
      await dialog.getByRole('checkbox').check();
      await dialog.getByRole('button', { name: 'Delete Account', exact: true }).click();
    };
    if (role === 'ADMIN') {
      await button('Users').click();
      await target.waitFor();
    }
    return { page, button, target, dialog, open, confirm, state, close: () => context.close() };
  }

  await t.test('cancel, focus, responsive modal, and one DELETE with refresh', async () => {
    const x = await setup({ delay: 350 });
    const { page, button, target, dialog, state } = x;
    try {
      const ownRow = page.getByRole('row').filter({ hasText: self.fullName });
      assert.ok(await ownRow.getByRole('button', { name: 'Delete User' }).isDisabled());
      await ownRow.getByText('You cannot delete your own account.').waitFor();
      for (const width of [320,375,390,768,1024,1440,1920]) {
        await page.setViewportSize({ width, height: 900 });
        await x.open();
        const box = await dialog.boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width + 1, `Dialog overflow at ${width}`);
        assert.ok(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        assert.ok(await dialog.getByRole('button', { name: 'Cancel' }).evaluate(el => el === document.activeElement));
        await page.keyboard.press('Tab');
        const checkbox = dialog.getByRole('checkbox');
        assert.ok(await checkbox.evaluate(el => el === document.activeElement && getComputedStyle(el).outlineStyle !== 'none'));
        const field = await checkbox.boundingBox();
        const label = await dialog.getByText('I confirm deletion of this account.', { exact: true }).boundingBox();
        assert.ok(field.width >= 16 && field.width <= 20 && field.height >= 16 && field.height <= 20);
        assert.ok(field.x + field.width < label.x && Math.abs(field.y - label.y) < 6);
        await page.keyboard.press('Space');
        assert.ok(await checkbox.isChecked());
        await dialog.getByText('I confirm deletion of this account.', { exact: true }).click();
        assert.ok(!(await checkbox.isChecked()));
        assert.ok(await button('Delete Account').isDisabled());
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden' });
        assert.ok(await target.evaluate(el => el === document.activeElement));
      }
      await x.open();
      await button('Cancel').click();
      assert.equal(state.deletes.length, 0);
      for (const [label, value, query] of [
        ['User status', 'ACTIVE', 'status=ACTIVE'],
        ['Auth provider', 'LOCAL', 'authProvider=LOCAL'],
      ]) {
        await Promise.all([
          page.waitForResponse(response => response.url().includes(query)),
          page.locator(`select[aria-label="${label}"]`).selectOption(value, { force: true }),
        ]);
      }
      await page.getByRole('searchbox', { name: 'Search users' }).fill('fixture');
      await page.waitForResponse(response => response.url().includes('/api/admin/users?search=fixture'));
      await x.open();
      assert.ok(await button('Delete Account').isDisabled());
      await dialog.getByRole('checkbox').check();
      const response = page.waitForResponse(r => r.request().method() === 'DELETE');
      await button('Delete Account').evaluate(el => { el.click(); el.click(); });
      await dialog.getByRole('status').getByText('Deleting user account…').waitFor();
      await page.keyboard.press('Escape');
      assert.ok(await dialog.isVisible());
      assert.equal((await response).status(), 200);
      await page.getByText('User account deleted.', { exact: true }).waitFor();
      await target.waitFor({ state: 'hidden' });
      assert.deepEqual(state.deletes, [{ path: '/api/admin/users/12', query: '', body: null, auth: 'Bearer fixture' }]);
      assert.deepEqual(state.userQueries.at(-1), { search: 'fixture', status: 'ACTIVE', authProvider: 'LOCAL' });
      const reads = state.overviewReads;
      await button('Overview').click();
      await page.getByText('Monthly System Usage', { exact: true }).waitFor();
      assert.equal(state.overviewReads, reads + 1);
    } finally { await x.close(); }
  });

  for (const [record, name, email] of [
    [{ ...other, fullName: 'string', email: 'string' }, 'string', 'string'],
    [{ ...other, fullName: ' ', username: 'Fixture username', email: null }, 'Fixture username', 'Not available'],
    [{ ...other, fullName: null, email: '' }, 'Not available', 'Not available'],
  ]) {
    await t.test(`selected account display: ${name}`, async () => {
      const x = await setup({ record });
      try {
        await x.open();
        const details = await x.dialog.locator('p').first().innerText();
        assert.equal(details, `Account: ${name}\nEmail: ${email}\nUser ID: 12`);
        assert.equal(x.state.deletes.length, 0);
      } finally { await x.close(); }
    });
  }

  for (const [status, body, message] of [
    [409, { message: 'User is president of an active club' }, 'This user cannot be deleted while serving as president of an active club.'],
    [400, { error: 'Không thể tự xóa chính mình' }, 'You cannot delete your own account.'],
    [400, {}, 'The server rejected this deletion.'],
    [404, {}, 'This account was not found.'],
    [409, {}, 'The server rejected this deletion.'],
    [500, { message: 'ERROR: update or delete violates foreign key constraint on table club_tasks', trace: 'Internal fixture stack' }, 'The server could not confirm deletion.'],
    ['network', {}, 'The server could not be reached.'],
    ['timeout', {}, 'The request timed out.'],
  ]) {
    await t.test(`${status}: ${message}`, async () => {
      const x = await setup({ status, body });
      try {
        await x.open();
        await x.confirm();
        await x.dialog.getByRole('alert').getByText(message, { exact: false }).waitFor({ timeout: 13000 });
        assert.equal(x.state.deletes.length, 1);
        assert.ok(!/club_tasks|foreign key|Internal fixture stack/.test(await x.dialog.innerText()));
        await x.button('Cancel').click();
        assert.ok(await x.target.isVisible());
      } finally { await x.close(); }
    });
  }

  for (const [status, path] of [[401, '/login'], [403, '/select-club']]) {
    await t.test(`HTTP ${status} preserves AdminRoute handling`, async () => {
      const x = await setup({ status });
      try {
        await x.open();
        await x.confirm();
        await x.page.waitForURL('**' + path);
        assert.equal(x.state.deletes.length, 1);
        assert.equal(await x.page.getByText('User account deleted.').count(), 0);
      } finally { await x.close(); }
    });
  }

  await t.test('successful deletion followed by list refresh failure', async () => {
    const x = await setup({ refreshError: true });
    try {
      await x.open();
      await x.confirm();
      await x.page.getByText('User account deleted.', { exact: true }).waitFor();
      await x.page.getByRole('alert').filter({ hasText: 'The account was deleted, but the user list could not be refreshed.' }).waitFor();
      assert.ok(await x.button('Retry').isVisible());
      await x.dialog.waitFor({ state: 'hidden' });
      assert.equal(x.state.deletes.length, 1);
    } finally { await x.close(); }
  });

  await t.test('a pre-deletion search response cannot restore the deleted row', async () => {
    const x = await setup({ staleRead: true });
    try {
      await x.page.getByRole('searchbox', { name: 'Search users' }).fill('fixture');
      const pendingSearch = x.page.waitForRequest(request => request.url().includes('/api/admin/users?search=fixture'));
      await x.open();
      await pendingSearch;
      await x.confirm();
      await x.page.getByText('User account deleted.', { exact: true }).waitFor();
      await x.page.getByText('Admin Fixture', { exact: true }).waitFor();
      await x.page.waitForTimeout(1000);
      assert.equal(await x.target.count(), 0);
      assert.equal(x.state.deletes.length, 1);
    } finally { await x.close(); }
  });

  await t.test('unverified identity fails closed and USER cannot reach Users', async () => {
    const x = await setup({ verified: false });
    try {
      assert.ok(await x.target.isDisabled());
      assert.equal(x.state.deletes.length, 0);
    } finally { await x.close(); }
    const user = await setup({ role: 'USER' });
    try {
      await user.page.waitForURL('**/select-club');
      assert.equal(await user.button('Delete User').count(), 0);
      assert.equal(user.state.deletes.length, 0);
    } finally { await user.close(); }
  });
});
