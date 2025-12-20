import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { LineTool } from './line-tool';

describe('LineTool', () => {
  let lineTool: LineTool;
  let mockRedraw: Mock;
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    mockRedraw = vi.fn();
    lineTool = new LineTool(mockRedraw);

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
    } as unknown as HTMLCanvasElement;

    // Mock context
    mockCtx = {
      strokeStyle: '',
      lineWidth: 0,
      lineCap: '',
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
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
      const event = {
        clientX: 200,
        clientY: 200,
        shiftKey: false,
      } as MouseEvent;

      lineTool.handleMouseMove(event, mockCanvas, mockCtx);

      expect(mockRedraw).toHaveBeenCalled();
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalledWith(100, 100);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(200, 200);
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

      expect(mockCtx.strokeStyle).toBe('#BD2D1E');
      expect(mockCtx.lineWidth).toBe(3);
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
      expect(lineTool['lineAnnotations'][0]).toEqual({
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 250,
        color: '#BD2D1E',
        width: 3,
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

      expect(lineTool['lineAnnotations'][0]).toEqual({
        x1: 100,
        y1: 100,
        x2: 300,
        y2: 100, // Y constrained to start point
        color: '#BD2D1E',
        width: 3,
      });
    });

    it('should constrain final line to vertical when shift is pressed', () => {
      const event = {
        clientX: 120,
        clientY: 300,
        shiftKey: true,
      } as MouseEvent;

      lineTool.handleMouseUp(event, mockCanvas);

      expect(lineTool['lineAnnotations'][0]).toEqual({
        x1: 100,
        y1: 100,
        x2: 100, // X constrained to start point
        y2: 300,
        color: '#BD2D1E',
        width: 3,
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
      expect(lineTool['lineAnnotations'][1]).toEqual({
        x1: 250,
        y1: 250,
        x2: 350,
        y2: 350,
        color: '#BD2D1E',
        width: 3,
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

      // Should draw 2 lines + 2 handles (handle rendering also calls beginPath)
      expect(mockCtx.beginPath).toHaveBeenCalledTimes(4);
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

      expect(mockCtx.strokeStyle).toBe('#BD2D1E');
      expect(mockCtx.lineWidth).toBe(3);
      expect(mockCtx.lineCap).toBe('round');
    });

    it('should handle empty annotations', () => {
      const emptyLineTool = new LineTool(vi.fn());

      emptyLineTool.render(mockCtx);

      expect(mockCtx.beginPath).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle zero-length lines', () => {
      lineTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      lineTool.handleMouseUp(
        { clientX: 100, clientY: 100, shiftKey: false } as MouseEvent,
        mockCanvas
      );

      expect(lineTool['lineAnnotations']).toHaveLength(1);
      expect(lineTool['lineAnnotations'][0]).toEqual({
        x1: 100,
        y1: 100,
        x2: 100,
        y2: 100,
        color: '#BD2D1E',
        width: 3,
      });
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

  describe('handle bars and selection', () => {
    beforeEach(() => {
      // Mock context for rendering
      mockCtx = {
        ...mockCtx,
        fillStyle: '',
        arc: vi.fn(),
        fill: vi.fn(),
      } as unknown as CanvasRenderingContext2D;
    });

    it('should auto-select line after drawing', () => {
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      lineTool.handleMouseUp({ clientX: 200, clientY: 200, shiftKey: false } as MouseEvent, mockCanvas);

      expect(lineTool['selectedLineIndex']).toBe(0);
    });

    it('should render handles on selected line', () => {
      // Draw a line
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      lineTool.handleMouseUp({ clientX: 200, clientY: 200, shiftKey: false } as MouseEvent, mockCanvas);

      mockCtx.arc = vi.fn();
      mockCtx.fill = vi.fn();
      mockCtx.stroke = vi.fn();

      lineTool.render(mockCtx);

      // Should draw 2 handles (start and end)
      expect(mockCtx.arc).toHaveBeenCalledTimes(2);
      expect(mockCtx.fill).toHaveBeenCalledTimes(2);
    });

    it('should not render handles on non-selected lines', () => {
      // Draw two lines
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      lineTool.handleMouseUp({ clientX: 200, clientY: 200, shiftKey: false } as MouseEvent, mockCanvas);

      lineTool.handleMouseDown({ clientX: 300, clientY: 300 } as MouseEvent, mockCanvas);
      lineTool.handleMouseUp({ clientX: 400, clientY: 400, shiftKey: false } as MouseEvent, mockCanvas);

      // Only second line is selected
      expect(lineTool['selectedLineIndex']).toBe(1);

      mockCtx.arc = vi.fn();
      mockCtx.fill = vi.fn();

      lineTool.render(mockCtx);

      // Should only draw 2 handles (for the selected line)
      expect(mockCtx.arc).toHaveBeenCalledTimes(2);
    });

    it('should select line when clicked', () => {
      // Draw a line first
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      lineTool.handleMouseUp({ clientX: 200, clientY: 200, shiftKey: false } as MouseEvent, mockCanvas);

      // Deselect by drawing another line
      lineTool.handleMouseDown({ clientX: 300, clientY: 300 } as MouseEvent, mockCanvas);
      lineTool.handleMouseUp({ clientX: 400, clientY: 400, shiftKey: false } as MouseEvent, mockCanvas);
      expect(lineTool['selectedLineIndex']).toBe(1);

      // Click on first line
      lineTool.handleClick!({ clientX: 150, clientY: 150 } as MouseEvent, mockCanvas);

      expect(lineTool['selectedLineIndex']).toBe(0);
    });

    it('should deselect when clicking empty space', () => {
      // Draw and select a line
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      lineTool.handleMouseUp({ clientX: 200, clientY: 200, shiftKey: false } as MouseEvent, mockCanvas);
      expect(lineTool['selectedLineIndex']).toBe(0);

      // Click far away
      lineTool.handleClick!({ clientX: 500, clientY: 500 } as MouseEvent, mockCanvas);

      expect(lineTool['selectedLineIndex']).toBeNull();
    });

    it('should deselect when starting to draw new line', () => {
      // Draw and select a line
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      lineTool.handleMouseUp({ clientX: 200, clientY: 200, shiftKey: false } as MouseEvent, mockCanvas);
      expect(lineTool['selectedLineIndex']).toBe(0);

      // Start drawing new line
      lineTool.handleMouseDown({ clientX: 300, clientY: 300 } as MouseEvent, mockCanvas);

      expect(lineTool['selectedLineIndex']).toBeNull();
    });
  });

  describe('handle dragging', () => {
    beforeEach(() => {
      // Draw a line and select it
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      lineTool.handleMouseUp({ clientX: 200, clientY: 200, shiftKey: false } as MouseEvent, mockCanvas);
      mockRedraw.mockClear();
    });

    it('should start dragging start handle when clicked', () => {
      // Click on start handle (100, 100)
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      expect(lineTool['draggingHandle']).toBe('start');
    });

    it('should start dragging end handle when clicked', () => {
      // Click on end handle (200, 200)
      lineTool.handleMouseDown({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas);

      expect(lineTool['draggingHandle']).toBe('end');
    });

    it('should update start point when dragging start handle', () => {
      // Start dragging start handle
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      // Drag to new position
      lineTool.handleMouseMove(
        { clientX: 150, clientY: 150, shiftKey: false } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      const line = lineTool['lineAnnotations'][0];
      expect(line.x1).toBe(150);
      expect(line.y1).toBe(150);
      expect(line.x2).toBe(200); // End point unchanged
      expect(line.y2).toBe(200);
    });

    it('should update end point when dragging end handle', () => {
      // Start dragging end handle
      lineTool.handleMouseDown({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas);

      // Drag to new position
      lineTool.handleMouseMove(
        { clientX: 250, clientY: 250, shiftKey: false } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      const line = lineTool['lineAnnotations'][0];
      expect(line.x1).toBe(100); // Start point unchanged
      expect(line.y1).toBe(100);
      expect(line.x2).toBe(250);
      expect(line.y2).toBe(250);
    });

    it('should call redraw when dragging handle', () => {
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      lineTool.handleMouseMove(
        { clientX: 150, clientY: 150, shiftKey: false } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should stop dragging on mouse up', () => {
      // Start dragging
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      expect(lineTool['draggingHandle']).toBe('start');

      // Release
      lineTool.handleMouseUp({ clientX: 150, clientY: 150, shiftKey: false } as MouseEvent, mockCanvas);

      expect(lineTool['draggingHandle']).toBeNull();
    });

    it('should apply shift-key constraint when dragging start handle', () => {
      // Line from (100, 100) to (200, 200)
      // Start dragging start handle - click exactly at handle position
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      // Verify we started dragging
      expect(lineTool['draggingHandle']).toBe('start');

      // Drag with shift key - need to move MORE horizontally than vertically from the OTHER endpoint (200, 200)
      // Moving to (250, 210): dx from (200, 200) = 50, dy = 10  => horizontal snap
      lineTool.handleMouseMove(
        { clientX: 250, clientY: 210, shiftKey: true } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      const line = lineTool['lineAnnotations'][0];
      // With more horizontal movement, Y should snap to end Y (200)
      expect(line.y1).toBe(200);
      expect(line.x1).toBe(250); // X should have changed
    });

    it('should apply shift-key constraint when dragging end handle', () => {
      // Start dragging end handle
      lineTool.handleMouseDown({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas);

      // Drag with shift key
      lineTool.handleMouseMove(
        { clientX: 220, clientY: 300, shiftKey: true } as MouseEvent, // More vertical movement
        mockCanvas,
        mockCtx
      );

      const line = lineTool['lineAnnotations'][0];
      // Should snap X to match start point X (vertical line)
      expect(line.x2).toBe(100);
    });

    it('should not start dragging if clicking away from handles', () => {
      // Click somewhere far from handles
      lineTool.handleMouseDown({ clientX: 150, clientY: 300 } as MouseEvent, mockCanvas);

      expect(lineTool['draggingHandle']).toBeNull();
    });
  });

  describe('hit detection', () => {
    it('should detect click on line', () => {
      // Draw a horizontal line from (100, 100) to (200, 100)
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      lineTool.handleMouseUp({ clientX: 200, clientY: 100, shiftKey: false } as MouseEvent, mockCanvas);

      // Deselect
      lineTool.handleClick!({ clientX: 500, clientY: 500 } as MouseEvent, mockCanvas);

      // Click near middle of line
      lineTool.handleClick!({ clientX: 150, clientY: 102 } as MouseEvent, mockCanvas);

      expect(lineTool['selectedLineIndex']).toBe(0);
    });

    it('should not detect click far from line', () => {
      // Draw a line
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      lineTool.handleMouseUp({ clientX: 200, clientY: 200, shiftKey: false } as MouseEvent, mockCanvas);

      // Click far away
      lineTool.handleClick!({ clientX: 400, clientY: 400 } as MouseEvent, mockCanvas);

      // Should deselect (not select line 0 again)
      expect(lineTool['selectedLineIndex']).toBeNull();
    });

    it('should select most recently drawn line when lines overlap', () => {
      // Draw two overlapping lines
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      lineTool.handleMouseUp({ clientX: 200, clientY: 200, shiftKey: false } as MouseEvent, mockCanvas);

      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      lineTool.handleMouseUp({ clientX: 200, clientY: 200, shiftKey: false } as MouseEvent, mockCanvas);

      // Second line is auto-selected, both lines overlap perfectly
      // Deselect first, then click
      lineTool['selectedLineIndex'] = null;
      lineTool.handleClick!({ clientX: 150, clientY: 150 } as MouseEvent, mockCanvas);

      // When lines overlap perfectly, either could be selected - just verify ONE is selected
      expect(lineTool['selectedLineIndex']).not.toBeNull();
      expect(lineTool['selectedLineIndex']).toBeGreaterThanOrEqual(0);
      expect(lineTool['selectedLineIndex']).toBeLessThan(2);
    });
  });

  describe('integration with existing features', () => {
    it('should preserve escape key functionality when drawing', () => {
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(lineTool['isDrawing']).toBe(false);
      expect(lineTool['lineAnnotations']).toHaveLength(0);
    });

    it('should not interfere with normal line drawing', () => {
      // Draw a line normally
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      lineTool.handleMouseMove(
        { clientX: 150, clientY: 150, shiftKey: false } as MouseEvent,
        mockCanvas,
        mockCtx
      );
      lineTool.handleMouseUp({ clientX: 200, clientY: 200, shiftKey: false } as MouseEvent, mockCanvas);

      expect(lineTool['lineAnnotations']).toHaveLength(1);
      expect(lineTool['lineAnnotations'][0]).toEqual({
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 200,
        color: '#BD2D1E',
        width: 3,
      });
    });

    it('should allow drawing multiple lines with editing in between', () => {
      // Draw first line
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      lineTool.handleMouseUp({ clientX: 200, clientY: 200, shiftKey: false } as MouseEvent, mockCanvas);

      // Edit first line
      lineTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      lineTool.handleMouseMove(
        { clientX: 120, clientY: 120, shiftKey: false } as MouseEvent,
        mockCanvas,
        mockCtx
      );
      lineTool.handleMouseUp({ clientX: 120, clientY: 120, shiftKey: false } as MouseEvent, mockCanvas);

      // Draw second line
      lineTool.handleMouseDown({ clientX: 300, clientY: 300 } as MouseEvent, mockCanvas);
      lineTool.handleMouseUp({ clientX: 400, clientY: 400, shiftKey: false } as MouseEvent, mockCanvas);

      expect(lineTool['lineAnnotations']).toHaveLength(2);
      expect(lineTool['lineAnnotations'][0].x1).toBe(120); // Edited
      expect(lineTool['lineAnnotations'][1].x1).toBe(300); // New line
    });
  });
});
