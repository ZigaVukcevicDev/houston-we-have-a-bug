import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDisplayResolution } from './get-display-resolution';

// Mock chrome.scripting API
const mockChrome = {
  scripting: {
    executeScript: vi.fn(),
  },
};

globalThis.chrome = mockChrome as any;

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
});
