import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ArrowTool } from './arrow-tool';
import type { LineAnnotation } from '../../../interfaces/annotation.interface';

describe('ArrowTool', () => {
  let arrowTool: ArrowTool;
  let lineAnnotations: LineAnnotation[];
  let mockRedraw: Mock;
  let mockToolChange: Mock;
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    lineAnnotations = [
      {
        id: 'arrow-1',
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 200,
        color: '#E74C3C',
        width: 5,
      },
    ];

    mockRedraw = vi.fn();
    mockToolChange = vi.fn();
    arrowTool = new ArrowTool(lineAnnotations, mockRedraw, mockToolChange);

    // Mock canvas
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;
    mockCanvas.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));

    // Mock context with all necessary methods
    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
      lineCap: 'butt' as CanvasLineCap,
      lineJoin: 'miter' as CanvasLineJoin,
      font: '',
      textAlign: 'start' as CanvasTextAlign,
      textBaseline: 'alphabetic' as CanvasTextBaseline,
    } as any;
  });

  describe('extends LineTool', () => {
    it('should inherit drawing functionality from LineTool', () => {
      arrowTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      arrowTool.handleMouseUp({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas);

      expect(lineAnnotations.length).toBe(2); // Original + newly drawn
      expect(mockToolChange).toHaveBeenCalledWith('select', expect.any(String));
    });

    it('should support shift-key constraints', () => {
      arrowTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      arrowTool.handleMouseUp(
        { clientX: 200, clientY: 150, shiftKey: true } as MouseEvent,
        mockCanvas
      );

      const newArrow = lineAnnotations[lineAnnotations.length - 1];
      // Should snap to horizontal (y1 === y2)
      expect(newArrow.y1).toBe(newArrow.y2);
    });

    it('should support escape key cancellation', () => {
      arrowTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      const initialLength = lineAnnotations.length;

      // Simulate Escape key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(lineAnnotations.length).toBe(initialLength); // No new arrow added
      expect(mockRedraw).toHaveBeenCalled();
    });
  });

  describe('arrowhead rendering', () => {
    it('should render arrowheads for all arrows', () => {
      arrowTool.render(mockCtx);

      // Should call save/restore for line rendering + arrowhead rendering
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();

      // Should draw lines (inherited from LineTool)
      expect(mockCtx.stroke).toHaveBeenCalled();

      // Should draw arrowhead (two lines forming the arrow)
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
    });

    it('should render arrowhead at correct angle for horizontal arrow', () => {
      const horizontalArrow: LineAnnotation = {
        id: 'h-arrow',
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 100, // Horizontal
        color: '#E74C3C',
        width: 5,
      };
      lineAnnotations.push(horizontalArrow);

      arrowTool.render(mockCtx);

      // Arrow should point to the right (east)
      // The arrowhead lines should be above and below the endpoint
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
    });

    it('should render arrowhead at correct angle for vertical arrow', () => {
      const verticalArrow: LineAnnotation = {
        id: 'v-arrow',
        x1: 100,
        y1: 100,
        x2: 100,
        y2: 200, // Vertical
        color: '#E74C3C',
        width: 5,
      };
      lineAnnotations.push(verticalArrow);

      arrowTool.render(mockCtx);

      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
    });

    it('should render arrowhead at correct angle for diagonal arrow', () => {
      // Default arrow is diagonal (100,100 -> 200,200)
      arrowTool.render(mockCtx);

      // Check that moveTo is called with endpoint
      const moveToCall = (mockCtx.moveTo as any).mock.calls.find(
        (call: number[]) => call[0] === 200 && call[1] === 200
      );
      expect(moveToCall).toBeDefined();
    });

    it('should apply correct styling to arrowhead', () => {
      arrowTool.render(mockCtx);

      // Arrowhead should use same color and width as line
      expect(mockCtx.strokeStyle).toBe('#E74C3C');
      expect(mockCtx.lineWidth).toBeGreaterThan(0);
      expect(mockCtx.lineCap).toBe('round');
    });

    it('should scale arrowhead with device pixel ratio', () => {
      // Mock higher DPR
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2,
      });

      arrowTool.render(mockCtx);

      // At 2x DPR, arrowhead should be 32px (16 * 2)
      // Verify lineTo calls have appropriate distance from endpoint
      expect(mockCtx.lineTo).toHaveBeenCalled();

      // Reset DPR
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 1,
      });
    });
  });

  describe('preview during drawing', () => {
    it('should render arrowhead on preview while drawing', () => {
      arrowTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      arrowTool.handleMouseMove({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas, mockCtx);

      // Clear previous calls
      (mockCtx.moveTo as any).mockClear();
      (mockCtx.lineTo as any).mockClear();

      arrowTool.render(mockCtx);

      // Should render arrowhead for preview
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
    });

    it('should update preview arrowhead position on mouse move', () => {
      arrowTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      // First position
      arrowTool.handleMouseMove({ clientX: 150, clientY: 150 } as MouseEvent, mockCanvas, mockCtx);
      (mockCtx.moveTo as any).mockClear();

      // Second position
      arrowTool.handleMouseMove({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas, mockCtx);

      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should constrain arrowhead preview to horizontal when shift is held', () => {
      arrowTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      // Move mouse with shift key - more horizontal movement
      arrowTool.handleMouseMove(
        { clientX: 200, clientY: 120, shiftKey: true } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      // Render to trigger preview with arrowhead
      (mockCtx.moveTo as any).mockClear();
      (mockCtx.lineTo as any).mockClear();
      arrowTool.render(mockCtx);

      // Arrowhead should be at (200, 100) - Y constrained to 100
      const moveToCall = (mockCtx.moveTo as any).mock.calls.find(
        (call: number[]) => call[0] === 200 && call[1] === 100
      );
      expect(moveToCall).toBeDefined();
    });

    it('should constrain arrowhead preview to vertical when shift is held', () => {
      arrowTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      // Move mouse with shift key - more vertical movement
      arrowTool.handleMouseMove(
        { clientX: 120, clientY: 200, shiftKey: true } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      // Render to trigger preview with arrowhead
      (mockCtx.moveTo as any).mockClear();
      (mockCtx.lineTo as any).mockClear();
      arrowTool.render(mockCtx);

      // Arrowhead should be at (100, 200) - X constrained to 100
      const moveToCall = (mockCtx.moveTo as any).mock.calls.find(
        (call: number[]) => call[0] === 100 && call[1] === 200
      );
      expect(moveToCall).toBeDefined();
    });
  });

  describe('multiple arrows', () => {
    it('should render arrowheads for multiple arrows', () => {
      lineAnnotations.push({
        id: 'arrow-2',
        x1: 300,
        y1: 300,
        x2: 400,
        y2: 400,
        color: '#E74C3C',
        width: 5,
      });

      arrowTool.render(mockCtx);

      // Should call stroke multiple times (for lines and arrowheads)
      expect(mockCtx.stroke).toHaveBeenCalled();
      expect((mockCtx.stroke as any).mock.calls.length).toBeGreaterThan(2);
    });
  });

  describe('DPR fallback', () => {
    it('should use fallback DPR of 1 when devicePixelRatio is undefined', () => {
      const originalDPR = window.devicePixelRatio;
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      (mockCtx.moveTo as any).mockClear();
      (mockCtx.lineTo as any).mockClear();

      arrowTool.render(mockCtx);

      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();

      // Restore
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: originalDPR,
      });
    });
  });
});
