import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDisplayResolution } from './get-display-resolution';

const mockChrome = {
  scripting: {
    executeScript: vi.fn(),
  },
};

globalThis.chrome = mockChrome as unknown as typeof chrome;

describe('getDisplayResolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return display resolution dimensions', async () => {
    mockChrome.scripting.executeScript.mockResolvedValue([
      { result: '1470 x 956 px' },
    ]);

    const result = await getDisplayResolution(123);
    expect(result).toBe('1470 x 956 px');
    expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 123 },
      func: expect.any(Function),
    });
  });

  it('should return error message when no result', async () => {
    mockChrome.scripting.executeScript.mockResolvedValue([{ result: null }]);

    const result = await getDisplayResolution(123);
    expect(result).toBe('N/A');
  });

  it('should return error message when exception occurs', async () => {
    mockChrome.scripting.executeScript.mockRejectedValue(
      new Error('Script execution failed')
    );

    const result = await getDisplayResolution(123);
    expect(result).toBe('N/A');
  });

  it('should execute inline function to get screen dimensions', async () => {
    // Capture and execute the function
    let capturedFunc: (() => string) | null = null;
    mockChrome.scripting.executeScript.mockImplementation((config: { func: () => string }) => {
      capturedFunc = config.func;
      return Promise.resolve([{ result: '1920 x 1080 px' }]);
    });

    await getDisplayResolution(456);

    // Execute the captured function
    expect(capturedFunc).toBeTruthy();
    Object.defineProperty(window, 'screen', {
      value: { width: 1920, height: 1080 },
      writable: true,
      configurable: true
    });

    const dimensions = capturedFunc!();
    expect(dimensions).toBe('1920 x 1080 px');
  });
});
