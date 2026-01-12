import { describe, it, expect, vi, beforeEach } from 'vitest';

const listeners: Function[] = [];
const storageData: Record<string, any> = {};

const mockChrome = {
  storage: {
    session: {
      set: vi.fn((data) => {
        Object.assign(storageData, data);
        return Promise.resolve();
      }),
      get: vi.fn((key) => {
        return Promise.resolve({ [key]: storageData[key] });
      }),
      remove: vi.fn((key) => {
        delete storageData[key];
        return Promise.resolve();
      }),
    },
  },
  tabs: {
    create: vi.fn(),
  },
  runtime: {
    onMessage: {
      addListener: vi.fn((callback) => {
        listeners.push(callback);
      }),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
  },
};

globalThis.chrome = mockChrome as any;

vi.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid-123' as any);

await import('./background');

describe('Background service worker', () => {
  let messageListener: Function;

  beforeEach(() => {
    messageListener = listeners[0];
    vi.clearAllMocks();
    Object.keys(storageData).forEach(key => delete storageData[key]);
  });

  it('should store screenshot data in session storage and create tab', async () => {
    const sendResponse = vi.fn();
    const message = {
      type: 'STORE_SCREENSHOT',
      dataUrl: 'data:image/png;base64,test',
      systemInfo: { url: 'https://example.com' },
    };

    const result = messageListener(message, {}, sendResponse);

    expect(result).toBe(true);

    await vi.waitFor(() => {
      expect(mockChrome.storage.session.set).toHaveBeenCalled();
      expect(mockChrome.tabs.create).toHaveBeenCalledWith({
        url: 'tab.html?session=test-uuid-123',
      });
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });
  });

  it('should retrieve screenshot data from session storage', async () => {
    storageData['screenshot_test-session'] = {
      dataUrl: 'data:image/png;base64,test',
      systemInfo: { url: 'https://example.com' },
      timestamp: Date.now(),
    };

    const sendResponse = vi.fn();
    const getMessage = {
      type: 'GET_SCREENSHOT',
      sessionId: 'test-session',
    };

    const result = messageListener(getMessage, {}, sendResponse);

    expect(result).toBe(true);

    await vi.waitFor(() => {
      expect(mockChrome.storage.session.get).toHaveBeenCalledWith('screenshot_test-session');
      expect(mockChrome.storage.session.remove).toHaveBeenCalledWith('screenshot_test-session');
      expect(sendResponse).toHaveBeenCalledWith({
        dataUrl: 'data:image/png;base64,test',
        systemInfo: { url: 'https://example.com' },
      });
    });
  });

  it('should return null data if session ID is missing', async () => {
    const sendResponse = vi.fn();
    const getMessage = {
      type: 'GET_SCREENSHOT',
    };

    const result = messageListener(getMessage, {}, sendResponse);

    expect(result).toBe(false);
    expect(sendResponse).toHaveBeenCalledWith({
      dataUrl: null,
      systemInfo: null,
    });
  });

  it('should return false for unknown message types', () => {
    const sendResponse = vi.fn();
    const message = { type: 'UNKNOWN' };

    const result = messageListener(message, {}, sendResponse);

    expect(result).toBe(false);
    expect(sendResponse).not.toHaveBeenCalled();
  });

  it('should handle errors when storing screenshot', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    const sendResponse = vi.fn();
    const message = {
      type: 'STORE_SCREENSHOT',
      dataUrl: 'data:image/png;base64,test',
      systemInfo: { url: 'https://example.com' },
    };

    // Simulate storage error
    mockChrome.storage.session.set.mockRejectedValueOnce(new Error('Storage error'));

    const result = messageListener(message, {}, sendResponse);

    expect(result).toBe(true);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Storage error',
      });
    });
    consoleSpy.mockRestore();
  });

  it('should handle errors when retrieving screenshot', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    const sendResponse = vi.fn();
    const getMessage = {
      type: 'GET_SCREENSHOT',
      sessionId: 'test-session',
    };

    // Simulate retrieval error
    mockChrome.storage.session.get.mockRejectedValueOnce(new Error('Retrieval error'));

    const result = messageListener(getMessage, {}, sendResponse);

    expect(result).toBe(true);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        dataUrl: null,
        systemInfo: null,
      });
    });
    consoleSpy.mockRestore();
  });

  it('should handle missing screenshot data', async () => {
    const sendResponse = vi.fn();
    const getMessage = {
      type: 'GET_SCREENSHOT',
      sessionId: 'nonexistent-session',
    };

    const result = messageListener(getMessage, {}, sendResponse);

    expect(result).toBe(true);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        dataUrl: null,
        systemInfo: null,
      });
    });
  });
});

