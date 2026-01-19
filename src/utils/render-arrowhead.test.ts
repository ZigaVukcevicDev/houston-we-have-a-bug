import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderArrowhead,
  getArrowheadPoints,
  arrowheadLength,
  arrowheadAngle,
} from './render-arrowhead';

describe('renderArrowhead', () => {
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      strokeStyle: '',
      lineWidth: 0,
    } as unknown as CanvasRenderingContext2D;
  });

  it('should render arrowhead pointing right', () => {
    renderArrowhead(mockCtx, 0, 0, 100, 0, '#000', 2);

    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.moveTo).toHaveBeenCalled();
    expect(mockCtx.lineTo).toHaveBeenCalledTimes(2);
    expect(mockCtx.stroke).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('should render arrowhead pointing left', () => {
    renderArrowhead(mockCtx, 100, 0, 0, 0, '#000', 2);

    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it('should render arrowhead pointing up', () => {
    renderArrowhead(mockCtx, 0, 100, 0, 0, '#000', 2);

    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it('should render arrowhead pointing down', () => {
    renderArrowhead(mockCtx, 0, 0, 0, 100, '#000', 2);

    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it('should render arrowhead at diagonal angle', () => {
    renderArrowhead(mockCtx, 0, 0, 100, 100, '#000', 2);

    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it('should use correct color', () => {
    renderArrowhead(mockCtx, 0, 0, 100, 0, '#FF0000', 2);

    expect(mockCtx.strokeStyle).toBe('#FF0000');
  });

  it('should use correct line width with dpr', () => {
    const dpr = 2;
    renderArrowhead(mockCtx, 0, 0, 100, 0, '#000', 5, dpr);

    expect(mockCtx.lineWidth).toBe(10); // 5 * 2
  });
});

describe('getArrowheadPoints', () => {
  it('should calculate arrowhead points for horizontal arrow pointing right', () => {
    const result = getArrowheadPoints(0, 0, 100, 0, 1);

    // Arrow pointing right (0 degrees)
    expect(result.point1.x).toBeCloseTo(
      100 - arrowheadLength * Math.cos(-arrowheadAngle)
    );
    expect(result.point1.y).toBeCloseTo(
      0 - arrowheadLength * Math.sin(-arrowheadAngle)
    );
    expect(result.point2.x).toBeCloseTo(
      100 - arrowheadLength * Math.cos(arrowheadAngle)
    );
    expect(result.point2.y).toBeCloseTo(
      0 - arrowheadLength * Math.sin(arrowheadAngle)
    );
  });

  it('should calculate arrowhead points for vertical arrow pointing down', () => {
    const result = getArrowheadPoints(0, 0, 0, 100, 1);

    // Arrow pointing down (90 degrees)
    const angle = Math.PI / 2;
    expect(result.point1.x).toBeCloseTo(
      0 - arrowheadLength * Math.cos(angle - arrowheadAngle)
    );
    expect(result.point1.y).toBeCloseTo(
      100 - arrowheadLength * Math.sin(angle - arrowheadAngle)
    );
    expect(result.point2.x).toBeCloseTo(
      0 - arrowheadLength * Math.cos(angle + arrowheadAngle)
    );
    expect(result.point2.y).toBeCloseTo(
      100 - arrowheadLength * Math.sin(angle + arrowheadAngle)
    );
  });

  it('should calculate arrowhead points for diagonal arrow', () => {
    const result = getArrowheadPoints(0, 0, 100, 100, 1);

    // Arrow pointing diagonal (45 degrees)
    const angle = Math.PI / 4;
    expect(result.point1.x).toBeCloseTo(
      100 - arrowheadLength * Math.cos(angle - arrowheadAngle)
    );
    expect(result.point1.y).toBeCloseTo(
      100 - arrowheadLength * Math.sin(angle - arrowheadAngle)
    );
  });

  it('should scale arrowhead points with dpr', () => {
    const dpr = 2;
    const result = getArrowheadPoints(0, 0, 100, 0, dpr);

    // Length should be doubled
    const scaledLength = arrowheadLength * dpr;
    expect(result.point1.x).toBeCloseTo(
      100 - scaledLength * Math.cos(-arrowheadAngle)
    );
    expect(result.point2.x).toBeCloseTo(
      100 - scaledLength * Math.cos(arrowheadAngle)
    );
  });

  it('should use default dpr when not provided', () => {
    const result = getArrowheadPoints(0, 0, 100, 0);

    // Should use window.devicePixelRatio or 1
    const expectedDpr = window.devicePixelRatio || 1;
    const expectedLength = arrowheadLength * expectedDpr;
    expect(result.point1.x).toBeCloseTo(
      100 - expectedLength * Math.cos(-arrowheadAngle)
    );
  });
});
