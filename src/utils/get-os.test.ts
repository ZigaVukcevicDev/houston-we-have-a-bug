import { describe, it, expect } from 'vitest';
import { getOS } from './get-os';

describe('getOS', () => {
  it('should detect macOS', () => {
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
    const result = getOS(userAgent);
    expect(result).toBe('macOS');
  });

  it('should detect Windows', () => {
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    const result = getOS(userAgent);
    expect(result).toBe('Windows');
  });

  it('should detect Linux', () => {
    const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36';
    const result = getOS(userAgent);
    expect(result).toBe('Linux');
  });

  it('should return "Unknown" for unrecognized OS', () => {
    const userAgent = 'Mozilla/5.0 (compatible; MSIE 10.0)';
    const result = getOS(userAgent);
    expect(result).toBe('Unknown');
  });
});
