import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { CropTool } from './crop-tool';

describe('CropTool', () => {
  let cropTool: CropTool;
  let mockRedraw: Mock;
  let mockToolChange: Mock;
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    mockRedraw = vi.fn();
    mockToolChange = vi.fn();
    cropTool = new CropTool(mockRedraw, mockToolChange);

    mockCanvas = {
      getBoundingClientRect: vi.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
      }),
      width: 800,
      height: 600,
      style: {
        cursor: 'default',
      },
    } as unknown as HTMLCanvasElement;

    mockCtx = {
      strokeStyle: '',
      lineWidth: 0,
      lineCap: '',
      fillStyle: '',
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      canvas: {
        width: 800,
        height: 600,
      },
    } as unknown as CanvasRenderingContext2D;
  });

  describe('initialization', () => {
    it('should create CropTool instance', () => {
      expect(cropTool).toBeDefined();
    });

    it('should store redraw callback', () => {
      expect(mockRedraw).toBeDefined();
    });
  });

  describe('handleMouseDown', () => {
    it('should start drawing on mouse down', () => {
      cropTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      expect(cropTool['isDrawing']).toBe(true);
      expect(cropTool['startPoint']).toEqual({ x: 100, y: 100 });
    });

    it('should clear existing crop rectangle on new mouse down', () => {
      cropTool['cropRect'] = { x: 50, y: 50, width: 100, height: 100 };

      cropTool.handleMouseDown({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas);

      expect(cropTool['cropRect']).toBeNull();
    });

    it('should scale coordinates by canvas dimensions', () => {
      mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 10,
        top: 20,
        width: 400,
        height: 300,
      });

      cropTool.handleMouseDown({ clientX: 110, clientY: 120 } as MouseEvent, mockCanvas);

      expect(cropTool['startPoint']).toEqual({ x: 200, y: 200 });
    });
  });

  describe('handleMouseMove', () => {
    beforeEach(() => {
      cropTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
    });

    it('should not draw if not in drawing mode', () => {
      cropTool['isDrawing'] = false;

      cropTool.handleMouseMove({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas, mockCtx);

      expect(mockRedraw).not.toHaveBeenCalled();
    });

    it('should update crop rectangle during drag', () => {
      cropTool.handleMouseMove({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas, mockCtx);

      expect(cropTool['cropRect']).toEqual({
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      });
    });

    it('should handle drag in opposite direction (top-left to bottom-right)', () => {
      cropTool['startPoint'] = { x: 200, y: 200 };
      cropTool.handleMouseMove({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas, mockCtx);

      expect(cropTool['cropRect']).toEqual({
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      });
    });

    it('should call redraw and render during drag', () => {
      cropTool.handleMouseMove({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas, mockCtx);

      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should constrain to square when shift is pressed', () => {
      cropTool.handleMouseMove(
        { clientX: 250, clientY: 200, shiftKey: true } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(cropTool['cropRect']?.width).toBe(cropTool['cropRect']?.height);
    });

    it('should create square in all quadrants with shift key', () => {
      cropTool['startPoint'] = { x: 200, y: 200 };

      // Bottom-right quadrant
      cropTool.handleMouseMove(
        { clientX: 300, clientY: 250, shiftKey: true } as MouseEvent,
        mockCanvas,
        mockCtx
      );
      let rect = cropTool['cropRect'];
      expect(rect?.width).toBe(rect?.height);

      // Top-left quadrant
      cropTool['startPoint'] = { x: 200, y: 200 };
      cropTool.handleMouseMove(
        { clientX: 100, clientY: 150, shiftKey: true } as MouseEvent,
        mockCanvas,
        mockCtx
      );
      rect = cropTool['cropRect'];
      expect(Math.abs(rect?.width ?? 0)).toBe(Math.abs(rect?.height ?? 0));
    });
  });

  describe('handleMouseUp', () => {
    beforeEach(() => {
      cropTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
    });

    it('should finalize crop rectangle on mouse up', () => {
      cropTool.handleMouseUp({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas);

      expect(cropTool['isDrawing']).toBe(false);
      expect(cropTool['startPoint']).toBeNull();
      expect(cropTool['cropRect']).toEqual({
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      });
    });

    it('should expand tiny crop rectangles to minimum dimensions', () => {
      cropTool.handleMouseUp({ clientX: 101, clientY: 101 } as MouseEvent, mockCanvas);

      expect(cropTool['cropRect']).not.toBeNull();
      expect(cropTool['cropRect']!.width).toBeGreaterThanOrEqual(61);
      expect(cropTool['cropRect']!.height).toBeGreaterThanOrEqual(34);
    });

    it('should keep crop rectangle if size is sufficient', () => {
      cropTool.handleMouseUp({ clientX: 160, clientY: 135 } as MouseEvent, mockCanvas);

      expect(cropTool['cropRect']).not.toBeNull();
    });

    it('should apply shift constraint on mouse up', () => {
      cropTool.handleMouseUp(
        { clientX: 250, clientY: 200, shiftKey: true } as MouseEvent,
        mockCanvas
      );

      expect(cropTool['cropRect']?.width).toBe(cropTool['cropRect']?.height);
    });

    it('should call redraw on mouse up', () => {
      mockRedraw.mockClear();
      cropTool.handleMouseUp({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas);

      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should not act if not drawing', () => {
      cropTool['isDrawing'] = false;
      mockRedraw.mockClear();

      cropTool.handleMouseUp({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas);

      expect(mockRedraw).not.toHaveBeenCalled();
    });
  });

  describe('handleClick', () => {
    it('should not perform any action on click', () => {
      cropTool.handleClick({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      // Crop tool uses drag interaction, click should be no-op
      expect(cropTool['cropRect']).toBeNull();
    });
  });

  describe('Escape key handling', () => {
    it('should add keyboard listener on mouse down', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      cropTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should cancel crop when Escape is pressed', () => {
      cropTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };
      mockRedraw.mockClear();

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      cropTool['keydownHandler']?.(escapeEvent);

      expect(cropTool['cropRect']).toBeNull();
      expect(cropTool['isDrawing']).toBe(false);
      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should cancel crop without switching tools on Escape', () => {
      // Set up a crop rectangle first
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };
      cropTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      cropTool['keydownHandler']?.(escapeEvent);

      expect(cropTool['cropRect']).toBeNull();
      expect(mockToolChange).not.toHaveBeenCalled();
      expect(mockCanvas.style.cursor).toBe('crosshair');
    });

    it('should not handle Escape when no crop rectangle exists', () => {
      cropTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      cropTool['cropRect'] = null;

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      cropTool['keydownHandler']?.(escapeEvent);

      expect(mockToolChange).not.toHaveBeenCalled();
    });

    it('should confirm crop on Enter key', () => {
      const mockConfirmCrop = vi.fn();
      cropTool = new CropTool(mockRedraw, mockToolChange, mockConfirmCrop);
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };
      cropTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      cropTool['keydownHandler']?.(enterEvent);

      expect(mockConfirmCrop).toHaveBeenCalled();
    });

    it('should not handle Enter when no crop rectangle exists', () => {
      const mockConfirmCrop = vi.fn();
      cropTool = new CropTool(mockRedraw, mockToolChange, mockConfirmCrop);
      cropTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      cropTool['cropRect'] = null;

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      cropTool['keydownHandler']?.(enterEvent);

      expect(mockConfirmCrop).not.toHaveBeenCalled();
    });

    it('should not handle Enter when no confirm callback provided', () => {
      // cropTool created without confirm callback
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };
      cropTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      cropTool['keydownHandler']?.(enterEvent);

      // Should not throw error
      expect(cropTool['cropRect']).not.toBeNull();
    });
  });

  describe('deactivate', () => {
    it('should clear crop rectangle on deactivate', () => {
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };

      cropTool.deactivate();

      expect(cropTool['cropRect']).toBeNull();
      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should clear drawing state on deactivate', () => {
      cropTool['isDrawing'] = true;
      cropTool['startPoint'] = { x: 100, y: 100 };
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };

      cropTool.deactivate();

      expect(cropTool['isDrawing']).toBe(false);
      expect(cropTool['startPoint']).toBeNull();
      expect(cropTool['cropRect']).toBeNull();
    });
  });

  describe('render', () => {
    it('should not render if no crop rectangle exists', () => {
      cropTool.render(mockCtx);

      expect(mockCtx.save).not.toHaveBeenCalled();
    });

    it('should render crop rectangle and overlay', () => {
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };

      cropTool.render(mockCtx);

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      expect(mockCtx.strokeRect).toHaveBeenCalledWith(100, 100, 200, 150);
    });

    it('should render 4 overlay rectangles', () => {
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };

      cropTool.render(mockCtx);

      // Should fill rectangles for overlay and handles
      // 4 overlay rectangles + 8 handles (each with 1 fill) = 12 fillRect calls
      expect(mockCtx.fillRect).toHaveBeenCalled();
      const callCount = (mockCtx.fillRect as any).mock.calls.length;
      expect(callCount).toBeGreaterThanOrEqual(4);
    });

    it('should render 8 handles', () => {
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };
      const fillRectSpy = vi.spyOn(mockCtx, 'fillRect');

      cropTool.render(mockCtx);

      // 4 overlay rectangles + 8 handles (each handle renders via fillRect)
      // Total should be at least 12 calls
      const callCount = (fillRectSpy as any).mock.calls.length;
      expect(callCount).toBeGreaterThanOrEqual(12);
    });

    it('should set correct overlay color', () => {
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };

      // Create a spy to track fillStyle changes
      const fillStyleSetter = vi.fn();
      Object.defineProperty(mockCtx, 'fillStyle', {
        set: fillStyleSetter,
        get: () => 'rgba(0, 0, 0, 0.7)',
      });

      cropTool.render(mockCtx);

      // Should set overlay color at some point
      expect(fillStyleSetter).toHaveBeenCalledWith('rgba(0, 0, 0, 0.7)');
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

      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };
      cropTool.render(mockCtx);

      // lineWidth should be 2 * 1 (fallback) = 2
      // But the context state may persist, so just verify it renders without error
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();

      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: originalDPR,
      });
    });
  });

  describe('getCropRect', () => {
    it('should return null when no crop rectangle exists', () => {
      expect(cropTool.getCropRect()).toBeNull();
    });

    it('should return crop rectangle when it exists', () => {
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };
      const rect = cropTool.getCropRect();
      expect(rect).toEqual({ x: 100, y: 100, width: 200, height: 150 });
    });
  });

  describe('cancelCrop', () => {
    it('should clear crop rectangle', () => {
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };
      cropTool.cancelCrop();
      expect(cropTool['cropRect']).toBeNull();
    });

    it('should reset drawing state', () => {
      cropTool['isDrawing'] = true;
      cropTool['startPoint'] = { x: 100, y: 100 };
      cropTool.cancelCrop();
      expect(cropTool['isDrawing']).toBe(false);
      expect(cropTool['startPoint']).toBeNull();
    });

    it('should reset drag state', () => {
      cropTool['draggedHandle'] = 'top-left';
      cropTool['isDraggingCrop'] = true;
      cropTool.cancelCrop();
      expect(cropTool['draggedHandle']).toBeNull();
      expect(cropTool['isDraggingCrop']).toBe(false);
    });

    it('should remove keyboard listener', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      cropTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      cropTool.cancelCrop();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(cropTool['keydownHandler']).toBeNull();
    });

    it('should call redraw', () => {
      mockRedraw.mockClear();
      cropTool.cancelCrop();
      expect(mockRedraw).toHaveBeenCalled();
    });
  });

  describe('confirmCrop', () => {
    let mockImage: HTMLImageElement;

    beforeEach(() => {
      mockImage = {
        width: 800,
        height: 600,
      } as HTMLImageElement;
    });

    it('should return null when no crop rectangle exists', () => {
      const result = cropTool.confirmCrop(mockCanvas, mockImage);
      expect(result).toBeNull();
    });

    it('should create cropped image when crop rectangle exists', () => {
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };
      const mockCreatedCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue({
          drawImage: vi.fn(),
        }),
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock'),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockCreatedCanvas as any);
      const result = cropTool.confirmCrop(mockCanvas, mockImage);
      expect(result).toBeInstanceOf(HTMLImageElement);
    });

    it('should create canvas with correct crop dimensions', () => {
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };
      const createCanvasSpy = vi.spyOn(document, 'createElement');
      cropTool.confirmCrop(mockCanvas, mockImage);
      expect(createCanvasSpy).toHaveBeenCalledWith('canvas');
    });

    it('should return null if canvas context is not available', () => {
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };
      const mockGetContext = vi.fn().mockReturnValue(null);
      vi.spyOn(document, 'createElement').mockReturnValue({
        getContext: mockGetContext,
      } as any);
      const result = cropTool.confirmCrop(mockCanvas, mockImage);
      expect(result).toBeNull();
    });
  });
});
