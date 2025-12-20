import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HBAnnotation } from './hb-annotation';

// Mock chrome.runtime API
const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
  },
};

globalThis.chrome = mockChrome as any;

describe('HBAnnotation', () => {
  let annotation: HBAnnotation;

  beforeEach(() => {
    annotation = new HBAnnotation();
    vi.clearAllMocks();
  });

  it('should have empty dataUrl initially', () => {
    expect(annotation['dataUrl']).toBe('');
  });

  describe('_loadScreenshotFromStorage', () => {
    it('should load screenshot from storage', async () => {
      const mockDataUrl = 'data:image/png;base64,mock';
      mockChrome.runtime.sendMessage.mockResolvedValue({
        dataUrl: mockDataUrl,
      });

      await annotation['_loadScreenshotFromStorage']();

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'GET_SCREENSHOT',
      });
      expect(annotation['dataUrl']).toBe(mockDataUrl);
    });

    it('should handle missing dataUrl in response', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue({});

      await annotation['_loadScreenshotFromStorage']();

      expect(annotation['dataUrl']).toBe('');
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockChrome.runtime.sendMessage.mockRejectedValue(
        new Error('Failed to load screenshot')
      );

      await annotation['_loadScreenshotFromStorage']();

      expect(annotation['dataUrl']).toBe('');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load screenshot:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('_handleDownload', () => {
    it('should call download on canvas element with formatted filename', () => {
      const mockCanvas = {
        download: vi.fn(),
      };

      const mockShadowRoot = {
        querySelector: vi.fn().mockReturnValue(mockCanvas),
      };

      Object.defineProperty(annotation, 'shadowRoot', {
        value: mockShadowRoot,
        writable: true,
      });

      // Mock Date to get predictable filename
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-12-15T21:00:00Z'));

      annotation['_handleDownload']();

      expect(mockCanvas.download).toHaveBeenCalledWith(
        expect.stringMatching(
          /^bug \d{4}-\d{2}-\d{2} at \d{2}-\d{2}-\d{2}\.jpg$/
        )
      );
    });

    it('should handle missing canvas element', () => {
      const mockShadowRoot = {
        querySelector: vi.fn().mockReturnValue(null),
      };

      Object.defineProperty(annotation, 'shadowRoot', {
        value: mockShadowRoot,
        writable: true,
      });

      expect(() => annotation['_handleDownload']()).not.toThrow();
    });
  });
});
