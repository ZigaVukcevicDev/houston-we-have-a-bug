import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDateAndTime } from './get-date-and-time';

describe('getDateAndTime', () => {
  beforeEach(() => {
    // Mock Date to return a fixed date
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return formatted date and time', () => {
    // Set a specific date: December 12, 2025 at 19:52
    vi.setSystemTime(new Date('2025-12-12T19:52:00'));

    const result = getDateAndTime();
    expect(result).toBe('12.12.2025 at 19:52');
  });

  it('should pad single digit day and month with zeros', () => {
    // Set a date with single digits: January 5, 2025 at 09:05
    vi.setSystemTime(new Date('2025-01-05T09:05:00'));

    const result = getDateAndTime();
    expect(result).toBe('05.01.2025 at 09:05');
  });

  it('should return a string', () => {
    const result = getDateAndTime();
    expect(typeof result).toBe('string');
  });
});
