import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDateTimeForFilename } from './get-date-time-for-filename';

describe('getDateTimeForFilename', () => {
  let mockDate: Date;

  beforeEach(() => {
    // Create a fixed date for consistent testing
    mockDate = new Date('2026-01-08T15:45:30Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return formatted date and time string', () => {
    const result = getDateTimeForFilename();
    
    // Expected format: YYYY-MM-DD at HH-MM-SS
    expect(result).toContain('2026-01-08');
    expect(result).toContain(' at ');
    expect(result).toMatch(/\d{4}-\d{2}-\d{2} at \d{2}-\d{2}-\d{2}/);
  });

  it('should replace colons with dashes in time portion', () => {
    const result = getDateTimeForFilename();
    
    // Time portion should not contain colons
    const timePortion = result.split(' at ')[1];
    expect(timePortion).not.toContain(':');
    expect(timePortion).toMatch(/^\d{2}-\d{2}-\d{2}$/);
  });

  it('should use ISO format for date portion', () => {
    const result = getDateTimeForFilename();
    const datePortion = result.split(' at ')[0];
    
    // ISO format is YYYY-MM-DD
    expect(datePortion).toBe('2026-01-08');
  });

  it('should handle different times correctly', () => {
    // Test with a different time
    vi.setSystemTime(new Date('2025-12-25T09:05:03Z'));
    
    const result = getDateTimeForFilename();
    expect(result).toContain('2025-12-25');
    expect(result).toContain(' at ');
  });

  it('should produce consistent format across multiple calls at same time', () => {
    const result1 = getDateTimeForFilename();
    const result2 = getDateTimeForFilename();
    
    expect(result1).toBe(result2);
  });

  it('should handle midnight correctly', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    
    const result = getDateTimeForFilename();
    expect(result).toContain('2026-01-01');
    expect(result).toMatch(/\d{4}-\d{2}-\d{2} at \d{2}-\d{2}-\d{2}/);
  });

  it('should return different values for different times', () => {
    const result1 = getDateTimeForFilename();
    
    // Advance time by 1 second
    vi.advanceTimersByTime(1000);
    
    const result2 = getDateTimeForFilename();
    expect(result1).not.toBe(result2);
  });
});
