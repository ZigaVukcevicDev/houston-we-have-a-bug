import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { LineTool } from './line-tool';

describe('LineTool', () => {
  let lineTool: LineTool;
  let mockRedraw: Mock;
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    mockRedraw = vi.fn();
    lineTool = new LineTool([], mockRedraw);

    // Mock canvas
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

    // Mock context
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
      arc: vi.fn(),
      fill: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
  });

  describe('handleMouseDown', () => {
    it('should start drawing and set start point', () => {
      const event = {
        clientX: 100,
        clientY: 150,
      } as MouseEvent;

      lineTool.handleMouseDown(event, mockCanvas);

      expect(lineTool['isDrawing']).toBe(true);
      expect(lineTool['startPoint']).toEqual({ x: 100, y: 150 });
    });

    it('should handle scaled canvas', () => {
      mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 400, // Half width
        height: 300, // Half height
      });

      const event = {
        clientX: 100,
        clientY: 150,
      } as MouseEvent;

      lineTool.handleMouseDown(event, mockCanvas);

      expect(lineTool['startPoint']).toEqual({ x: 200, y: 300 });
    });
  });

  describe('handleMouseMove', () => {
    beforeEach(() => {
      // Start drawing first
      lineTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      mockRedraw.mockClear();
    });

    it('should draw preview line when dragging', () => {
      lineTool.handleMouseDown({ clientX: 50, clientY: 50 } as MouseEvent, mockCanvas);

      const event = {
        clientX: 100,
        clientY: 100,
        shiftKey: false,
      } as MouseEvent;

      lineTool.handleMouseMove(event, mockCanvas, mockCtx);

      expect(mockRedraw).toHaveBeenCalled();
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalledWith(50, 50);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(100, 100);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should not draw if not in drawing mode', () => {
      lineTool['isDrawing'] = false;

      lineTool.handleMouseMove(
        { clientX: 200, clientY: 200, shiftKey: false } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockRedraw).not.toHaveBeenCalled();
    });

    it('should constrain to horizontal line when shift is pressed and moving more horizontally', () => {
      const event = {
        clientX: 300, // 200px horizontal
        clientY: 120, // 20px vertical
        shiftKey: true,
      } as MouseEvent;

      lineTool.handleMouseMove(event, mockCanvas, mockCtx);

      // Should snap Y to start point
      expect(mockCtx.lineTo).toHaveBeenCalledWith(300, 100);
    });

    it('should constrain to vertical line when shift is pressed and moving more vertically', () => {
      const event = {
        clientX: 120, // 20px horizontal
        clientY: 300, // 200px vertical
        shiftKey: true,
      } as MouseEvent;

      lineTool.handleMouseMove(event, mockCanvas, mockCtx);

      // Should snap X to start point
      expect(mockCtx.lineTo).toHaveBeenCalledWith(100, 300);
    });

    it('should apply correct styling to preview line', () => {
      lineTool.handleMouseMove(
        { clientX: 200, clientY: 200, shiftKey: false } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockCtx.strokeStyle).toBe('#E74C3C');
      expect(mockCtx.lineWidth).toBe(5);
      expect(mockCtx.lineCap).toBe('round');
    });
  });

  describe('handleMouseUp', () => {
    beforeEach(() => {
      lineTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      mockRedraw.mockClear();
    });

    it('should finalize line and add to annotations', () => {
      const event = {
        clientX: 200,
        clientY: 250,
        shiftKey: false,
      } as MouseEvent;

      lineTool.handleMouseUp(event, mockCanvas);

      expect(lineTool['lineAnnotations']).toHaveLength(1);
      expect(lineTool['lineAnnotations'][0]).toMatchObject({
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 250,
        color: '#E74C3C',
        width: 5,
      });
      expect(lineTool['isDrawing']).toBe(false);
      expect(lineTool['startPoint']).toBeNull();
      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should constrain final line to horizontal when shift is pressed', () => {
      const event = {
        clientX: 300,
        clientY: 120,
        shiftKey: true,
      } as MouseEvent;

      lineTool.handleMouseUp(event, mockCanvas);

      expect(lineTool['lineAnnotations'][0]).toMatchObject({
        x1: 100,
        y1: 100,
        x2: 300,
        y2: 100, // Y constrained to start point
        color: '#E74C3C',
        width: 5,
      });
    });

    it('should constrain final line to vertical when shift is pressed', () => {
      const event = {
        clientX: 120,
        clientY: 300,
        shiftKey: true,
      } as MouseEvent;

      lineTool.handleMouseUp(event, mockCanvas);

      expect(lineTool['lineAnnotations'][0]).toMatchObject({
        x1: 100,
        y1: 100,
        x2: 100, // X constrained to start point
        y2: 300,
        color: '#E74C3C',
        width: 5,
      });
    });

    it('should allow drawing multiple lines', () => {
      // First line
      lineTool.handleMouseUp(
        { clientX: 200, clientY: 200, shiftKey: false } as MouseEvent,
        mockCanvas
      );

      // Second line
      lineTool.handleMouseDown(
        { clientX: 250, clientY: 250 } as MouseEvent,
        mockCanvas
      );
      lineTool.handleMouseUp(
        { clientX: 350, clientY: 350, shiftKey: false } as MouseEvent,
        mockCanvas
      );

      expect(lineTool['lineAnnotations']).toHaveLength(2);
      expect(lineTool['lineAnnotations'][1]).toMatchObject({
        x1: 250,
        y1: 250,
        x2: 350,
        y2: 350,
        color: '#E74C3C',
        width: 5,
      });
    });

    it('should not add line if not in drawing mode', () => {
      lineTool['isDrawing'] = false;

      lineTool.handleMouseUp(
        { clientX: 200, clientY: 200, shiftKey: false } as MouseEvent,
        mockCanvas
      );

      expect(lineTool['lineAnnotations']).toHaveLength(0);
    });
  });

  describe('render', () => {
    beforeEach(() => {
      // Draw some lines
      lineTool.handleMouseDown(
        { clientX: 50, clientY: 50 } as MouseEvent,
        mockCanvas
      );
      lineTool.handleMouseUp(
        { clientX: 150, clientY: 150, shiftKey: false } as MouseEvent,
        mockCanvas
      );

      lineTool.handleMouseDown(
        { clientX: 200, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      lineTool.handleMouseUp(
        { clientX: 300, clientY: 100, shiftKey: true } as MouseEvent,
        mockCanvas
      );

      mockCtx.beginPath = vi.fn();
      mockCtx.moveTo = vi.fn();
      mockCtx.lineTo = vi.fn();
      mockCtx.stroke = vi.fn();
      mockCtx.arc = vi.fn();
      mockCtx.fill = vi.fn();
    });

    it('should render all line annotations', () => {
      lineTool.render(mockCtx);

      // Should draw 2 lines; no handles shown since no line is selected
      expect(mockCtx.beginPath).toHaveBeenCalledTimes(2);
      expect(mockCtx.moveTo).toHaveBeenCalledTimes(2);
      expect(mockCtx.lineTo).toHaveBeenCalledTimes(2);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should render lines with correct coordinates', () => {
      lineTool.render(mockCtx);

      expect(mockCtx.moveTo).toHaveBeenNthCalledWith(1, 50, 50);
      expect(mockCtx.lineTo).toHaveBeenNthCalledWith(1, 150, 150);
      expect(mockCtx.moveTo).toHaveBeenNthCalledWith(2, 200, 100);
      expect(mockCtx.lineTo).toHaveBeenNthCalledWith(2, 300, 100);
    });

    it('should apply correct styling to rendered lines', () => {
      lineTool.render(mockCtx);

      expect(mockCtx.strokeStyle).toBe('#E74C3C');
      expect(mockCtx.lineWidth).toBe(5);
      expect(mockCtx.lineCap).toBe('round');
    });

    it('should handle empty annotations', () => {
      const emptyLineTool = new LineTool([], vi.fn());

      emptyLineTool.render(mockCtx);

      expect(mockCtx.beginPath).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should prevent zero-length lines (single click without drag)', () => {
      lineTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      lineTool.handleMouseUp(
        { clientX: 100, clientY: 100, shiftKey: false } as MouseEvent,
        mockCanvas
      );

      // Should NOT create a line for single click
      expect(lineTool['lineAnnotations']).toHaveLength(0);
    });

    it('should handle canvas offset', () => {
      mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 50,
        top: 100,
        width: 800,
        height: 600,
      });

      lineTool.handleMouseDown(
        { clientX: 150, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      expect(lineTool['startPoint']).toEqual({ x: 100, y: 100 });
    });

    it('should handle diagonal shift constraint correctly', () => {
      lineTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );

      // Exactly diagonal - should favor horizontal in current implementation
      const event = {
        clientX: 200, // 100px
        clientY: 200, // 100px
        shiftKey: true,
      } as MouseEvent;

      lineTool.handleMouseUp(event, mockCanvas);

      // When equal distance, vertical takes precedence (else branch when dx === dy)
      expect(lineTool['lineAnnotations'][0].x2).toBe(100);
      expect(lineTool['lineAnnotations'][0].y2).toBe(200);
    });
  });

  describe('escape key cancel functionality', () => {
    beforeEach(() => {
      // Start drawing
      lineTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      mockRedraw.mockClear();
    });

    it('should cancel drawing when Escape key is pressed', () => {
      expect(lineTool['isDrawing']).toBe(true);
      expect(lineTool['startPoint']).not.toBeNull();

      // Simulate Escape key press
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(lineTool['isDrawing']).toBe(false);
      expect(lineTool['startPoint']).toBeNull();
    });

    it('should call redraw when canceling with Escape', () => {
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should not add annotation when canceled with Escape', () => {
      // Move mouse to create a line preview
      lineTool.handleMouseMove(
        { clientX: 200, clientY: 200, shiftKey: false } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      // Cancel with Escape
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(lineTool['lineAnnotations']).toHaveLength(0);
    });

    it('should remove keyboard event listener after canceling', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
      expect(lineTool['keydownHandler']).toBeNull();

      removeEventListenerSpy.mockRestore();
    });

    it('should remove keyboard event listener after mouse up', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      lineTool.handleMouseUp(
        { clientX: 200, clientY: 200, shiftKey: false } as MouseEvent,
        mockCanvas
      );

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
      expect(lineTool['keydownHandler']).toBeNull();

      removeEventListenerSpy.mockRestore();
    });

    it('should not crash when Escape is pressed while not drawing', () => {
      // First complete a line
      lineTool.handleMouseUp(
        { clientX: 200, clientY: 200, shiftKey: false } as MouseEvent,
        mockCanvas
      );

      // Now try to cancel when not drawing
      expect(() => {
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(escapeEvent);
      }).not.toThrow();

      expect(lineTool['isDrawing']).toBe(false);
    });

    it('should ignore other key presses', () => {
      const initialDrawingState = lineTool['isDrawing'];

      // Press a different key
      const aKeyEvent = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(aKeyEvent);

      expect(lineTool['isDrawing']).toBe(initialDrawingState);
      expect(mockRedraw).not.toHaveBeenCalled();
    });

    it('should add keyboard listener on each mouse down', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      // Start a new line
      lineTool.handleMouseDown(
        { clientX: 250, clientY: 250 } as MouseEvent,
        mockCanvas
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
    });
  });


  describe('tool change callback', () => {
    it('should call onToolChange with "select" after drawing a line', () => {
      const mockToolChange = vi.fn();
      const lineToolWithCallback = new LineTool([], () => { }, mockToolChange);

      // Draw a line
      lineToolWithCallback.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      lineToolWithCallback.handleMouseUp({ clientX: 200, clientY: 200, shiftKey: false } as MouseEvent, mockCanvas);

      expect(mockToolChange).toHaveBeenCalledWith('select', expect.any(String));
      expect(mockToolChange).toHaveBeenCalledTimes(1);
    });

    it('should not call onToolChange if callback not provided', () => {
      // Should not crash without callback
      const lineToolNoCallback = new LineTool([], () => { });

      expect(() => {
        lineToolNoCallback.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
        lineToolNoCallback.handleMouseUp({ clientX: 200, clientY: 200, shiftKey: false } as MouseEvent, mockCanvas);
      }).not.toThrow();
    });

    it('should not call onToolChange for zero-length lines', () => {
      const mockToolChange = vi.fn();
      const lineToolWithCallback = new LineTool([], () => { }, mockToolChange);

      // Try to draw zero-length line (single click)
      lineToolWithCallback.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      lineToolWithCallback.handleMouseUp({ clientX: 100, clientY: 100, shiftKey: false } as MouseEvent, mockCanvas);

      expect(mockToolChange).not.toHaveBeenCalled();
    });
  });

  describe('DPR fallback', () => {
    it('should use fallback DPR of 1 in handleMouseMove preview when devicePixelRatio is undefined', () => {
      const originalDPR = window.devicePixelRatio;
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      (mockCtx.stroke as any).mockClear();
      lineTool.handleMouseMove({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas, mockCtx);

      expect(mockCtx.stroke).toHaveBeenCalled();

      // Restore
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: originalDPR,
      });
    });

    it('should use fallback DPR of 1 in render when devicePixelRatio is undefined', () => {
      const originalDPR = window.devicePixelRatio;
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      // Create a line first
      lineTool.handleMouseDown({ clientX: 50, clientY: 50 } as MouseEvent, mockCanvas);
      lineTool.handleMouseUp({ clientX: 150, clientY: 150 } as MouseEvent, mockCanvas);

      (mockCtx.stroke as any).mockClear();
      lineTool.render(mockCtx);

      expect(mockCtx.stroke).toHaveBeenCalled();

      // Restore
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: originalDPR,
      });
    });
  });

  describe('cleanupDrawingState', () => {
    it('should remove event listener when keydownHandler exists', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      // Start drawing to set up keydownHandler
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      // Verify keydownHandler was set
      expect(lineTool['keydownHandler']).not.toBeNull();

      // Complete the line (this calls cleanupDrawingState)
      lineTool.handleMouseUp({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas);

      // Should have removed the event listener
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(lineTool['keydownHandler']).toBeNull();

      removeEventListenerSpy.mockRestore();
    });
  });
});
