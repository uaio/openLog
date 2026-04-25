import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'openLog',
  description: 'Mobile H5 Debugging Tool',
  base: '/openLog/',

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/' },
          { text: 'API', link: '/api/' },
          { text: 'GitHub', link: 'https://github.com/uaio/openLog' },
        ],
        sidebar: {
          '/guide/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Introduction', link: '/guide/' },
                { text: 'Quick Start', link: '/guide/quick-start' },
                { text: 'Configuration', link: '/guide/configuration' },
              ],
            },
            {
              text: 'Features',
              items: [
                { text: 'Console Logs', link: '/guide/console' },
                { text: 'Network Requests', link: '/guide/network' },
                { text: 'Storage', link: '/guide/storage' },
                { text: 'Performance', link: '/guide/performance' },
                { text: 'Mock & Throttle', link: '/guide/mock' },
                { text: 'Health Checks', link: '/guide/health' },
                { text: 'MCP Integration', link: '/guide/mcp' },
              ],
            },
          ],
          '/api/': [
            {
              text: 'API Reference',
              items: [
                { text: 'Overview', link: '/api/' },
                { text: 'SDK', link: '/api/sdk' },
                { text: 'CLI', link: '/api/cli' },
                { text: 'Server', link: '/api/server' },
              ],
            },
          ],
        },
        socialLinks: [{ icon: 'github', link: 'https://github.com/uaio/openLog' }],
        editLink: {
          pattern: 'https://github.com/uaio/openLog/edit/main/docs/:path',
          text: 'Edit this page on GitHub',
        },
      },
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: {
        nav: [
          { text: '指南', link: '/zh/guide/' },
          { text: 'API', link: '/zh/api/' },
          { text: 'GitHub', link: 'https://github.com/uaio/openLog' },
        ],
        sidebar: {
          '/zh/guide/': [
            {
              text: '快速入门',
              items: [
                { text: '介绍', link: '/zh/guide/' },
                { text: '快速开始', link: '/zh/guide/quick-start' },
                { text: '配置', link: '/zh/guide/configuration' },
              ],
            },
            {
              text: '功能',
              items: [
                { text: '控制台日志', link: '/zh/guide/console' },
                { text: '网络请求', link: '/zh/guide/network' },
                { text: '存储', link: '/zh/guide/storage' },
                { text: '性能监控', link: '/zh/guide/performance' },
                { text: '接口模拟与节流', link: '/zh/guide/mock' },
                { text: '健康检查', link: '/zh/guide/health' },
                { text: 'MCP 集成', link: '/zh/guide/mcp' },
              ],
            },
          ],
          '/zh/api/': [
            {
              text: 'API 参考',
              items: [
                { text: '概览', link: '/zh/api/' },
                { text: 'SDK', link: '/zh/api/sdk' },
                { text: 'CLI', link: '/zh/api/cli' },
                { text: 'Server', link: '/zh/api/server' },
              ],
            },
          ],
        },
        socialLinks: [{ icon: 'github', link: 'https://github.com/uaio/openLog' }],
        editLink: {
          pattern: 'https://github.com/uaio/openLog/edit/main/docs/:path',
          text: '在 GitHub 上编辑此页',
        },
      },
    },
  },
});
