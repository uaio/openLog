import type { DataBus } from '../core/DataBus.js';

/** 截图上报数据 */
export interface ScreenshotData {
  timestamp: number;
  dataUrl: string;   // base64 PNG
  width: number;
  height: number;
  url: string;
  title: string;
}

/**
 * 截图采集器
 * 使用 html2canvas（动态 import，避免 bundle 膨胀）
 * 截图通过 DataBus 'screenshot' 事件上报
 */
export class ScreenshotCollector {
  private bus: DataBus;

  constructor(bus: DataBus) {
    this.bus = bus;
  }

  async capture(): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: false,
        scale: Math.min(window.devicePixelRatio || 1, 2), // 最高 2x，避免过大
        logging: false,
        imageTimeout: 5000,
      });

      const dataUrl = canvas.toDataURL('image/png');
      this.bus.emit('screenshot', {
        timestamp: Date.now(),
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        url: window.location.href,
        title: document.title,
      });
    } catch (err) {
      console.warn('[openLog] Screenshot failed:', err);
    }
  }
}
