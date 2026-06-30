import { test, expect, request as pwRequest, Page } from '@playwright/test';

const API = 'http://localhost:8090';

// 通过后端 API 预置数据（注册 + 充值），再用浏览器从用户视角验证 UI。
async function api() {
  return pwRequest.newContext({ baseURL: API });
}

async function registerViaApi(role: string, suffix: string) {
  const ctx = await api();
  const res = await ctx.post('/api/v1/register', {
    data: {
      username: `${role}_${suffix}`,
      email: `${role}_${suffix}@e2e.com`,
      password: 'pass123',
      nickname: role === 'player' ? '小柚E2E' : role === 'provider' ? '晚风E2E' : '星轨E2E',
      role,
    },
  });
  const body = await res.json();
  await ctx.dispose();
  return { token: body.data.token as string, id: body.data.user.id as number };
}

// 浏览器内登录（绕过 UI 直接写 token），随后访问目标页
async function loginAs(page: Page, token: string) {
  await page.goto('/auth/login');
  await page.evaluate((t) => localStorage.setItem('token', t), token);
}

test('玩家通过 UI 注册并进入控制台', async ({ page }) => {
  const s = Date.now().toString();
  await page.goto('/auth/register');
  // antd Form name="register" → 字段 id 带 register_ 前缀
  await page.locator('#register_username').fill(`uiplayer_${s}`);
  await page.locator('#register_email').fill(`uiplayer_${s}@e2e.com`);
  await page.locator('#register_password').fill('pass123');
  await page.locator('#register_confirm').fill('pass123');
  // 角色默认玩家；提交
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  await expect(page.getByText('控制台').first()).toBeVisible();
});

test('玩家查看由服务者充值后的余额', async ({ page }) => {
  const s = Date.now().toString();
  const player = await registerViaApi('player', s);
  const provider = await registerViaApi('provider', s);

  // 服务者通过 API 给玩家充值 200
  const ctx = await api();
  await ctx.post('/api/v1/provider/balances', {
    headers: { Authorization: `Bearer ${provider.token}` },
    data: { player_id: player.id, provider_id: provider.id, type: 'money', amount: 200, description: '充值' },
  });
  await ctx.dispose();

  await loginAs(page, player.token);
  await page.goto('/dashboard');
  await expect(page.getByText('¥200.00').first()).toBeVisible({ timeout: 15000 });

  await page.goto('/player/balances');
  await expect(page.getByText('晚风E2E').first()).toBeVisible();
  await expect(page.getByText('¥200.00').first()).toBeVisible();
});

test('服务者通过充值弹窗给玩家加余额', async ({ page }) => {
  const s = Date.now().toString();
  const player = await registerViaApi('player', s);
  const provider = await registerViaApi('provider', s);
  // 先建立一条余额，使玩家出现在服务者的账户管理页
  const ctx = await api();
  await ctx.post('/api/v1/provider/balances', {
    headers: { Authorization: `Bearer ${provider.token}` },
    data: { player_id: player.id, provider_id: provider.id, type: 'money', amount: 100 },
  });
  await ctx.dispose();

  await loginAs(page, provider.token);
  await page.goto('/provider/accounts');
  await expect(page.getByText('小柚E2E').first()).toBeVisible({ timeout: 15000 });

  // 打开充值弹窗
  await page.getByRole('button', { name: '充值' }).first().click();
  await page.locator('input[inputmode="decimal"]').fill('50');
  await page.getByRole('button', { name: /下一步/ }).click();
  await page.getByRole('button', { name: /确认提交/ }).click();

  // 成功提示 + 余额更新到 150
  await expect(page.getByText(/已为.*充值/).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('¥150.00').first()).toBeVisible();
});
