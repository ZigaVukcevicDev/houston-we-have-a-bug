import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { SelectTool } from './select-tool';
import type { LineAnnotation } from '../../../interfaces/annotation.interface';

describe('SelectTool', () => {
  let selectTool: SelectTool;
  let mockRedraw: Mock;
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;
  let lineAnnotations: LineAnnotation[];

  beforeEach(() => {
    mockRedraw = vi.fn();
    lineAnnotations = [
      {
        id: 'line-1',
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 200,
        color: '#BD2D1E',
        width: 3,
      },
      {
        id: 'line-2',
        x1: 300,
        y1: 100,
        x2: 400,
        y2: 200,
        color: '#BD2D1E',
        width: 3,
      },
    ];
    selectTool = new SelectTool(lineAnnotations, [], mockRedraw);

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
      fillStyle: '',
      lineCap: '',
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
  });

  describe('annotation selection', () => {
    it('should select annotation by ID', () => {
      selectTool.selectAnnotation('line-2');

      expect(selectTool['selectedAnnotationId']).toBe('line-2');
      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should change selection when called with different ID', () => {
      selectTool.selectAnnotation('line-1');
      expect(selectTool['selectedAnnotationId']).toBe('line-1');

      selectTool.selectAnnotation('line-2');
      expect(selectTool['selectedAnnotationId']).toBe('line-2');
    });
  });

  describe('line selection', () => {
    it('should select a line when clicked on it', () => {
      // Click near the middle of line-1
      selectTool.handleClick({ clientX: 150, clientY: 150 } as MouseEvent, mockCanvas);

      expect(selectTool['selectedAnnotationId']).toBe('line-1');
      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should select the most recent line when multiple lines overlap', () => {
      // Add a third line at the same position as line-1
      lineAnnotations.push({
        id: 'line-3',
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 200,
        color: '#BD2D1E',
        width: 3,
      });

      // Click on overlapping lines
      selectTool.handleClick({ clientX: 150, clientY: 150 } as MouseEvent, mockCanvas);

      // Should select the most recent one (line-3)
      expect(selectTool['selectedAnnotationId']).toBe('line-3');
    });

    it('should deselect when clicking on empty space', () => {
      // First select a line
      selectTool.handleClick({ clientX: 150, clientY: 150 } as MouseEvent, mockCanvas);
      expect(selectTool['selectedAnnotationId']).toBe('line-1');
      mockRedraw.mockClear();

      // Then click on empty space
      selectTool.handleClick({ clientX: 500, clientY: 500 } as MouseEvent, mockCanvas);

      expect(selectTool['selectedAnnotationId']).toBeNull();
      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should handle scaled canvas correctly', () => {
      mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 400, // Half width
        height: 300, // Half height
      });

      // Click at client coordinates that map to line-1 after scaling
      selectTool.handleClick({ clientX: 75, clientY: 75 } as MouseEvent, mockCanvas);

      expect(selectTool['selectedAnnotationId']).toBe('line-1');
    });
  });

  describe('handle dragging - start handle', () => {
    beforeEach(() => {
      // Select line-1
      selectTool['selectedAnnotationId'] = 'line-1';
    });

    it('should start dragging start handle when clicked', () => {
      selectTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      expect(selectTool['draggingHandle']).toBe('start');
    });

    it('should update start point when dragging start handle', () => {
      selectTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      selectTool.handleMouseMove(
        { clientX: 120, clientY: 120, shiftKey: false } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(lineAnnotations[0].x1).toBe(120);
      expect(lineAnnotations[0].y1).toBe(120);
      expect(lineAnnotations[0].x2).toBe(200); // End point unchanged
      expect(lineAnnotations[0].y2).toBe(200);
      expect(mockRedraw).toHaveBeenCalled();
    });
  });

  describe('handle dragging - end handle', () => {
    beforeEach(() => {
      // Select line-1
      selectTool['selectedAnnotationId'] = 'line-1';
    });

    it('should start dragging end handle when clicked', () => {
      selectTool.handleMouseDown({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas);

      expect(selectTool['draggingHandle']).toBe('end');
    });

    it('should update end point when dragging end handle', () => {
      selectTool.handleMouseDown({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas);

      selectTool.handleMouseMove(
        { clientX: 220, clientY: 220, shiftKey: false } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(lineAnnotations[0].x1).toBe(100); // Start point unchanged
      expect(lineAnnotations[0].y1).toBe(100);
      expect(lineAnnotations[0].x2).toBe(220);
      expect(lineAnnotations[0].y2).toBe(220);
    });

    it('should stop dragging on mouse up', () => {
      selectTool.handleMouseDown({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas);
      expect(selectTool['draggingHandle']).toBe('end');

      selectTool.handleMouseUp();

      expect(selectTool['draggingHandle']).toBeNull();
      expect(selectTool['dragOffset']).toEqual({ x: 0, y: 0 });
      expect(mockRedraw).toHaveBeenCalled();
    });
  });

  describe('cursor management', () => {
    // Note: Cursor is now managed by CSS classes (.mode-select, .mode-line, etc.)
    // not by SelectTool directly, so we don't test style.cursor here

    it('should not update cursor while dragging', () => {
      // First select a line
      selectTool['selectedAnnotationId'] = 'line-1';

      // Then start dragging a handle
      selectTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      mockCanvas.style.cursor = 'move';

      // Move mouse while dragging
      selectTool.handleMouseMove(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      // Cursor should not change during drag
      expect(mockCanvas.style.cursor).toBe('move');
    });
  });

  describe('render', () => {
    it('should not render handles when nothing is selected', () => {
      selectTool.render(mockCtx);

      expect(mockCtx.fillRect).not.toHaveBeenCalled();
      expect(mockCtx.strokeRect).not.toHaveBeenCalled();
    });

    it('should render handles for selected line', () => {
      selectTool['selectedAnnotationId'] = 'line-1';
      selectTool['selectedAnnotationType'] = 'line';

      selectTool.render(mockCtx);

      // Should render 2 handles (start and end)
      expect(mockCtx.fillRect).toHaveBeenCalledTimes(2);
      expect(mockCtx.strokeRect).toHaveBeenCalledTimes(2);
    });

    it('should render handles at correct positions', () => {
      selectTool['selectedAnnotationId'] = 'line-1';
      selectTool['selectedAnnotationType'] = 'line';

      selectTool.render(mockCtx);

      // Check if fillRect was called with correct positions
      // Handles are 8x8 squares, centered at the point
      expect(mockCtx.fillRect).toHaveBeenNthCalledWith(
        1,
        96, // 100 - 4 (half of handleSize)
        96, // 100 - 4
        8,  // handleSize
        8   // handleSize
      );
      expect(mockCtx.fillRect).toHaveBeenNthCalledWith(
        2,
        196, // 200 - 4
        196, // 200 - 4
        8,   // handleSize
        8    // handleSize
      );
    });

    it('should save and restore context when rendering handles', () => {
      selectTool['selectedAnnotationId'] = 'line-1';
      selectTool['selectedAnnotationType'] = 'line';

      selectTool.render(mockCtx);

      expect(mockCtx.save).toHaveBeenCalledTimes(2);
      expect(mockCtx.restore).toHaveBeenCalledTimes(2);
    });

    it('should handle non-existent selected line gracefully', () => {
      selectTool['selectedAnnotationId'] = 'non-existent-id';

      expect(() => selectTool.render(mockCtx)).not.toThrow();
      expect(mockCtx.fillRect).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty line annotations array', () => {
      const emptySelectTool = new SelectTool([], [], mockRedraw);

      emptySelectTool.handleClick({ clientX: 150, clientY: 150 } as MouseEvent, mockCanvas);

      expect(emptySelectTool['selectedAnnotationId']).toBeNull();
    });

    it('should not start dragging if no line is selected', () => {
      selectTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      expect(selectTool['draggingHandle']).toBeNull();
    });

    it('should handle clicking away from handles when line is selected', () => {
      selectTool['selectedAnnotationId'] = 'line-1';

      // Click somewhere that's not on a handle
      selectTool.handleMouseDown({ clientX: 150, clientY: 150 } as MouseEvent, mockCanvas);

      expect(selectTool['draggingHandle']).toBeNull();
    });

    it('should handle drag offset correctly', () => {
      selectTool['selectedAnnotationId'] = 'line-1';

      // Mouse down at position slightly offset from handle center
      selectTool.handleMouseDown({ clientX: 102, clientY: 103 } as MouseEvent, mockCanvas);

      expect(selectTool['dragOffset']).toEqual({ x: 2, y: 3 });

      // When dragging, the offset should be applied
      selectTool.handleMouseMove(
        { clientX: 150, clientY: 150, shiftKey: false } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(lineAnnotations[0].x1).toBe(148); // 150 - 2
      expect(lineAnnotations[0].y1).toBe(147); // 150 - 3
    });

    it('should handle canvas with offset', () => {
      mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 50,
        top: 100,
        width: 800,
        height: 600,
      });

      selectTool.handleClick({ clientX: 200, clientY: 250 } as MouseEvent, mockCanvas);

      // Should account for canvas offset (clientX - left = 150, clientY - top = 150)
      expect(selectTool['selectedAnnotationId']).toBe('line-1');
    });
  });

  describe('integration scenarios', () => {
    it('should handle full select -> drag -> deselect workflow', () => {
      // 1. Select line
      selectTool.handleClick({ clientX: 150, clientY: 150 } as MouseEvent, mockCanvas);
      expect(selectTool['selectedAnnotationId']).toBe('line-1');

      // 2. Drag handle
      selectTool.handleMouseDown({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas);
      selectTool.handleMouseMove(
        { clientX: 220, clientY: 220, shiftKey: false } as MouseEvent,
        mockCanvas,
        mockCtx
      );
      expect(lineAnnotations[0].x2).toBe(220);

      // 3. Release
      selectTool.handleMouseUp();
      expect(selectTool['draggingHandle']).toBeNull();

      // 4. Deselect
      selectTool.handleClick({ clientX: 500, clientY: 500 } as MouseEvent, mockCanvas);
      expect(selectTool['selectedAnnotationId']).toBeNull();
    });

    it('should allow switching selection between lines', () => {
      // Select first line
      selectTool.handleClick({ clientX: 150, clientY: 150 } as MouseEvent, mockCanvas);
      expect(selectTool['selectedAnnotationId']).toBe('line-1');

      // Select second line
      selectTool.handleClick({ clientX: 350, clientY: 150 } as MouseEvent, mockCanvas);
      expect(selectTool['selectedAnnotationId']).toBe('line-2');
    });
  });

  describe('line body dragging', () => {
    it('should start dragging line when clicking on line body', () => {
      selectTool['selectedAnnotationId'] = 'line-1';

      // Click on line body (not on handles)
      selectTool.handleMouseDown({ clientX: 150, clientY: 150 } as MouseEvent, mockCanvas);

      expect(selectTool['draggingLine']).toBe(true);
    });

    it('should move entire line when dragging line body', () => {
      selectTool['selectedAnnotationId'] = 'line-1';
      const originalX1 = lineAnnotations[0].x1;
      const originalY1 = lineAnnotations[0].y1;
      const originalX2 = lineAnnotations[0].x2;
      const originalY2 = lineAnnotations[0].y2;

      // Start dragging line body
      selectTool.handleMouseDown({ clientX: 150, clientY: 150 } as MouseEvent, mockCanvas);

      // Drag to new position
      selectTool.handleMouseMove(
        { clientX: 180, clientY: 180 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      // Both endpoints should have moved by the same amount
      const dx = lineAnnotations[0].x1 - originalX1;
      const dy = lineAnnotations[0].y1 - originalY1;

      expect(lineAnnotations[0].x2).toBe(originalX2 + dx);
      expect(lineAnnotations[0].y2).toBe(originalY2 + dy);
      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should stop dragging line on mouse up', () => {
      selectTool['selectedAnnotationId'] = 'line-1';
      selectTool.handleMouseDown({ clientX: 150, clientY: 150 } as MouseEvent, mockCanvas);

      selectTool.handleMouseUp();

      expect(selectTool['draggingLine']).toBe(false);
    });
  });

  describe('hover detection', () => {
    it('should track hovered annotation on mouse move', () => {
      // Initially no hover
      expect(selectTool['hoveredAnnotationId']).toBeNull();

      // Move mouse over line-1
      selectTool.handleMouseMove(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(selectTool['hoveredAnnotationId']).toBe('line-1');
      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should clear hovered annotation when moving away', () => {
      // First hover over a line
      selectTool.handleMouseMove(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas,
        mockCtx
      );
      expect(selectTool['hoveredAnnotationId']).toBe('line-1');
      mockRedraw.mockClear();

      // Move mouse to empty space
      selectTool.handleMouseMove(
        { clientX: 500, clientY: 500 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(selectTool['hoveredAnnotationId']).toBeNull();
      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should render stroke for hovered annotation', () => {
      // Hover over line-1
      selectTool['hoveredAnnotationId'] = 'line-1';
      selectTool['hoveredAnnotationType'] = 'line';

      selectTool.render(mockCtx);

      // Should draw stroke outline and the line itself
      expect(mockCtx.strokeStyle).toBeDefined();
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should not show hover stroke for selected annotation', () => {
      // Select and hover the same line
      selectTool['selectedAnnotationId'] = 'line-1';
      selectTool['selectedAnnotationType'] = 'line';
      selectTool['hoveredAnnotationId'] = 'line-1';
      selectTool['hoveredAnnotationType'] = 'line';

      const beginPathCalls = mockCtx.beginPath as any;
      beginPathCalls.mockClear();

      selectTool.render(mockCtx);

      // Should only render handles, not the hover stroke
      // Handles: 2 calls (one for each handle)
      // No extra calls for hover stroke
      expect(mockCtx.fillRect).toHaveBeenCalledTimes(2);
    });

    it('should hover most recent line when multiple overlap', () => {
      // Add a third line at the same position as line-1
      lineAnnotations.push({
        id: 'line-3',
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 200,
        color: '#BD2D1E',
        width: 5,
      });

      // Move mouse over overlapping lines
      selectTool.handleMouseMove(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      // Should hover the most recent one (line-3)
      expect(selectTool['hoveredAnnotationId']).toBe('line-3');
    });

    it('should clear hover when dragging', () => {
      // First select and hover a line
      selectTool['selectedAnnotationId'] = 'line-1';
      selectTool['hoveredAnnotationId'] = 'line-1';

      // Start dragging handle
      selectTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      mockRedraw.mockClear();

      // Move mouse while dragging
      selectTool.handleMouseMove(
        { clientX: 120, clientY: 120 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      // Hover should be cleared when over a handle during drag
      expect(selectTool['draggingHandle']).toBe('start');
    });
  });
});
