import { Page, expect } from '@playwright/test';

export class AuthHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * 执行登录操作
   */
  async login(email?: string, password?: string) {
    const username = email || 'xxx@gmail.com';
    const userPassword = password || 'xxx';

    // 导航到登录页面
    await this.page.goto('/signin');
    await this.page.waitForLoadState('networkidle');

    // 根据实际页面结构填写登录表单
    await this.page.getByRole('textbox', { name: 'Email address' }).fill(username);
    await this.page.getByRole('textbox', { name: 'Password Forgot your password?' }).fill(userPassword);

    // 点击登录按钮
    await this.page.getByRole('button', { name: 'Sign in' }).click();

    // 等待登录成功
    await this.page.waitForURL('**/apps', { timeout: 10000 });
    await this.page.waitForLoadState('networkidle');

    // 验证登录成功 - 检查Studio导航是否可见
    await expect(this.page.getByRole('link', { name: 'Studio' })).toBeVisible();
  }

  /**
   * 检查是否已登录
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.goto('/apps');
      await this.page.waitForLoadState('networkidle', { timeout: 5000 });
      
      // 检查是否在应用页面且Studio导航可见
      const currentUrl = this.page.url();
      const studioLink = this.page.getByRole('link', { name: 'Studio' });
      const isStudioVisible = await studioLink.isVisible().catch(() => false);
      
      return currentUrl.includes('/apps') && !currentUrl.includes('/signin') && isStudioVisible;
    } catch {
      return false;
    }
  }

  /**
   * 确保用户已登录
   */
  async ensureLoggedIn() {
    const loggedIn = await this.isLoggedIn();
    if (!loggedIn) {
      await this.login();
    }
  }

  /**
   * 退出登录
   */
  async logout() {
    try {
      // 点击用户菜单（右上角的头像）
      await this.page.getByRole('button', { name: /D daniel/ }).click();
      
      // 查找并点击退出登录选项
      await this.page.getByText('Sign Out').click();
      
      // 等待重定向到登录页面
      await this.page.waitForURL('**/signin', { timeout: 5000 });
    } catch {
      // 如果找不到退出按钮，清除存储状态
      await this.page.context().clearCookies();
      await this.page.context().clearPermissions();
      // 手动导航到登录页面
      await this.page.goto('/signin');
    }
  }
}
