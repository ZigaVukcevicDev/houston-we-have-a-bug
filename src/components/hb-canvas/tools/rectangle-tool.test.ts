import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { RectangleTool } from './rectangle-tool';
import type { RectangleAnnotation } from '../../../interfaces/annotation.interface';

describe('RectangleTool', () => {
  let rectangleTool: RectangleTool;
  let rectangleAnnotations: RectangleAnnotation[];
  let mockRedraw: Mock;
  let mockToolChange: Mock;
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    rectangleAnnotations = [];
    mockRedraw = vi.fn();
    mockToolChange = vi.fn();
    rectangleTool = new RectangleTool(rectangleAnnotations, mockRedraw, mockToolChange);

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
      lineJoin: '',
      fillStyle: '',
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      rect: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
  });

  describe('handleMouseDown', () => {
    it('should start drawing and set start point', () => {
      const event = {
        clientX: 100,
        clientY: 150,
      } as MouseEvent;

      rectangleTool.handleMouseDown(event, mockCanvas);

      expect(rectangleTool['isDrawing']).toBe(true);
      expect(rectangleTool['startPoint']).toEqual({ x: 100, y: 150 });
    });

    it('should handle scaled canvas', () => {
      mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 400,
        height: 300,
      });

      const event = {
        clientX: 100,
        clientY: 150,
      } as MouseEvent;

      rectangleTool.handleMouseDown(event, mockCanvas);

      expect(rectangleTool['startPoint']).toEqual({ x: 200, y: 300 });
    });

    it('should add keyboard listener for Escape key', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      rectangleTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('handleMouseMove', () => {
    beforeEach(() => {
      rectangleTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      mockRedraw.mockClear();
    });

    it('should draw preview rectangle when dragging', () => {
      const event = {
        clientX: 200,
        clientY: 200,
        shiftKey: false,
      } as MouseEvent;

      rectangleTool.handleMouseMove(event, mockCanvas, mockCtx);

      expect(mockRedraw).toHaveBeenCalled();
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.rect).toHaveBeenCalledWith(100, 100, 100, 100);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should do nothing if not drawing', () => {
      rectangleTool['isDrawing'] = false;

      rectangleTool.handleMouseMove(
        { clientX: 200, clientY: 200, shiftKey: false } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockRedraw).not.toHaveBeenCalled();
    });

    it('should constrain to square when shift key is pressed', () => {
      const event = {
        clientX: 200,
        clientY: 150,
        shiftKey: true,
      } as MouseEvent;

      rectangleTool.handleMouseMove(event, mockCanvas, mockCtx);

      // Should use the larger dimension (100px) for both width and height
      expect(mockCtx.rect).toHaveBeenCalledWith(100, 100, 100, 100);
    });

    it('should handle negative width/height during preview', () => {
      const event = {
        clientX: 50,
        clientY: 50,
        shiftKey: false,
      } as MouseEvent;

      rectangleTool.handleMouseMove(event, mockCanvas, mockCtx);

      expect(mockCtx.rect).toHaveBeenCalledWith(100, 100, -50, -50);
    });

    it('should apply DPR scaling to line width', () => {
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2,
      });

      rectangleTool.handleMouseMove(
        { clientX: 200, clientY: 200, shiftKey: false } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockCtx.lineWidth).toBe(10); // 5 * 2
    });
  });

  describe('handleMouseUp', () => {
    beforeEach(() => {
      rectangleTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      mockRedraw.mockClear();
    });

    it('should create rectangle annotation with correct dimensions', () => {
      const event = {
        clientX: 200,
        clientY: 200,
        shiftKey: false,
      } as MouseEvent;

      rectangleTool.handleMouseUp(event, mockCanvas);

      expect(rectangleAnnotations).toHaveLength(1);
      expect(rectangleAnnotations[0]).toMatchObject({
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        color: '#BD2D1E',
        strokeWidth: 5,
      });
      expect(rectangleAnnotations[0].id).toMatch(/^rect-/);
    });

    it('should normalize negative dimensions', () => {
      const event = {
        clientX: 50,
        clientY: 50,
        shiftKey: false,
      } as MouseEvent;

      rectangleTool.handleMouseUp(event, mockCanvas);

      expect(rectangleAnnotations[0]).toMatchObject({
        x: 50,
        y: 50,
        width: 50,
        height: 50,
      });
    });

    it('should constrain to square when shift key is pressed', () => {
      const event = {
        clientX: 250,
        clientY: 200,
        shiftKey: true,
      } as MouseEvent;

      rectangleTool.handleMouseUp(event, mockCanvas);

      // Should use larger dimension (150px) for both
      expect(rectangleAnnotations[0]).toMatchObject({
        width: 150,
        height: 150,
      });
    });

    it('should call tool change callback after creating rectangle', () => {
      rectangleTool.handleMouseUp(
        { clientX: 200, clientY: 200, shiftKey: false } as MouseEvent,
        mockCanvas
      );

      expect(mockToolChange).toHaveBeenCalledWith('select', expect.stringMatching(/^rect-/));
    });

    it('should not create rectangle if dimensions are too small', () => {
      const event = {
        clientX: 101,
        clientY: 100,
        shiftKey: false,
      } as MouseEvent;

      rectangleTool.handleMouseUp(event, mockCanvas);

      expect(rectangleAnnotations).toHaveLength(0);
      expect(mockToolChange).not.toHaveBeenCalled();
    });

    it('should do nothing if not drawing', () => {
      rectangleTool['isDrawing'] = false;

      rectangleTool.handleMouseUp(
        { clientX: 200, clientY: 200, shiftKey: false } as MouseEvent,
        mockCanvas
      );

      expect(rectangleAnnotations).toHaveLength(0);
    });

    it('should cleanup drawing state after mouse up', () => {
      rectangleTool.handleMouseUp(
        { clientX: 200, clientY: 200, shiftKey: false } as MouseEvent,
        mockCanvas
      );

      expect(rectangleTool['isDrawing']).toBe(false);
      expect(rectangleTool['startPoint']).toBeNull();
    });
  });

  describe('activate and deactivate', () => {
    it('should do nothing on activate', () => {
      expect(() => rectangleTool.activate()).not.toThrow();
    });

    it('should cancel drawing on deactivate', () => {
      rectangleTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      rectangleTool['isDrawing'] = true;

      rectangleTool.deactivate();

      expect(rectangleTool['isDrawing']).toBe(false);
    });
  });

  describe('Escape key handling', () => {
    it('should cancel drawing when Escape is pressed', () => {
      rectangleTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      expect(rectangleTool['isDrawing']).toBe(true);

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      rectangleTool['keydownHandler']?.(escapeEvent);

      expect(rectangleTool['isDrawing']).toBe(false);
      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should remove keyboard listener after escape', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      rectangleTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      rectangleTool['keydownHandler']?.(escapeEvent);

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('render', () => {
    it('should render all rectangle annotations', () => {
      rectangleAnnotations.push(
        {
          id: 'rect-1',
          x: 50,
          y: 50,
          width: 100,
          height: 80,
          color: '#BD2D1E',
          strokeWidth: 5,
        },
        {
          id: 'rect-2',
          x: 200,
          y: 100,
          width: 150,
          height: 120,
          color: '#BD2D1E',
          strokeWidth: 5,
        }
      );

      rectangleTool.render(mockCtx);

      expect(mockCtx.rect).toHaveBeenCalledTimes(2);
      expect(mockCtx.rect).toHaveBeenNthCalledWith(1, 50, 50, 100, 80);
      expect(mockCtx.rect).toHaveBeenNthCalledWith(2, 200, 100, 150, 120);
      expect(mockCtx.stroke).toHaveBeenCalledTimes(2);
    });

    it('should apply DPR scaling when rendering', () => {
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2,
      });

      rectangleAnnotations.push({
        id: 'rect-1',
        x: 50,
        y: 50,
        width: 100,
        height: 80,
        color: '#BD2D1E',
        strokeWidth: 5,
      });

      rectangleTool.render(mockCtx);

      expect(mockCtx.lineWidth).toBe(10); // 5 * 2
    });

    it('should save and restore context for each rectangle', () => {
      rectangleAnnotations.push({
        id: 'rect-1',
        x: 50,
        y: 50,
        width: 100,
        height: 80,
        color: '#BD2D1E',
        strokeWidth: 5,
      });

      rectangleTool.render(mockCtx);

      expect(mockCtx.save).toHaveBeenCalledTimes(1);
      expect(mockCtx.restore).toHaveBeenCalledTimes(1);
    });

    it('should use lineJoin round for rectangles', () => {
      rectangleAnnotations.push({
        id: 'rect-1',
        x: 50,
        y: 50,
        width: 100,
        height: 80,
        color: '#BD2D1E',
        strokeWidth: 5,
      });

      rectangleTool.render(mockCtx);

      expect(mockCtx.lineJoin).toBe('round');
    });
  });

  describe('edge cases', () => {
    it('should handle canvas offset', () => {
      mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 50,
        top: 100,
        width: 800,
        height: 600,
      });

      rectangleTool.handleMouseDown({ clientX: 150, clientY: 200 } as MouseEvent, mockCanvas);

      expect(rectangleTool['startPoint']).toEqual({ x: 100, y: 100 });
    });

    it('should handle multiple rectangles', () => {
      // Draw first rectangle
      rectangleTool.handleMouseDown({ clientX: 50, clientY: 50 } as MouseEvent, mockCanvas);
      rectangleTool.handleMouseUp({ clientX: 150, clientY: 150, shiftKey: false } as MouseEvent, mockCanvas);

      // Draw second rectangle
      rectangleTool.handleMouseDown({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas);
      rectangleTool.handleMouseUp({ clientX: 300, clientY: 300, shiftKey: false } as MouseEvent, mockCanvas);

      expect(rectangleAnnotations).toHaveLength(2);
      expect(rectangleAnnotations[0]).toBeDefined();
      expect(rectangleAnnotations[1]).toBeDefined();
    });

    it('should handle perfect square with shift key', () => {
      rectangleTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      rectangleTool.handleMouseUp({ clientX: 200, clientY: 200, shiftKey: true } as MouseEvent, mockCanvas);

      expect(rectangleAnnotations[0]).toMatchObject({
        width: 100,
        height: 100,
      });
    });
  });
});
