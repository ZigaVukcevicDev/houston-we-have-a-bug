import { describe, it, expect, vi, beforeEach } from 'vitest';

const listeners: Function[] = [];

const mockChrome = {
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

// Import background script to register listener
await import('./background');

describe('Background service worker', () => {
  let messageListener: Function;

  beforeEach(() => {
    messageListener = listeners[0];
    vi.clearAllMocks();
  });

  it('should store screenshot data in memory', () => {
    const sendResponse = vi.fn();
    const message = {
      type: 'STORE_SCREENSHOT',
      dataUrl: 'data:image/png;base64,test',
      systemInfo: { url: 'https://example.com' },
    };

    const result = messageListener(message, {}, sendResponse);

    expect(result).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('should retrieve screenshot data and system info from memory', () => {
    // First store it
    const storeMessage = {
      type: 'STORE_SCREENSHOT',
      dataUrl: 'data:image/png;base64,test',
      systemInfo: { url: 'https://example.com' },
    };
    messageListener(storeMessage, {}, vi.fn());

    // Then retrieve it
    const sendResponse = vi.fn();
    const getMessage = {
      type: 'GET_SCREENSHOT',
    };

    const result = messageListener(getMessage, {}, sendResponse);

    expect(result).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({
      dataUrl: 'data:image/png;base64,test',
      systemInfo: { url: 'https://example.com' },
    });
  });

  it('should return false for unknown message types', () => {
    const sendResponse = vi.fn();
    const message = { type: 'UNKNOWN' };

    const result = messageListener(message, {}, sendResponse);

    expect(result).toBe(false);
    expect(sendResponse).not.toHaveBeenCalled();
  });
});
