import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HBPopup } from './hb-popup';

// Mock chrome APIs
const mockChrome = {
  tabs: {
    query: vi.fn(),
    captureVisibleTab: vi.fn(),
    create: vi.fn(),
  },
  runtime: {
    sendMessage: vi.fn(),
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
  },
};

globalThis.chrome = mockChrome as any;

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

// Mock window.close
globalThis.window.close = vi.fn();

describe('HBPopup', () => {
  let popup: HBPopup;

  beforeEach(() => {
    popup = new HBPopup();
    vi.clearAllMocks();
  });

  describe('_gatherEnvironmentDetails', () => {
    it('should gather environment details from active tab', async () => {
      const mockTab = {
        id: 123,
        url: 'https://example.com',
      };

      mockChrome.tabs.query.mockResolvedValue([mockTab]);

      await popup['_gatherEnvironmentDetails']();

      expect(mockChrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });

      expect(popup['environmentDetails']).toBeTruthy();
      expect(popup['environmentDetails']?.url).toBe('https://example.com');
    });

    it('should handle errors gracefully', async () => {
      mockChrome.tabs.query.mockRejectedValue(new Error('Tab query failed'));

      await popup['_gatherEnvironmentDetails']();

      expect(popup['environmentDetails']).toBeNull();
    });

    it('should not gather details if no tab URL or ID', async () => {
      mockChrome.tabs.query.mockResolvedValue([{}]);

      await popup['_gatherEnvironmentDetails']();

      expect(popup['environmentDetails']).toBeNull();
    });
  });

  describe('_copyToClipboard', () => {
    it('should copy environment details to clipboard', async () => {
      popup['environmentDetails'] = {
        dateAndTime: '2025-12-15 21:00:00',
        url: 'https://example.com',
        visibleArea: '1920 x 1080 px',
        displayResolution: '1920 x 1080 px',
        devicePixelRatio: '1',
        browser: 'Chrome 120',
        os: 'macOS',
      };

      await popup['_copyToClipboard']();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('Date and time: 2025-12-15 21:00:00')
      );
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('URL: https://example.com')
      );
    });

    it('should not copy if no environment details', async () => {
      popup['environmentDetails'] = null;

      await popup['_copyToClipboard']();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
  });

  describe('_annotateScreenshot', () => {
    it('should capture screenshot and open editor tab', async () => {
      const mockTab = {
        id: 123,
        windowId: 456,
      };

      mockChrome.tabs.query.mockResolvedValue([mockTab]);
      mockChrome.tabs.captureVisibleTab.mockResolvedValue(
        'data:image/png;base64,mock'
      );

      await popup['_annotateScreenshot']();

      expect(mockChrome.tabs.captureVisibleTab).toHaveBeenCalledWith(456, {
        format: 'png',
      });
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'STORE_SCREENSHOT',
        dataUrl: 'data:image/png;base64,mock',
      });
      expect(mockChrome.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://mock-id/tab.html',
      });
      expect(window.close).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockChrome.tabs.query.mockRejectedValue(
        new Error('Screenshot capture failed')
      );

      await popup['_annotateScreenshot']();

      expect(mockChrome.tabs.captureVisibleTab).not.toHaveBeenCalled();
    });

    it('should not capture if no tab ID or window ID', async () => {
      mockChrome.tabs.query.mockResolvedValue([{}]);

      await popup['_annotateScreenshot']();

      expect(mockChrome.tabs.captureVisibleTab).not.toHaveBeenCalled();
    });
  });
});
