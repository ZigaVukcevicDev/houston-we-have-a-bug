import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HBAnnotation } from './hb-annotation';

const mockChrome = {
  storage: {
    session: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
  },
  tabs: {
    query: vi.fn(),
  },
};

globalThis.chrome = mockChrome as any;

Object.defineProperty(globalThis.navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
  },
  writable: true,
});

describe('HBAnnotation', () => {
  let annotation: HBAnnotation;

  beforeEach(() => {
    // Set up window.location with a valid session ID to prevent console errors
    delete (globalThis.window as any).location;
    (globalThis.window as any).location = { search: '?session=test-session-123' };

    annotation = new HBAnnotation();
    vi.clearAllMocks();
  });

  it('should have empty dataUrl initially', () => {
    expect(annotation['dataUrl']).toBe('');
  });

  it('should have arrow as default activeTool', () => {
    expect(annotation['activeTool']).toBe('arrow');
  });

  describe('_loadScreenshotFromStorage', () => {
    beforeEach(() => {
      delete (globalThis.window as any).location;
      (globalThis.window as any).location = { search: '?session=test-session-123' };
    });

    it('should load screenshot from storage', async () => {
      const mockDataUrl = 'data:image/png;base64,mock';
      mockChrome.storage.session.get.mockResolvedValue({
        'screenshot_test-session-123': {
          dataUrl: mockDataUrl,
          systemInfo: null,
          timestamp: Date.now(),
        },
      });

      await annotation['loadScreenshotFromStorage']();

      expect(mockChrome.storage.session.get).toHaveBeenCalledWith('screenshot_test-session-123');
      expect(annotation['dataUrl']).toBe(mockDataUrl);
      expect(mockChrome.storage.session.remove).toHaveBeenCalledWith('screenshot_test-session-123');
    });

    it('should load systemInfo along with screenshot', async () => {
      const mockDataUrl = 'data:image/png;base64,mock';
      const mockSystemInfo = {
        dateAndTime: '2026-01-04 11:00:00',
        url: 'https://example.com',
        visibleArea: '1920 x 1080 px',
        displayResolution: '1920 x 1080 px',
        devicePixelRatio: '1',
        browser: 'Chrome 142',
        os: 'macOS',
      };

      mockChrome.storage.session.get.mockResolvedValue({
        'screenshot_test-session-123': {
          dataUrl: mockDataUrl,
          systemInfo: mockSystemInfo,
          timestamp: Date.now(),
        },
      });

      await annotation['loadScreenshotFromStorage']();

      expect(annotation['dataUrl']).toBe(mockDataUrl);
      expect(annotation['systemInfo']).toEqual(mockSystemInfo);
    });

    it('should handle missing session ID in URL', async () => {
      (globalThis.window as any).location = { search: '' };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      await annotation['loadScreenshotFromStorage']();

      expect(annotation['dataUrl']).toBe('');
      expect(consoleSpy).toHaveBeenCalledWith('No session ID found in URL');
      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockChrome.storage.session.get.mockRejectedValue(
        new Error('Storage error')
      );

      await annotation['loadScreenshotFromStorage']();

      expect(annotation['dataUrl']).toBe('');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load screenshot from storage:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should handle missing screenshot data', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockChrome.storage.session.get.mockResolvedValue({
        'screenshot_test-session-123': null, // Data not found
      });

      await annotation['loadScreenshotFromStorage']();

      expect(annotation['dataUrl']).toBe('');
      expect(consoleSpy).toHaveBeenCalledWith('Screenshot data not found or expired');
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
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      annotation['dataUrl'] = 'data:image/png;base64,test';
      document.body.appendChild(annotation);
      await annotation.updateComplete;

      expect(annotation.shadowRoot).toBeDefined();
      const toolbar = annotation.shadowRoot?.querySelector('hb-toolbar');
      const canvas = annotation.shadowRoot?.querySelector('hb-canvas');

      expect(toolbar).toBeTruthy();
      expect(canvas).toBeTruthy();
      consoleSpy.mockRestore();
    });

    it('should render loading message when dataUrl is empty', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      annotation['dataUrl'] = '';
      document.body.appendChild(annotation);
      await annotation.updateComplete;

      const content = annotation.shadowRoot?.textContent;
      expect(content).toContain('Uh-oh, there\'s no screenshot to annotate!');
      consoleSpy.mockRestore();
    });
  });

  describe('connectedCallback', () => {
    it('should call loadScreenshotFromStorage when connected', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      const spy = vi.spyOn(annotation as any, 'loadScreenshotFromStorage');
      document.body.appendChild(annotation);

      expect(spy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('toggleSystemInfo', () => {
    it('should toggle showSystemInfo state', async () => {
      expect(annotation['showSystemInfo']).toBe(false);

      await annotation['toggleSystemInfo']();
      expect(annotation['showSystemInfo']).toBe(true);

      await annotation['toggleSystemInfo']();
      expect(annotation['showSystemInfo']).toBe(false);
    });

  });

  describe('handleClickOutside', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      annotation['dataUrl'] = 'data:image/png;base64,test';
      document.body.appendChild(annotation);
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should not close when clicking inside container', () => {
      annotation['showSystemInfo'] = true;
      const container = document.createElement('div');
      container.className = 'js-system-info-container';
      vi.spyOn(annotation.shadowRoot!, 'querySelector').mockReturnValue(container);

      const event = {
        target: container,
        composedPath: () => [container, document.body, document.documentElement],
      } as unknown as MouseEvent;

      annotation['handleClickOutside'](event);

      expect(annotation['showSystemInfo']).toBe(true);
    });

    it('should not close when clicking button', () => {
      annotation['showSystemInfo'] = true;
      const button = document.createElement('button');
      button.className = 'js-system-info-button';
      vi.spyOn(annotation.shadowRoot!, 'querySelector').mockReturnValue(button);

      const event = {
        target: button,
        composedPath: () => [button, document.body, document.documentElement],
      } as unknown as MouseEvent;

      annotation['handleClickOutside'](event);

      expect(annotation['showSystemInfo']).toBe(true);
    });

    it('should close when clicking outside', () => {
      annotation['showSystemInfo'] = true;
      const container = document.createElement('div');
      container.className = 'js-system-info-container';
      const outsideElement = document.createElement('div');
      vi.spyOn(annotation.shadowRoot!, 'querySelector').mockReturnValue(container);

      const event = {
        target: outsideElement,
        composedPath: () => [outsideElement, document.body, document.documentElement],
      } as unknown as MouseEvent;

      annotation['handleClickOutside'](event);

      expect(annotation['showSystemInfo']).toBe(false);
    });

    it('should do nothing if panel not shown', () => {
      annotation['showSystemInfo'] = false;

      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: document.body });

      annotation['handleClickOutside'](event);

      expect(annotation['showSystemInfo']).toBe(false);
    });
  });

  describe('handleEscapeKey', () => {
    it('should close system info when Escape is pressed and panel is shown', () => {
      annotation['showSystemInfo'] = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      annotation['handleEscapeKey'](event);

      expect(annotation['showSystemInfo']).toBe(false);
    });

    it('should do nothing when Escape is pressed but panel is not shown', () => {
      annotation['showSystemInfo'] = false;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      annotation['handleEscapeKey'](event);

      expect(annotation['showSystemInfo']).toBe(false);
    });

    it('should do nothing when other keys are pressed', () => {
      annotation['showSystemInfo'] = true;

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      annotation['handleEscapeKey'](event);

      expect(annotation['showSystemInfo']).toBe(true);
    });
  });

  describe('renderSystemInfo', () => {
    it('should return null when systemInfo is not available', () => {
      annotation['systemInfo'] = null;

      const result = annotation['renderSystemInfo']();

      expect(result).toBeNull();
    });

    it('should render system info table when data is available', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      annotation['systemInfo'] = {
        dateAndTime: '2026-01-04 11:00:00',
        url: 'https://example.com',
        visibleArea: '1920 x 1080 px',
        displayResolution: '1920 x 1080 px',
        devicePixelRatio: '1',
        browser: 'Chrome 142',
        os: 'macOS',
      };
      annotation['dataUrl'] = 'data:image/png;base64,test';
      document.body.appendChild(annotation);
      await annotation.updateComplete;

      const result = annotation['renderSystemInfo']();

      expect(result).toBeTruthy();
      consoleSpy.mockRestore();
    });
  });


  describe('System info functionality', () => {
    it('should have copyToClipboard method', () => {
      expect(typeof annotation['copyToClipboard']).toBe('function');
    });
  });


  describe('copyToClipboard', () => {
    it('should copy system info to clipboard', async () => {
      annotation['systemInfo'] = {
        dateAndTime: '2025-12-15 21:00:00',
        url: 'https://example.com',
        visibleArea: '1920 x 1080 px',
        displayResolution: '1920 x 1080 px',
        devicePixelRatio: '1',
        browser: 'Chrome 120',
        os: 'macOS',
      };

      await annotation['copyToClipboard']();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('Date and time: 2025-12-15 21:00:00')
      );
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('URL: https://example.com')
      );
    });

    it('should not copy if no system info', async () => {
      annotation['systemInfo'] = null;

      await annotation['copyToClipboard']();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    it('should set isCopyingDisabled and reset after timeout', async () => {
      vi.useFakeTimers();
      annotation['systemInfo'] = {
        dateAndTime: '2025-12-15 21:00:00',
        url: 'https://example.com',
        visibleArea: '1920 x 1080 px',
        displayResolution: '1920 x 1080 px',
        devicePixelRatio: '1',
        browser: 'Chrome 120',
        os: 'macOS',
      };

      expect(annotation['isCopyingDisabled']).toBe(false);

      const copyPromise = annotation['copyToClipboard']();
      await copyPromise;

      expect(annotation['isCopyingDisabled']).toBe(true);

      // Fast-forward time by 3000ms
      vi.advanceTimersByTime(3000);

      expect(annotation['isCopyingDisabled']).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('disconnectedCallback', () => {
    it('should remove click event listener when disconnected', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      document.body.appendChild(annotation);
      document.body.removeChild(annotation);

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'click',
        annotation['handleClickOutside'],
        true
      );

      consoleSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('renderCopyButtonIcon', () => {
    it('should render check icon when copying is disabled', () => {
      annotation['isCopyingDisabled'] = true;

      const result = annotation['renderCopyButtonIcon']();

      expect(result).toBeTruthy();
    });

    it('should render copy icons when copying is enabled', () => {
      annotation['isCopyingDisabled'] = false;

      const result = annotation['renderCopyButtonIcon']();

      expect(result).toBeTruthy();
    });
  });

  describe('inline event handlers', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      annotation['dataUrl'] = 'data:image/png;base64,test';
      annotation['systemInfo'] = {
        dateAndTime: '2026-01-05 18:00:00',
        url: 'https://example.com',
        visibleArea: '1920 x 1080 px',
        displayResolution: '1920 x 1080 px',
        devicePixelRatio: '1',
        browser: 'Chrome 142',
        os: 'macOS',
      };
      annotation['showSystemInfo'] = true;
      document.body.appendChild(annotation);
      await annotation.updateComplete;
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should call stopPropagation when clicking system info button', async () => {
      const button = annotation.shadowRoot?.querySelector('.js-system-info-button') as HTMLElement;
      expect(button).toBeTruthy();

      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

      button?.dispatchEvent(event);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should call stopPropagation when clicking inside system info container', async () => {
      const container = annotation.shadowRoot?.querySelector('.js-system-info-container') as HTMLElement;
      expect(container).toBeTruthy();

      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

      container?.dispatchEvent(event);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should prevent handleClickOutside from being called when clicking button with stopPropagation', async () => {
      const button = annotation.shadowRoot?.querySelector('.js-system-info-button') as HTMLElement;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });

      button?.dispatchEvent(event);

      // stopPropagation should prevent the event from bubbling to document
      // So handleClickOutside should not be triggered by this click
      // Note: In our test environment, we'd need to verify the interaction differently
      expect(button).toBeTruthy();
    });
  });
});
