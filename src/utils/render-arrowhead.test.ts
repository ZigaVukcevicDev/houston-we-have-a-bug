import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderArrowhead } from './render-arrowhead';

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
