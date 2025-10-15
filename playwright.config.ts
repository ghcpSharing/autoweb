import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置文件
 * 配置测试运行选项、浏览器设置、视频录制等
 */
export default defineConfig({
  // 测试目录
  testDir: './src/cases',
  
  // 测试超时时间
  timeout: 120000, // 2分钟
  expect: {
    timeout: 10000, // 断言超时 10秒
  },
  
  // 失败时的重试次数
  retries: 0,
  
  // 并行执行的worker数量
  workers: 1,
  
  // 报告生成器
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  // 全局配置
  use: {
    // 基础URL（如果需要）
    baseURL: 'https://dify.xxx.com',
    
    // 浏览器操作超时
    actionTimeout: 30000,
    
    // 导航超时
    navigationTimeout: 30000,
    
    // 截图配置：失败时自动截图
    screenshot: 'only-on-failure',
    
    // 视频录制：失败时保留视频
    video: 'on',
    
    // Trace录制：失败时保留
    trace: 'retain-on-failure',
    
    // 视口大小
    viewport: { width: 1920, height: 1080 },
    
    // 忽略HTTPS错误
    ignoreHTTPSErrors: true,
  },
  
  // 项目配置：使用Chrome浏览器
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // 使用保存的认证状态
        storageState: 'auth/user.json',
      },
    },
  ],
  
  // 输出目录
  outputDir: 'test-results/',
});
