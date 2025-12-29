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

      await annotation['loadScreenshotFromStorage']();

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'GET_SCREENSHOT',
      });
      expect(annotation['dataUrl']).toBe(mockDataUrl);
    });

    it('should handle missing dataUrl in response', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue({});

      await annotation['loadScreenshotFromStorage']();

      expect(annotation['dataUrl']).toBe('');
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockChrome.runtime.sendMessage.mockRejectedValue(
        new Error('Failed to load screenshot')
      );

      await annotation['loadScreenshotFromStorage']();

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

      annotation['handleDownload']();

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

      expect(() => annotation['handleDownload']()).not.toThrow();
    });
  });

  describe('handleToolChange', () => {
    it('should update activeTool when tool-change event is fired', () => {
      const event = new CustomEvent('tool-change', {
        detail: { tool: 'line' },
      });

      annotation['handleToolChange'](event);

      expect(annotation['activeTool']).toBe('line');
    });

    it('should handle different tool types', () => {
      const textEvent = new CustomEvent('tool-change', {
        detail: { tool: 'text' },
      });

      annotation['handleToolChange'](textEvent);
      expect(annotation['activeTool']).toBe('text');

      const rectangleEvent = new CustomEvent('tool-change', {
        detail: { tool: 'rectangle' },
      });

      annotation['handleToolChange'](rectangleEvent);
      expect(annotation['activeTool']).toBe('rectangle');
    });
  });

  describe('render', () => {
    it('should render toolbar and canvas when dataUrl is set', async () => {
      annotation['dataUrl'] = 'data:image/png;base64,test';
      document.body.appendChild(annotation);
      await annotation.updateComplete;

      expect(annotation.shadowRoot).toBeDefined();
      const toolbar = annotation.shadowRoot?.querySelector('hb-toolbar');
      const canvas = annotation.shadowRoot?.querySelector('hb-canvas');

      expect(toolbar).toBeTruthy();
      expect(canvas).toBeTruthy();
    });

    it('should render loading message when dataUrl is empty', async () => {
      annotation['dataUrl'] = '';
      document.body.appendChild(annotation);
      await annotation.updateComplete;

      const content = annotation.shadowRoot?.textContent;
      expect(content).toContain('No screenshot loaded');
    });
  });

  describe('connectedCallback', () => {
    it('should call loadScreenshotFromStorage when connected', () => {
      const spy = vi.spyOn(annotation as any, 'loadScreenshotFromStorage');
      document.body.appendChild(annotation);

      expect(spy).toHaveBeenCalled();
    });
  });
});
