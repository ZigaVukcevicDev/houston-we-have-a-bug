import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getVisibleArea } from './get-visible-area';

// Mock chrome.scripting API
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
    expect(result).toBe('Unknown');
  });

  it('should return error message when exception occurs', async () => {
    mockChrome.scripting.executeScript.mockRejectedValue(
      new Error('Script execution failed')
    );

    const result = await getVisibleArea(123);
    expect(result).toBe('N/A');
  });
});
