import { test as setup, expect } from '@playwright/test';

const authFile = 'auth/user.json';

setup('authenticate', async ({ page }) => {
  // 导航到登录页面
  await page.goto('/signin');
  
  // 等待登录页面加载
  await page.waitForLoadState('networkidle');
  
  // 根据实际探索的页面结构填写登录信息
  await page.getByRole('textbox', { name: 'Email address' }).fill('xxx@gmail.com');
  await page.getByRole('textbox', { name: 'Password Forgot your password?' }).fill('xxx');
  
  // 点击登录按钮
  await page.getByRole('button', { name: 'Sign in' }).click();
  
  // 等待登录成功，确认跳转到应用页面
  await page.waitForURL('**/apps');
  await page.waitForLoadState('networkidle');
  
  // 验证登录成功 - 检查Studio导航链接是否可见
  await expect(page.getByRole('link', { name: 'Studio' })).toBeVisible();
  
  // 保存认证状态
  await page.context().storageState({ path: authFile });
});
