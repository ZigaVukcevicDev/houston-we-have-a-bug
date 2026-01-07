import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HBPopup } from './hb-popup';

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

globalThis.window.close = vi.fn();

describe('HBPopup', () => {
  let popup: HBPopup;

  beforeEach(() => {
    popup = new HBPopup();
    vi.clearAllMocks();
  });

  describe('Button handler wiring', () => {
    it('should have annotateScreenshot method available for button click', () => {
      // Verify that the method exists and can be called
      expect(typeof popup['annotateScreenshot']).toBe('function');
    });
  });

  describe('annotateScreenshot', () => {
    it('should capture screenshot and open editor tab', async () => {
      const mockTab = {
        id: 123,
        windowId: 456,
        url: 'https://example.com',
      };

      mockChrome.tabs.query.mockResolvedValue([mockTab]);
      mockChrome.tabs.captureVisibleTab.mockResolvedValue(
        'data:image/png;base64,mock'
      );

      await popup['annotateScreenshot']();

      expect(mockChrome.tabs.captureVisibleTab).toHaveBeenCalledWith(456, {
        format: 'png',
      });
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'STORE_SCREENSHOT',
        dataUrl: 'data:image/png;base64,mock',
        systemInfo: expect.objectContaining({
          url: 'https://example.com',
        }),
      });
      expect(window.close).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockChrome.tabs.query.mockRejectedValue(
        new Error('Screenshot capture failed')
      );

      await popup['annotateScreenshot']();

      expect(mockChrome.tabs.captureVisibleTab).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to capture screenshot:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should not capture if no tab ID or window ID', async () => {
      mockChrome.tabs.query.mockResolvedValue([{}]);

      await popup['annotateScreenshot']();

      expect(mockChrome.tabs.captureVisibleTab).not.toHaveBeenCalled();
    });
  });
});
