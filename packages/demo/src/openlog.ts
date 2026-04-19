/**
 * openLog SDK 初始化
 *
 * 修改 SERVER_URL 为你的局域网地址（运行 `npx openlog` 后终端会打印）
 * 如果不需要远程监控，将 SERVER_URL 设为 undefined
 */

const SERVER_URL = (import.meta.env.VITE_OPENLOG_SERVER as string) || undefined;

declare global {
  interface Window {
    OpenLog: any;
    __openlog__: any;
  }
}

let initialized = false;

export async function initOpenLog() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // 动态加载 SDK（CDN）
  return new Promise<void>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/openlog@latest/dist/openlog.iife.js';
    script.onload = () => {
      if (window.OpenLog) {
        window.__openlog__ = new window.OpenLog({
          projectId: 'openlog-demo',
          server: SERVER_URL,
          lang: 'zh',
        });
        console.log('[openLog] SDK initialized', SERVER_URL ? `→ ${SERVER_URL}` : '(local only)');
      }
      resolve();
    };
    script.onerror = () => {
      console.warn('[openLog] CDN load failed, running without SDK');
      resolve();
    };
    document.head.appendChild(script);
  });
}
