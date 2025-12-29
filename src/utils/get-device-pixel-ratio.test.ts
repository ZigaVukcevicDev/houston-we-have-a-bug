import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDevicePixelRatio } from './get-device-pixel-ratio';

// Mock chrome.scripting API
const mockChrome = {
  scripting: {
    executeScript: vi.fn(),
  },
};

globalThis.chrome = mockChrome as unknown as typeof chrome;

describe('getDevicePixelRatio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return device pixel ratio', async () => {
    mockChrome.scripting.executeScript.mockResolvedValue([{ result: '2' }]);

    const result = await getDevicePixelRatio(123);
    expect(result).toBe('2');
    expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 123 },
      func: expect.any(Function),
    });
  });

  it('should return error message when no result', async () => {
    mockChrome.scripting.executeScript.mockResolvedValue([{ result: null }]);

    const result = await getDevicePixelRatio(123);
    expect(result).toBe('N/A');
  });

  it('should handle decimal pixel ratios', async () => {
    mockChrome.scripting.executeScript.mockResolvedValue([{ result: '1.5' }]);

    const result = await getDevicePixelRatio(123);
    expect(result).toBe('1.5');
  });

  it('should return error message when exception occurs', async () => {
    mockChrome.scripting.executeScript.mockRejectedValue(
      new Error('Script execution failed')
    );

    const result = await getDevicePixelRatio(123);
    expect(result).toBe('N/A');
  });

  it('should execute inline function to get device pixel ratio', async () => {
    // Capture and execute the function
    let capturedFunc: (() => string) | null = null;
    mockChrome.scripting.executeScript.mockImplementation((config: any) => {
      capturedFunc = config.func;
      return Promise.resolve([{ result: '2' }]);
    });

    await getDevicePixelRatio(456);

    // Execute the captured function with mocked window.devicePixelRatio
    expect(capturedFunc).toBeTruthy();
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 2,
      writable: true,
      configurable: true
    });

    const ratio = capturedFunc!();
    expect(ratio).toBe('2');
  });
});
