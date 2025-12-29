import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHandle, isPointOnHandle, handleSize } from './render-handle';

describe('render-handle utility', () => {
  describe('handleSize', () => {
    it('should export the handle size constant', () => {
      expect(handleSize).toBe(8);
    });
  });

  describe('renderHandle', () => {
    let mockCtx: CanvasRenderingContext2D;

    beforeEach(() => {
      mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
      } as unknown as CanvasRenderingContext2D;
    });

    it('should render a rectangle at specified coordinates', () => {
      renderHandle(mockCtx, 100, 150);

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.fillRect).toHaveBeenCalledWith(96, 146, handleSize, handleSize);
      expect(mockCtx.strokeRect).toHaveBeenCalledWith(96, 146, handleSize, handleSize);
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it('should apply correct styling - white fill with black stroke', () => {
      renderHandle(mockCtx, 50, 75);

      expect(mockCtx.fillStyle).toBe('#ffffff');
      expect(mockCtx.strokeStyle).toBe('#000000');
      expect(mockCtx.lineWidth).toBe(1);
    });

    it('should save and restore context', () => {
      renderHandle(mockCtx, 0, 0);

      expect(mockCtx.save).toHaveBeenCalledBefore(mockCtx.fillRect as any);
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it('should center rectangle on given coordinates', () => {
      renderHandle(mockCtx, 100, 100);

      const halfSize = handleSize / 2;
      expect(mockCtx.fillRect).toHaveBeenCalledWith(
        100 - halfSize,
        100 - halfSize,
        handleSize,
        handleSize
      );
    });
  });

  describe('isPointOnHandle', () => {
    it('should return true when point is exactly on handle center', () => {
      expect(isPointOnHandle(100, 100, 100, 100)).toBe(true);
    });

    it('should return true when point is within handle bounds', () => {
      expect(isPointOnHandle(103, 100, 100, 100)).toBe(true);
      expect(isPointOnHandle(100, 103, 100, 100)).toBe(true);
      expect(isPointOnHandle(97, 100, 100, 100)).toBe(true);
      expect(isPointOnHandle(100, 97, 100, 100)).toBe(true);
    });

    it('should return false when point is outside handle bounds', () => {
      expect(isPointOnHandle(105, 100, 100, 100)).toBe(false);
      expect(isPointOnHandle(100, 105, 100, 100)).toBe(false);
      expect(isPointOnHandle(95, 100, 100, 100)).toBe(false);
      expect(isPointOnHandle(100, 95, 100, 100)).toBe(false);
    });

    it('should return true when point is exactly at edge', () => {
      expect(isPointOnHandle(104, 100, 100, 100)).toBe(true);
      expect(isPointOnHandle(96, 100, 100, 100)).toBe(true);
      expect(isPointOnHandle(100, 104, 100, 100)).toBe(true);
      expect(isPointOnHandle(100, 96, 100, 100)).toBe(true);
    });

    it('should handle corner points correctly', () => {
      expect(isPointOnHandle(104, 104, 100, 100)).toBe(true);
      expect(isPointOnHandle(96, 96, 100, 100)).toBe(true);
      expect(isPointOnHandle(104, 96, 100, 100)).toBe(true);
      expect(isPointOnHandle(96, 104, 100, 100)).toBe(true);
    });

    it('should work with negative coordinates', () => {
      expect(isPointOnHandle(-100, -100, -100, -100)).toBe(true);
      expect(isPointOnHandle(-103, -100, -100, -100)).toBe(true);
      expect(isPointOnHandle(-105, -100, -100, -100)).toBe(false);
    });

    it('should use fallback DPR when devicePixelRatio is undefined', () => {
      // Mock devicePixelRatio as undefined
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      // Should still work with fallback value of 1
      expect(isPointOnHandle(100, 100, 100, 100)).toBe(true);
      expect(isPointOnHandle(104, 100, 100, 100)).toBe(true);
      expect(isPointOnHandle(105, 100, 100, 100)).toBe(false);

      // Reset
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 1,
      });
    });
  });

  describe('renderHandle with DPR edge cases', () => {
    let mockCtx: CanvasRenderingContext2D;

    beforeEach(() => {
      mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
      } as unknown as CanvasRenderingContext2D;
    });

    it('should use fallback DPR of 1 when devicePixelRatio is undefined', () => {
      // Mock devicePixelRatio as undefined
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      renderHandle(mockCtx, 100, 100);

      // With DPR=1, handle size is 8, so centered rectangle starts at 96,96
      expect(mockCtx.fillRect).toHaveBeenCalledWith(96, 96, handleSize, handleSize);

      // Reset
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 1,
      });
    });

    it('should use fallback DPR of 1 when devicePixelRatio is 0', () => {
      // Mock devicePixelRatio as 0 (falsy)
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 0,
      });

      renderHandle(mockCtx, 100, 100);

      // With DPR=1 (fallback), handle size is 8
      expect(mockCtx.fillRect).toHaveBeenCalledWith(96, 96, handleSize, handleSize);

      // Reset
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 1,
      });
    });
  });
});
