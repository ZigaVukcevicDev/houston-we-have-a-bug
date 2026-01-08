import { describe, it, expect, vi } from 'vitest';
import { getCanvasCoordinates } from './get-canvas-coordinates';

describe('getCanvasCoordinates', () => {
  it('should convert mouse coordinates to canvas coordinates with no scaling', () => {
    const mockCanvas = {
      getBoundingClientRect: vi.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
      }),
      width: 800,
      height: 600,
    } as unknown as HTMLCanvasElement;

    const mockEvent = {
      clientX: 100,
      clientY: 150,
    } as MouseEvent;

    const result = getCanvasCoordinates(mockEvent, mockCanvas);

    expect(result).toEqual({ x: 100, y: 150 });
  });

  it('should scale coordinates when canvas size differs from display size', () => {
    const mockCanvas = {
      getBoundingClientRect: vi.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 400, // Display size
        height: 300,
      }),
      width: 800, // Actual canvas size
      height: 600,
    } as unknown as HTMLCanvasElement;

    const mockEvent = {
      clientX: 100,
      clientY: 150,
    } as MouseEvent;

    const result = getCanvasCoordinates(mockEvent, mockCanvas);

    // Scale factor is 2x (800/400 and 600/300)
    expect(result).toEqual({ x: 200, y: 300 });
  });

  it('should handle canvas offset from viewport', () => {
    const mockCanvas = {
      getBoundingClientRect: vi.fn().mockReturnValue({
        left: 50,
        top: 100,
        width: 800,
        height: 600,
      }),
      width: 800,
      height: 600,
    } as unknown as HTMLCanvasElement;

    const mockEvent = {
      clientX: 150, // 100 pixels from canvas left
      clientY: 250, // 150 pixels from canvas top
    } as MouseEvent;

    const result = getCanvasCoordinates(mockEvent, mockCanvas);

    expect(result).toEqual({ x: 100, y: 150 });
  });

  it('should handle both offset and scaling', () => {
    const mockCanvas = {
      getBoundingClientRect: vi.fn().mockReturnValue({
        left: 100,
        top: 50,
        width: 400,
        height: 300,
      }),
      width: 1600, // 4x scale
      height: 1200, // 4x scale
    } as unknown as HTMLCanvasElement;

    const mockEvent = {
      clientX: 200, // 100 from left
      clientY: 150, // 100 from top
    } as MouseEvent;

    const result = getCanvasCoordinates(mockEvent, mockCanvas);

    expect(result).toEqual({ x: 400, y: 400 });
  });

  it('should handle fractional coordinates', () => {
    const mockCanvas = {
      getBoundingClientRect: vi.fn().mockReturnValue({
        left: 10.5,
        top: 20.3,
        width: 333,
        height: 250,
      }),
      width: 1000,
      height: 750,
    } as unknown as HTMLCanvasElement;

    const mockEvent = {
      clientX: 110.5,
      clientY: 120.3,
    } as MouseEvent;

    const result = getCanvasCoordinates(mockEvent, mockCanvas);

    // Should handle fractional pixels
    expect(result.x).toBeCloseTo(300.3, 1);
    expect(result.y).toBeCloseTo(300, 1);
  });

  it('should work with coordinates at origin', () => {
    const mockCanvas = {
      getBoundingClientRect: vi.fn().mockReturnValue({
        left: 100,
        top: 100,
        width: 800,
        height: 600,
      }),
      width: 800,
      height: 600,
    } as unknown as HTMLCanvasElement;

    const mockEvent = {
      clientX: 100,
      clientY: 100,
    } as MouseEvent;

    const result = getCanvasCoordinates(mockEvent, mockCanvas);

    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('should handle high DPR canvas (retina display)', () => {
    const mockCanvas = {
      getBoundingClientRect: vi.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 400,
        height: 300,
      }),
      width: 800, // 2x DPR
      height: 600, // 2x DPR
    } as unknown as HTMLCanvasElement;

    const mockEvent = {
      clientX: 200,
      clientY: 150,
    } as MouseEvent;

    const result = getCanvasCoordinates(mockEvent, mockCanvas);

    expect(result).toEqual({ x: 400, y: 300 });
  });

  it('should handle negative offsets', () => {
    const mockCanvas = {
      getBoundingClientRect: vi.fn().mockReturnValue({
        left: -50,
        top: -100,
        width: 800,
        height: 600,
      }),
      width: 800,
      height: 600,
    } as unknown as HTMLCanvasElement;

    const mockEvent = {
      clientX: 50,
      clientY: 0,
    } as MouseEvent;

    const result = getCanvasCoordinates(mockEvent, mockCanvas);

    expect(result).toEqual({ x: 100, y: 100 });
  });
});
