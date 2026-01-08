import { describe, it, expect, vi, beforeEach } from 'vitest';
import { drawManualDashes } from './draw-manual-dashes';

describe('drawManualDashes', () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    };
  });

  describe('horizontal lines', () => {
    it('should draw horizontal dashed line from left to right', () => {
      drawManualDashes(mockCtx, 0, 100, 100, 100, 10, 5, true);

      // Should have called beginPath, moveTo, lineTo, stroke for each dash
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();

      // First dash should start at x=0, y=100
      expect(mockCtx.moveTo).toHaveBeenCalledWith(0, 100);
    });

    it('should draw horizontal dashed line with reversed coordinates', () => {
      // x2 < x1, should still work correctly
      drawManualDashes(mockCtx, 100, 100, 0, 100, 10, 5, true);

      // Should still draw from left to right (0 to 100)
      expect(mockCtx.moveTo).toHaveBeenCalledWith(0, 100);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should respect dash and gap lengths', () => {
      drawManualDashes(mockCtx, 0, 50, 30, 50, 10, 5, true);

      // With dash=10, gap=5, line length=30:
      // Dash 0-10, Gap 10-15, Dash 15-25, Gap 25-30, Dash 30 (partial)
      // Should have multiple dashes
      const strokeCalls = mockCtx.stroke.mock.calls.length;
      expect(strokeCalls).toBeGreaterThan(1);
    });

    it('should handle single dash when line is shorter than dash length', () => {
      drawManualDashes(mockCtx, 0, 100, 5, 100, 10, 5, true);

      // Line length is only 5, dash length is 10
      // Should draw one dash of length 5
      expect(mockCtx.lineTo).toHaveBeenCalledWith(5, 100);
    });

    it('should draw complete pattern with exact multiples', () => {
      // Total length 45 = 3 full cycles (10 dash + 5 gap = 15 each)
      drawManualDashes(mockCtx, 0, 100, 45, 100, 10, 5, true);

      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.beginPath).toHaveBeenCalled();
    });
  });

  describe('vertical lines', () => {
    it('should draw vertical dashed line from top to bottom', () => {
      drawManualDashes(mockCtx, 100, 0, 100, 100, 10, 5, false);

      // Should have called drawing methods
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();

      // First dash should start at x=100, y=0
      expect(mockCtx.moveTo).toHaveBeenCalledWith(100, 0);
    });

    it('should draw vertical dashed line with reversed coordinates', () => {
      // y2 < y1, should still work correctly
      drawManualDashes(mockCtx, 100, 100, 100, 0, 10, 5, false);

      // Should still draw from top to bottom (0 to 100)
      expect(mockCtx.moveTo).toHaveBeenCalledWith(100, 0);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should respect dash and gap lengths for vertical lines', () => {
      drawManualDashes(mockCtx, 50, 0, 50, 30, 10, 5, false);

      // Should have multiple dashes
      const strokeCalls = mockCtx.stroke.mock.calls.length;
      expect(strokeCalls).toBeGreaterThan(1);
    });

    it('should handle single dash when vertical line is shorter than dash length', () => {
      drawManualDashes(mockCtx, 100, 0, 100, 5, 10, 5, false);

      // Line length is only 5, dash length is 10
      // Should draw one dash of length 5
      expect(mockCtx.lineTo).toHaveBeenCalledWith(100, 5);
    });
  });

  describe('edge cases', () => {
    it('should handle zero-length line (horizontal)', () => {
      drawManualDashes(mockCtx, 50, 50, 50, 50, 10, 5, true);

      // No dashes should be drawn for zero-length line
      expect(mockCtx.stroke).not.toHaveBeenCalled();
    });

    it('should handle zero-length line (vertical)', () => {
      drawManualDashes(mockCtx, 50, 50, 50, 50, 10, 5, false);

      // No dashes should be drawn for zero-length line
      expect(mockCtx.stroke).not.toHaveBeenCalled();
    });

    it('should handle very short dash length', () => {
      drawManualDashes(mockCtx, 0, 100, 50, 100, 2, 1, true);

      // Should work with small dash/gap values
      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.stroke.mock.calls.length).toBeGreaterThan(10);
    });

    it('should handle very long dash length', () => {
      drawManualDashes(mockCtx, 0, 100, 50, 100, 100, 10, true);

      // Dash is longer than line, should draw one continuous line
      expect(mockCtx.lineTo).toHaveBeenCalledWith(50, 100);
      expect(mockCtx.stroke).toHaveBeenCalledTimes(1);
    });

    it('should alternate between dashes and gaps correctly', () => {
      mockCtx.moveTo.mockClear();
      mockCtx.lineTo.mockClear();

      drawManualDashes(mockCtx, 0, 100, 50, 100, 10, 10, true);

      // With dash=10, gap=10, line=50:
      // Dash 0-10, Gap 10-20, Dash 20-30, Gap 30-40, Dash 40-50
      // Should have exactly 3 dashes
      expect(mockCtx.stroke).toHaveBeenCalledTimes(3);
    });

    it('should use min/max correctly for coordinate ordering', () => {
      // Clear mocks to count fresh
      mockCtx.moveTo.mockClear();

      // Horizontal with x1 > x2
      drawManualDashes(mockCtx, 200, 100, 100, 100, 10, 5, true);

      // Should start from min (100) not from x1 (200)
      expect(mockCtx.moveTo).toHaveBeenCalledWith(100, 100);

      mockCtx.moveTo.mockClear();

      // Vertical with y1 > y2
      drawManualDashes(mockCtx, 100, 200, 100, 100, 10, 5, false);

      // Should start from min (100) not from y1 (200)
      expect(mockCtx.moveTo).toHaveBeenCalledWith(100, 100);
    });

    it('should handle decimal coordinates', () => {
      drawManualDashes(mockCtx, 10.5, 20.3, 50.7, 20.3, 10, 5, true);

      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });
  });

  describe('context method calls', () => {
    it('should call context methods in correct order for each dash', () => {
      const callOrder: string[] = [];

      mockCtx.beginPath.mockImplementation(() => callOrder.push('beginPath'));
      mockCtx.moveTo.mockImplementation(() => callOrder.push('moveTo'));
      mockCtx.lineTo.mockImplementation(() => callOrder.push('lineTo'));
      mockCtx.stroke.mockImplementation(() => callOrder.push('stroke'));

      drawManualDashes(mockCtx, 0, 100, 25, 100, 10, 5, true);

      // First dash should follow: beginPath -> moveTo -> lineTo -> stroke
      expect(callOrder[0]).toBe('beginPath');
      expect(callOrder[1]).toBe('moveTo');
      expect(callOrder[2]).toBe('lineTo');
      expect(callOrder[3]).toBe('stroke');
    });

    it('should create new path for each dash segment', () => {
      drawManualDashes(mockCtx, 0, 100, 100, 100, 10, 5, true);

      // With line=100, dash=10, gap=5, we get ~7 dashes
      const beginPathCalls = mockCtx.beginPath.mock.calls.length;
      const strokeCalls = mockCtx.stroke.mock.calls.length;

      // Each dash needs beginPath and stroke
      expect(beginPathCalls).toBe(strokeCalls);
      expect(strokeCalls).toBeGreaterThan(5);
    });
  });
});
