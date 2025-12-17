import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock chrome API
const listeners: Function[] = [];
const mockChrome = {
  runtime: {
    onMessage: {
      addListener: vi.fn((callback) => {
        listeners.push(callback);
      }),
    },
  },
};

globalThis.chrome = mockChrome as any;

// Import background script to register listener
// Using dynamic import to ensure mock is set up first
await import('./background');

describe('Background Service Worker', () => {
  let messageListener: Function;

  beforeEach(() => {
    // Get the registered listener
    messageListener = listeners[0];
    vi.clearAllMocks();
  });

  it('should store screenshot data', () => {
    const sendResponse = vi.fn();
    const message = {
      type: 'STORE_SCREENSHOT',
      dataUrl: 'data:image/png;base64,test',
    };

    const result = messageListener(message, {}, sendResponse);

    expect(result).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('should retrieve and clear screenshot data', () => {
    // First store it
    const storeMessage = {
      type: 'STORE_SCREENSHOT',
      dataUrl: 'data:image/png;base64,test',
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
    });

    // Try to retrieve again - should be null (cleared)
    const sendResponse2 = vi.fn();
    messageListener(getMessage, {}, sendResponse2);
    expect(sendResponse2).toHaveBeenCalledWith({ dataUrl: null });
  });

  it('should ignore unknown message types', () => {
    const sendResponse = vi.fn();
    const message = { type: 'UNKNOWN' };

    const result = messageListener(message, {}, sendResponse);

    expect(result).toBeUndefined();
    expect(sendResponse).not.toHaveBeenCalled();
  });
});
