import { describe, it, expect } from 'vitest';
import { getChromeVersion } from './get-chrome-version';

describe('getChromeVersion', () => {
  it('should extract Chrome version from user agent', () => {
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
    const result = getChromeVersion(userAgent);
    expect(result).toBe('Chrome 142');
  });

  it('should return "Chrome" when version is not found', () => {
    const userAgent = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1)';
    const result = getChromeVersion(userAgent);
    expect(result).toBe('Chrome');
  });

  it('should handle empty user agent', () => {
    const result = getChromeVersion('');
    expect(result).toBe('Chrome');
  });
});
