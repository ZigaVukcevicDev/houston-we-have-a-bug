import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getVisibleArea } from './get-visible-area';

const mockChrome = {
  scripting: {
    executeScript: vi.fn(),
  },
};

globalThis.chrome = mockChrome as unknown as typeof chrome;

describe('getVisibleArea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return visible area dimensions', async () => {
    mockChrome.scripting.executeScript.mockResolvedValue([
      { result: '1154 x 801 px' },
    ]);

    const result = await getVisibleArea(123);
    expect(result).toBe('1154 x 801 px');
    expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 123 },
      func: expect.any(Function),
    });
  });

  it('should return "Unknown" when no result', async () => {
    mockChrome.scripting.executeScript.mockResolvedValue([]);

    const result = await getVisibleArea(123);
    expect(result).toBe('N/A');
  });

  it('should return error message when exception occurs', async () => {
    mockChrome.scripting.executeScript.mockRejectedValue(
      new Error('Script execution failed')
    );

    const result = await getVisibleArea(123);
    expect(result).toBe('N/A');
  });

  it('should execute inline function to get dimensions', async () => {
    // Capture the function that's passed to executeScript
    let capturedFunc: (() => string) | null = null;
    mockChrome.scripting.executeScript.mockImplementation((config: any) => {
      capturedFunc = config.func;
      return Promise.resolve([{ result: '800 x 600 px' }]);
    });

    await getVisibleArea(456);

    // Verify the function was captured and can be executed
    expect(capturedFunc).toBeTruthy();

    // Mock window dimensions for the test
    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });

    // Execute the captured function
    const dimensions = capturedFunc!();
    expect(dimensions).toBe('800 x 600 px');
  });
});
