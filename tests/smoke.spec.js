// 冒煙測試：頁面載入沒有 JS 錯誤、一鍵示範流程跑完、預約不撞時段、備註不會被執行、手機寬度沒有橫向捲動
const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const url = (p, hash = '', query = '') => pathToFileURL(path.join(ROOT, p)).href + query + hash;

// 外部資源（若有）在測試裡一律回空內容，測試結果不受網路影響
async function open(page, p, hash, query) {
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.route(/^https?:\/\//, r => r.fulfill({ status: 200, body: '' }));
  await page.goto(url(p, hash, query));
  return errors;
}

const noHScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

// 走一次客人預約流程：剪髮 → 指定 Ken → 指定日 → 第一個空檔 →（備註）→ 確認
async function bookOnce(page, { svc = 'cut', des = 'ken', day = 4, note = '' } = {}) {
  await page.click(`[data-a="pickSvc"][data-id="${svc}"]`);
  await page.click(`[data-a="pickDes"][data-id="${des}"]`);
  await page.click(`[data-a="pickDay"][data-d="${day}"]`);
  const slot = page.locator('.slot').first();
  const start = await slot.getAttribute('data-s');
  await slot.click();
  if (note) await page.fill('#note', note);
  await page.click('[data-a="confirmBook"]');
  return +start;
}

test.describe('說明頁 index.html', () => {
  test('載入沒有 JS 錯誤、內容與連結正確', async ({ page }) => {
    const errors = await open(page, 'index.html');
    await expect(page.locator('h1')).toContainText('做客人的頭');
    expect(await page.locator('a[href="demo/index.html#auto"]').count()).toBeGreaterThan(0);
    await expect(page.locator('a[href="https://line.me/ti/p/xzHT2IywOM"]').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('手機 375px 沒有橫向捲動', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const errors = await open(page, 'index.html');
    expect(await noHScroll(page)).toBe(true);
    expect(errors).toEqual([]);
  });
});

test.describe('示範 demo/index.html', () => {
  test('載入沒有 JS 錯誤，設定檔內容有帶進畫面', async ({ page }) => {
    const errors = await open(page, 'demo/index.html');
    await expect(page.locator('#shopLogo')).toContainText('示範美學館');
    const n = await page.evaluate(() => window.BEAUTY_CONFIG.services.length);
    await expect(page.locator('[data-a="pickSvc"]')).toHaveCount(n);
    expect(errors).toEqual([]);
  });

  test('一鍵示範完整跑完：Ken 請假當天變成 0 筆、沒有任何預約重疊', async ({ page }) => {
    const errors = await open(page, 'demo/index.html', '#auto', '?fast');
    await page.waitForFunction(() => window.__autoDone === true, null, { timeout: 30000 });
    const r = await page.evaluate(() => {
      const B = window.__beauty, cfg = B.config, S = B.S();
      const day = cfg.demo.leaveDay, did = cfg.demo.leaveDesigner;
      return {
        kenToday: S.bookings.filter(b => b.des === did && b.day === day && b.status !== 'cancel').length,
        pending: S.bookings.filter(b => b.status === 'pending').length,
        leaves: S.leaves.length,
        conflicts: B.conflicts().length,
        msgs: S.msgs.length
      };
    });
    expect(r.kenToday).toBe(0);
    expect(r.pending).toBe(0);
    expect(r.leaves).toBe(1);
    expect(r.msgs).toBeGreaterThan(0);
    expect(r.conflicts).toBe(0);
    expect(errors).toEqual([]);
  });

  test('客人預約後，同一時段不會再出現，且不與其他預約重疊', async ({ page }) => {
    const errors = await open(page, 'demo/index.html');
    const before = await page.evaluate(() => window.__beauty.conflicts().length);
    expect(before).toBe(0);
    const start = await bookOnce(page);
    await expect(page.locator('#app')).toContainText('預約成功');
    // 回到第一步，用同樣條件再看一次時段
    await page.click('[data-a="again"]');
    await page.click('[data-a="pickSvc"][data-id="cut"]');
    await page.click('[data-a="pickDes"][data-id="ken"]');
    await page.click('[data-a="pickDay"][data-d="4"]');
    await expect(page.locator('.slot').first()).toBeVisible();
    await expect(page.locator(`.slot[data-s="${start}"]`)).toHaveCount(0);
    // 服務時長 60 分鐘：與剛訂的時段重疊的格子也不能出現
    const starts = await page.locator('.slot').evaluateAll(els => els.map(e => +e.dataset.s));
    for (const s of starts) expect(s >= start + 60 || s + 60 <= start).toBe(true);
    expect(await page.evaluate(() => window.__beauty.conflicts().length)).toBe(0);
    expect(errors).toEqual([]);
  });

  test('連續預約多筆（含長時間染髮），任何預約之間都沒有重疊', async ({ page }) => {
    const errors = await open(page, 'demo/index.html');
    for (const [svc, des, day] of [['dye', 'amy', 3], ['cut', 'any', 3], ['gel', 'any', 4], ['refill', 'any', 4], ['dye', 'any', 5]]) {
      if (await page.locator('[data-a="again"]').count()) await page.click('[data-a="again"]');
      await bookOnce(page, { svc, des, day });
      await expect(page.locator('#app')).toContainText('預約成功');
    }
    expect(await page.evaluate(() => window.__beauty.conflicts().length)).toBe(0);
    expect(errors).toEqual([]);
  });

  test('備註欄輸入 HTML 不會被執行', async ({ page }) => {
    const errors = await open(page, 'demo/index.html');
    await bookOnce(page, { note: '<img src=x onerror="window.__x=1">' });
    await expect(page.locator('#app')).toContainText('預約成功');
    // 備註有顯示成文字，而且沒有真的生出 img 標籤
    await expect(page.locator('#app')).toContainText('<img src=x');
    expect(await page.locator('#app img').count()).toBe(0);
    expect(await page.evaluate(() => window.__x)).toBeUndefined();
    // 切到老闆總表與訊息紀錄，也不會被執行
    await page.click('#r-owner');
    await page.click('[data-a="otab"][data-t="log"]');
    expect(await page.evaluate(() => window.__x)).toBeUndefined();
    expect(errors).toEqual([]);
  });

  test('手機 375px 沒有橫向捲動（客人、設計師、老闆各分頁）', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const errors = await open(page, 'demo/index.html');
    for (const t of ['book', 'mine', 'wallet', 'msgs']) {
      await page.click(`[data-a="ctab"][data-t="${t}"]`);
      expect(await noHScroll(page), 'cust ' + t).toBe(true);
    }
    await page.click('#r-des');
    expect(await noHScroll(page), 'designer').toBe(true);
    await page.click('#r-owner');
    for (const t of ['grid', 'recall', 'stored', 'payroll', 'gap', 'log']) {
      await page.click(`[data-a="otab"][data-t="${t}"]`);
      expect(await noHScroll(page), 'owner ' + t).toBe(true);
    }
    expect(errors).toEqual([]);
  });
});
