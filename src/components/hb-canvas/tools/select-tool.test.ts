import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  afterEach,
} from 'vitest';
import { SelectTool } from './select-tool';
import type {
  LineAnnotation,
  RectangleAnnotation,
  TextAnnotation,
} from '../../../interfaces/annotation.interface';

describe('SelectTool', () => {
  let selectTool: SelectTool;
  let mockRedraw: Mock;
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;
  let lineAnnotations: LineAnnotation[];
  let arrowAnnotations: LineAnnotation[];
  let rectangleAnnotations: RectangleAnnotation[];

  beforeEach(() => {
    mockRedraw = vi.fn();
    lineAnnotations = [
      {
        id: 'line-1',
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 200,
        color: '#E74C3C',
        width: 3,
      },
      {
        id: 'line-2',
        x1: 300,
        y1: 100,
        x2: 400,
        y2: 200,
        color: '#E74C3C',
        width: 3,
      },
    ];
    arrowAnnotations = [];
    rectangleAnnotations = [
      {
        id: 'rect-1',
        x: 100,
        y: 300,
        width: 100,
        height: 50,
        color: '#E74C3C',
        strokeWidth: 5,
      },
      {
        id: 'rect-2',
        x: 300,
        y: 300,
        width: 80,
        height: 60,
        color: '#E74C3C',
        strokeWidth: 5,
      },
    ];
    selectTool = new SelectTool(
      lineAnnotations,
      arrowAnnotations,
      rectangleAnnotations,
      [],
      mockRedraw
    );

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
      lineJoin: '',
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      rect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    // Activate the tool to register event listeners
    selectTool.activate();
  });

  afterEach(() => {
    // Clean up event listeners
    selectTool.deactivate();
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

    it('should deselect all annotations when deselectAll is called', () => {
      // First select something
      selectTool.selectAnnotation('line-1');
      expect(selectTool['selectedAnnotationId']).toBe('line-1');
      expect(selectTool['selectedAnnotationType']).toBe('line');
      mockRedraw.mockClear();

      // Then deselect all
      selectTool.deselectAll();

      expect(selectTool['selectedAnnotationId']).toBeNull();
      expect(selectTool['selectedAnnotationType']).toBeNull();
      expect(selectTool['hoveredAnnotationId']).toBeNull();
      expect(selectTool['hoveredAnnotationType']).toBeNull();
      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should clear hover state when deselectAll is called', () => {
      // Set up selected and hovered state
      selectTool['selectedAnnotationId'] = 'line-1';
      selectTool['selectedAnnotationType'] = 'line';
      selectTool['hoveredAnnotationId'] = 'line-2';
      selectTool['hoveredAnnotationType'] = 'line';

      selectTool.deselectAll();

      expect(selectTool['selectedAnnotationId']).toBeNull();
      expect(selectTool['hoveredAnnotationId']).toBeNull();
    });
  });

  describe('line selection', () => {
    it('should select a line when clicked on it', () => {
      // Click near the middle of line-1
      selectTool.handleClick(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas
      );

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
        color: '#E74C3C',
        width: 3,
      });

      // Click on overlapping lines
      selectTool.handleClick(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas
      );

      // Should select the most recent one (line-3)
      expect(selectTool['selectedAnnotationId']).toBe('line-3');
    });

    it('should deselect when clicking on empty space', () => {
      // First select a line
      selectTool.handleClick(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas
      );
      expect(selectTool['selectedAnnotationId']).toBe('line-1');
      mockRedraw.mockClear();

      // Then click on empty space
      selectTool.handleClick(
        { clientX: 500, clientY: 500 } as MouseEvent,
        mockCanvas
      );

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
      selectTool.handleClick(
        { clientX: 75, clientY: 75 } as MouseEvent,
        mockCanvas
      );

      expect(selectTool['selectedAnnotationId']).toBe('line-1');
    });
  });

  describe('handle dragging - start handle', () => {
    beforeEach(() => {
      // Select line-1
      selectTool['selectedAnnotationId'] = 'line-1';
      selectTool['selectedAnnotationType'] = 'line';
    });

    it('should start dragging start handle when clicked', () => {
      selectTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );

      expect(selectTool['draggingHandle']).toBe('start');
    });

    it('should update start point when dragging start handle', () => {
      selectTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );

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
      selectTool['selectedAnnotationType'] = 'line';
    });

    it('should start dragging end handle when clicked', () => {
      selectTool.handleMouseDown(
        { clientX: 200, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      expect(selectTool['draggingHandle']).toBe('end');
    });

    it('should update end point when dragging end handle', () => {
      selectTool.handleMouseDown(
        { clientX: 200, clientY: 200 } as MouseEvent,
        mockCanvas
      );

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
      selectTool.handleMouseDown(
        { clientX: 200, clientY: 200 } as MouseEvent,
        mockCanvas
      );
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
      selectTool['selectedAnnotationType'] = 'line';

      // Then start dragging a handle
      selectTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
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
        8, // handleSize
        8 // handleSize
      );
      expect(mockCtx.fillRect).toHaveBeenNthCalledWith(
        2,
        196, // 200 - 4
        196, // 200 - 4
        8, // handleSize
        8 // handleSize
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
      const emptySelectTool = new SelectTool([], [], [], [], mockRedraw);

      emptySelectTool.handleClick(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas
      );

      expect(emptySelectTool['selectedAnnotationId']).toBeNull();
    });

    it('should not start dragging if no line is selected', () => {
      selectTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );

      expect(selectTool['draggingHandle']).toBeNull();
    });

    it('should handle clicking away from handles when line is selected', () => {
      selectTool['selectedAnnotationId'] = 'line-1';
      selectTool['selectedAnnotationType'] = 'line';

      // Click somewhere that's not on a handle
      selectTool.handleMouseDown(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas
      );

      expect(selectTool['draggingHandle']).toBeNull();
    });

    it('should handle drag offset correctly', () => {
      selectTool['selectedAnnotationId'] = 'line-1';
      selectTool['selectedAnnotationType'] = 'line';

      // Mouse down at position slightly offset from handle center
      selectTool.handleMouseDown(
        { clientX: 102, clientY: 103 } as MouseEvent,
        mockCanvas
      );

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

      selectTool.handleClick(
        { clientX: 200, clientY: 250 } as MouseEvent,
        mockCanvas
      );

      // Should account for canvas offset (clientX - left = 150, clientY - top = 150)
      expect(selectTool['selectedAnnotationId']).toBe('line-1');
    });
  });

  describe('integration scenarios', () => {
    it('should handle full select -> drag -> deselect workflow', () => {
      // 1. Select line
      selectTool.handleClick(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas
      );
      expect(selectTool['selectedAnnotationId']).toBe('line-1');

      // 2. Drag handle
      selectTool.handleMouseDown(
        { clientX: 200, clientY: 200 } as MouseEvent,
        mockCanvas
      );
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
      selectTool.handleClick(
        { clientX: 500, clientY: 500 } as MouseEvent,
        mockCanvas
      );
      expect(selectTool['selectedAnnotationId']).toBeNull();
    });

    it('should allow switching selection between lines', () => {
      // Select first line
      selectTool.handleClick(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas
      );
      expect(selectTool['selectedAnnotationId']).toBe('line-1');

      // Select second line
      selectTool.handleClick(
        { clientX: 350, clientY: 150 } as MouseEvent,
        mockCanvas
      );
      expect(selectTool['selectedAnnotationId']).toBe('line-2');
    });
  });

  describe('line body dragging', () => {
    it('should start dragging line when clicking on line body', () => {
      selectTool['selectedAnnotationId'] = 'line-1';
      selectTool['selectedAnnotationType'] = 'line';

      // Click on line body (not on handles)
      selectTool.handleMouseDown(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas
      );

      expect(selectTool['draggingLine']).toBe(true);
    });

    it('should move entire line when dragging line body', () => {
      selectTool['selectedAnnotationId'] = 'line-1';
      selectTool['selectedAnnotationType'] = 'line';
      const originalX1 = lineAnnotations[0].x1;
      const originalY1 = lineAnnotations[0].y1;
      const originalX2 = lineAnnotations[0].x2;
      const originalY2 = lineAnnotations[0].y2;

      // Start dragging line body
      selectTool.handleMouseDown(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas
      );

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
      selectTool['selectedAnnotationType'] = 'line';
      selectTool.handleMouseDown(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas
      );

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

      const beginPathCalls = mockCtx.beginPath as Mock;
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
        color: '#E74C3C',
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
      selectTool['selectedAnnotationType'] = 'line';
      selectTool['hoveredAnnotationId'] = 'line-1';

      // Start dragging handle
      selectTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
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

  describe('rectangle selection', () => {
    it('should select a rectangle when clicked on it', () => {
      // Click on rect-1's edge
      selectTool.handleClick(
        { clientX: 100, clientY: 310 } as MouseEvent,
        mockCanvas
      );

      expect(selectTool['selectedAnnotationId']).toBe('rect-1');
      expect(selectTool['selectedAnnotationType']).toBe('rectangle');
      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should select the most recent rectangle when multiple rectangles overlap', () => {
      // Add a third rectangle at the same position as rect-1
      rectangleAnnotations.push({
        id: 'rect-3',
        x: 100,
        y: 300,
        width: 100,
        height: 50,
        color: '#E74C3C',
        strokeWidth: 5,
      });

      // Click on overlapping rectangles
      selectTool.handleClick(
        { clientX: 100, clientY: 310 } as MouseEvent,
        mockCanvas
      );

      // Should select the most recent one (rect-3)
      expect(selectTool['selectedAnnotationId']).toBe('rect-3');
    });

    it('should render handles for selected rectangle', () => {
      selectTool['selectedAnnotationId'] = 'rect-1';
      selectTool['selectedAnnotationType'] = 'rectangle';

      selectTool.render(mockCtx);

      // Should render 4 corner handles
      expect(mockCtx.fillRect).toHaveBeenCalledTimes(4);
      expect(mockCtx.strokeRect).toHaveBeenCalledTimes(4);
    });

    it('should render handles at correct corner positions', () => {
      selectTool['selectedAnnotationId'] = 'rect-1';
      selectTool['selectedAnnotationType'] = 'rectangle';

      selectTool.render(mockCtx);

      // Check positions of the 4 corner handles
      // Top-left
      expect(mockCtx.fillRect).toHaveBeenNthCalledWith(1, 96, 296, 8, 8);
      // Top-right
      expect(mockCtx.fillRect).toHaveBeenNthCalledWith(2, 196, 296, 8, 8);
      // Bottom-left
      expect(mockCtx.fillRect).toHaveBeenNthCalledWith(3, 96, 346, 8, 8);
      // Bottom-right
      expect(mockCtx.fillRect).toHaveBeenNthCalledWith(4, 196, 346, 8, 8);
    });
  });

  describe('rectangle body dragging', () => {
    it('should start dragging rectangle when clicking on rectangle edge', () => {
      selectTool['selectedAnnotationId'] = 'rect-1';
      selectTool['selectedAnnotationType'] = 'rectangle';

      // Click on rectangle edge
      selectTool.handleMouseDown(
        { clientX: 100, clientY: 310 } as MouseEvent,
        mockCanvas
      );

      expect(selectTool['draggingLine']).toBe(true);
    });

    it('should move entire rectangle when dragging rectangle body', () => {
      selectTool['selectedAnnotationId'] = 'rect-1';
      selectTool['selectedAnnotationType'] = 'rectangle';
      const originalX = rectangleAnnotations[0].x;
      const originalY = rectangleAnnotations[0].y;

      // Start dragging rectangle body (click on left edge)
      selectTool.handleMouseDown(
        { clientX: 100, clientY: 310 } as MouseEvent,
        mockCanvas
      );

      // Drag to new position
      selectTool.handleMouseMove(
        { clientX: 130, clientY: 340 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      // Rectangle position should have moved
      expect(rectangleAnnotations[0].x).toBe(originalX + 30);
      expect(rectangleAnnotations[0].y).toBe(originalY + 30);
      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should stop dragging rectangle on mouse up', () => {
      selectTool['selectedAnnotationId'] = 'rect-1';
      selectTool['selectedAnnotationType'] = 'rectangle';
      selectTool.handleMouseDown(
        { clientX: 110, clientY: 310 } as MouseEvent,
        mockCanvas
      );

      selectTool.handleMouseUp();

      expect(selectTool['draggingLine']).toBe(false);
    });

    it('should not change rectangle size when dragging', () => {
      selectTool['selectedAnnotationId'] = 'rect-1';
      selectTool['selectedAnnotationType'] = 'rectangle';
      const originalWidth = rectangleAnnotations[0].width;
      const originalHeight = rectangleAnnotations[0].height;

      // Start dragging and move
      selectTool.handleMouseDown(
        { clientX: 110, clientY: 310 } as MouseEvent,
        mockCanvas
      );
      selectTool.handleMouseMove(
        { clientX: 140, clientY: 340 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      // Width and height should remain unchanged
      expect(rectangleAnnotations[0].width).toBe(originalWidth);
      expect(rectangleAnnotations[0].height).toBe(originalHeight);
    });
  });

  describe('rectangle corner handle resizing', () => {
    beforeEach(() => {
      selectTool['selectedAnnotationId'] = 'rect-1';
      selectTool['selectedAnnotationType'] = 'rectangle';
    });

    it('should start dragging when clicking on top-left corner handle', () => {
      selectTool.handleMouseDown(
        { clientX: 100, clientY: 300 } as MouseEvent,
        mockCanvas
      );

      expect(selectTool['draggingHandle']).toBe('top-left');
    });

    it('should resize rectangle when dragging top-left corner', () => {
      const originalWidth = rectangleAnnotations[0].width;
      const originalHeight = rectangleAnnotations[0].height;

      // Click on top-left corner
      selectTool.handleMouseDown(
        { clientX: 100, clientY: 300 } as MouseEvent,
        mockCanvas
      );

      // Drag to new position (moving corner inward)
      selectTool.handleMouseMove(
        { clientX: 120, clientY: 320 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      // Rectangle should be resized from top-left
      expect(rectangleAnnotations[0].x).toBe(120);
      expect(rectangleAnnotations[0].y).toBe(320);
      expect(rectangleAnnotations[0].width).toBe(originalWidth - 20);
      expect(rectangleAnnotations[0].height).toBe(originalHeight - 20);
    });

    it('should resize rectangle when dragging top-right corner', () => {
      const originalX = rectangleAnnotations[0].x;
      const originalWidth = rectangleAnnotations[0].width;
      const originalHeight = rectangleAnnotations[0].height;

      // Click on top-right corner (x=200, y=300)
      selectTool.handleMouseDown(
        { clientX: 200, clientY: 300 } as MouseEvent,
        mockCanvas
      );

      // Drag to new position
      selectTool.handleMouseMove(
        { clientX: 220, clientY: 320 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      // Rectangle should be resized from top-right
      expect(rectangleAnnotations[0].x).toBe(originalX); // x unchanged
      expect(rectangleAnnotations[0].y).toBe(320); // y moved
      expect(rectangleAnnotations[0].width).toBe(originalWidth + 20);
      expect(rectangleAnnotations[0].height).toBe(originalHeight - 20);
    });

    it('should resize rectangle when dragging bottom-left corner', () => {
      const originalY = rectangleAnnotations[0].y;
      const originalWidth = rectangleAnnotations[0].width;
      const originalHeight = rectangleAnnotations[0].height;

      // Click on bottom-left corner (x=100, y=350)
      selectTool.handleMouseDown(
        { clientX: 100, clientY: 350 } as MouseEvent,
        mockCanvas
      );

      // Drag to new position
      selectTool.handleMouseMove(
        { clientX: 120, clientY: 370 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      // Rectangle should be resized from bottom-left
      expect(rectangleAnnotations[0].x).toBe(120); // x moved
      expect(rectangleAnnotations[0].y).toBe(originalY); // y unchanged
      expect(rectangleAnnotations[0].width).toBe(originalWidth - 20);
      expect(rectangleAnnotations[0].height).toBe(originalHeight + 20);
    });

    it('should resize rectangle when dragging bottom-right corner', () => {
      const originalX = rectangleAnnotations[0].x;
      const originalY = rectangleAnnotations[0].y;
      const originalWidth = rectangleAnnotations[0].width;
      const originalHeight = rectangleAnnotations[0].height;

      // Click on bottom-right corner (x=200, y=350)
      selectTool.handleMouseDown(
        { clientX: 200, clientY: 350 } as MouseEvent,
        mockCanvas
      );

      // Drag to new position
      selectTool.handleMouseMove(
        { clientX: 220, clientY: 370 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      // Rectangle should be resized from bottom-right
      expect(rectangleAnnotations[0].x).toBe(originalX); // x unchanged
      expect(rectangleAnnotations[0].y).toBe(originalY); // y unchanged
      expect(rectangleAnnotations[0].width).toBe(originalWidth + 20);
      expect(rectangleAnnotations[0].height).toBe(originalHeight + 20);
    });

    it('should stop dragging corner handle on mouse up', () => {
      selectTool.handleMouseDown(
        { clientX: 100, clientY: 300 } as MouseEvent,
        mockCanvas
      );
      expect(selectTool['draggingHandle']).toBe('top-left');

      selectTool.handleMouseUp();

      expect(selectTool['draggingHandle']).toBeNull();
    });
  });

  describe('rectangle hover detection', () => {
    it('should track hovered rectangle on mouse move', () => {
      expect(selectTool['hoveredAnnotationId']).toBeNull();

      // Move mouse over rect-1 edge
      selectTool.handleMouseMove(
        { clientX: 100, clientY: 310 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(selectTool['hoveredAnnotationId']).toBe('rect-1');
      expect(selectTool['hoveredAnnotationType']).toBe('rectangle');
      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should render stroke for hovered rectangle', () => {
      selectTool['hoveredAnnotationId'] = 'rect-1';
      selectTool['hoveredAnnotationType'] = 'rectangle';

      selectTool.render(mockCtx);

      expect(mockCtx.strokeStyle).toBeDefined();
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should not show hover stroke for selected rectangle', () => {
      // Select and hover the same rectangle
      selectTool['selectedAnnotationId'] = 'rect-1';
      selectTool['selectedAnnotationType'] = 'rectangle';
      selectTool['hoveredAnnotationId'] = 'rect-1';
      selectTool['hoveredAnnotationType'] = 'rectangle';

      const beginPathCalls = mockCtx.beginPath as Mock;
      beginPathCalls.mockClear();

      selectTool.render(mockCtx);

      // Should only render handles (4 for rectangle corners)
      expect(mockCtx.fillRect).toHaveBeenCalledTimes(4);
    });

    it('should detect hover near top-left corner (vertical edge)', () => {
      // Test hovering slightly above the top-left corner on the left edge
      selectTool.handleMouseMove(
        { clientX: 100, clientY: 295 } as MouseEvent, // y=295 is just above rect y=300 but within threshold
        mockCanvas,
        mockCtx
      );

      expect(selectTool['hoveredAnnotationId']).toBe('rect-1');
    });

    it('should detect hover near top-left corner (horizontal edge)', () => {
      // Test hovering slightly left of the top-left corner on the top edge
      selectTool.handleMouseMove(
        { clientX: 95, clientY: 300 } as MouseEvent, // x=95 is just left of rect x=100 but within threshold
        mockCanvas,
        mockCtx
      );

      expect(selectTool['hoveredAnnotationId']).toBe('rect-1');
    });
  });

  describe('arrow hover detection with arrowhead', () => {
    beforeEach(() => {
      // Add an arrow to arrowAnnotations array
      arrowAnnotations.push({
        id: 'arrow-1',
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 100, // Horizontal arrow pointing right
        color: '#E74C3C',
        width: 5,
      });
      selectTool = new SelectTool(
        lineAnnotations,
        arrowAnnotations,
        rectangleAnnotations,
        [],
        mockRedraw
      );
    });

    it('should detect hover on arrow line body', () => {
      // Hover on the middle of the line
      selectTool.handleMouseMove(
        { clientX: 150, clientY: 100 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(selectTool['hoveredAnnotationId']).toBe('arrow-1');
      expect(selectTool['hoveredAnnotationType']).toBe('line');
    });

    it('should detect hover on arrowhead - upper line', () => {
      // Hover near the upper arrowhead line
      // For horizontal arrow at y=100, upper arrowhead line goes up and to the left
      selectTool.handleMouseMove(
        { clientX: 195, clientY: 95 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(selectTool['hoveredAnnotationId']).toBe('arrow-1');
      expect(selectTool['hoveredAnnotationType']).toBe('line');
    });

    it('should detect hover on arrowhead - lower line', () => {
      // Hover near the lower arrowhead line
      selectTool.handleMouseMove(
        { clientX: 195, clientY: 105 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(selectTool['hoveredAnnotationId']).toBe('arrow-1');
      expect(selectTool['hoveredAnnotationType']).toBe('line');
    });

    it('should detect hover on arrowhead tip', () => {
      // Hover right at the arrow endpoint where arrowhead starts
      selectTool.handleMouseMove(
        { clientX: 200, clientY: 100 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(selectTool['hoveredAnnotationId']).toBe('arrow-1');
    });

    it('should not detect hover far from arrow and arrowhead', () => {
      // Clear all annotations and add only arrow to arrow array
      lineAnnotations.length = 0;
      arrowAnnotations.length = 0;
      arrowAnnotations.push({
        id: 'arrow-1',
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 100,
        color: '#E74C3C',
        width: 5,
      });
      selectTool = new SelectTool(
        lineAnnotations,
        arrowAnnotations,
        rectangleAnnotations,
        [],
        mockRedraw
      );

      // Hover way below the arrow
      selectTool.handleMouseMove(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(selectTool['hoveredAnnotationId']).toBeNull();
    });

    it('should detect zero-length line (point) correctly', () => {
      // Clear all lines and add only a zero-length line
      lineAnnotations.length = 0;
      lineAnnotations.push({
        id: 'point-line',
        x1: 200,
        y1: 200,
        x2: 200,
        y2: 200,
        color: '#E74C3C',
        width: 5,
      });
      selectTool = new SelectTool(
        lineAnnotations,
        arrowAnnotations,
        rectangleAnnotations,
        [],
        mockRedraw
      );

      // Hover exactly on the point to trigger lengthSquared === 0 case
      selectTool.handleMouseMove(
        { clientX: 200, clientY: 200 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(selectTool['hoveredAnnotationId']).toBe('point-line');
    });

    it('should work with diagonal arrows', () => {
      // Add a diagonal arrow
      arrowAnnotations.push({
        id: 'arrow-diag',
        x1: 50,
        y1: 50,
        x2: 150,
        y2: 150,
        color: '#E74C3C',
        width: 5,
      });
      selectTool = new SelectTool(
        lineAnnotations,
        arrowAnnotations,
        rectangleAnnotations,
        [],
        mockRedraw
      );

      // Hover near the diagonal arrowhead
      selectTool.handleMouseMove(
        { clientX: 145, clientY: 140 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(selectTool['hoveredAnnotationId']).toBe('arrow-diag');
    });

    it('should distinguish between regular lines and arrows', () => {
      // Clear and add only an arrow
      lineAnnotations.length = 0;
      // Add an arrow to arrow array
      arrowAnnotations.push({
        id: 'arrow-only',
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 100,
        color: '#E74C3C',
        width: 5,
      });

      selectTool = new SelectTool(
        lineAnnotations,
        arrowAnnotations,
        rectangleAnnotations,
        [],
        mockRedraw
      );

      // Now clear arrowAnnotations and add to lineAnnotations to make it a regular line
      arrowAnnotations.length = 0;
      lineAnnotations.push({
        id: 'line-only',
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 100,
        color: '#E74C3C',
        width: 5,
      });
      selectTool = new SelectTool(
        lineAnnotations,
        arrowAnnotations,
        rectangleAnnotations,
        [],
        mockRedraw
      );

      // Hover where arrowhead would be - should not detect for regular line
      // This point is only near arrowhead, not the main line body
      selectTool.handleMouseMove(
        { clientX: 190, clientY: 90 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      // Should not hover on line without arrowhead at this distant point
      expect(selectTool['hoveredAnnotationId']).toBeNull();
    });
  });

  describe('rectangle edge cases', () => {
    it('should handle empty rectangle annotations array', () => {
      const emptySelectTool = new SelectTool([], [], [], [], mockRedraw);

      emptySelectTool.handleClick(
        { clientX: 150, clientY: 310 } as MouseEvent,
        mockCanvas
      );

      expect(emptySelectTool['selectedAnnotationId']).toBeNull();
    });

    it('should not start dragging if no rectangle is selected', () => {
      selectTool.handleMouseDown(
        { clientX: 110, clientY: 310 } as MouseEvent,
        mockCanvas
      );

      expect(selectTool['draggingLine']).toBe(false);
    });

    it('should handle switching between line and rectangle selection', () => {
      // Select a line first
      selectTool.handleClick(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas
      );
      expect(selectTool['selectedAnnotationId']).toBe('line-1');
      expect(selectTool['selectedAnnotationType']).toBe('line');

      // Select a rectangle
      selectTool.handleClick(
        { clientX: 100, clientY: 310 } as MouseEvent,
        mockCanvas
      );
      expect(selectTool['selectedAnnotationId']).toBe('rect-1');
      expect(selectTool['selectedAnnotationType']).toBe('rectangle');
    });
  });

  describe('direct drag on hover', () => {
    it('should start dragging unselected line immediately on mousedown', () => {
      // No selection initially
      expect(selectTool['selectedAnnotationId']).toBeNull();

      // Click on line-1 (not selected)
      selectTool.handleMouseDown(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas
      );

      // Should auto-select and start dragging
      expect(selectTool['selectedAnnotationId']).toBe('line-1');
      expect(selectTool['selectedAnnotationType']).toBe('line');
      expect(selectTool['draggingLine']).toBe(true);
    });

    it('should move unselected line when dragging', () => {
      const originalX1 = lineAnnotations[0].x1;
      const originalY1 = lineAnnotations[0].y1;
      const originalX2 = lineAnnotations[0].x2;
      const originalY2 = lineAnnotations[0].y2;

      // Click on unselected line
      selectTool.handleMouseDown(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas
      );

      // Drag to new position
      selectTool.handleMouseMove(
        { clientX: 180, clientY: 180 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      // Line should have moved
      const dx = lineAnnotations[0].x1 - originalX1;
      const dy = lineAnnotations[0].y1 - originalY1;
      expect(lineAnnotations[0].x2).toBe(originalX2 + dx);
      expect(lineAnnotations[0].y2).toBe(originalY2 + dy);
    });

    it('should start dragging unselected rectangle immediately on mousedown', () => {
      // No selection initially
      expect(selectTool['selectedAnnotationId']).toBeNull();

      // Click on rect-1 (not selected)
      selectTool.handleMouseDown(
        { clientX: 100, clientY: 310 } as MouseEvent,
        mockCanvas
      );

      // Should auto-select and start dragging
      expect(selectTool['selectedAnnotationId']).toBe('rect-1');
      expect(selectTool['selectedAnnotationType']).toBe('rectangle');
      expect(selectTool['draggingLine']).toBe(true);
    });

    it('should move unselected rectangle when dragging', () => {
      const originalX = rectangleAnnotations[0].x;
      const originalY = rectangleAnnotations[0].y;

      // Click on unselected rectangle
      selectTool.handleMouseDown(
        { clientX: 100, clientY: 310 } as MouseEvent,
        mockCanvas
      );

      // Drag to new position
      selectTool.handleMouseMove(
        { clientX: 130, clientY: 340 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      // Rectangle should have moved
      expect(rectangleAnnotations[0].x).toBe(originalX + 30);
      expect(rectangleAnnotations[0].y).toBe(originalY + 30);
    });

    it('should prioritize selected annotation over hovered annotation', () => {
      // Select line-1
      selectTool['selectedAnnotationId'] = 'line-1';
      selectTool['selectedAnnotationType'] = 'line';

      // Click on line-2 area (but line-1 is selected and we're on it)
      selectTool.handleMouseDown(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas
      );

      // Should still be dragging line-1  (the selected one)
      expect(selectTool['selectedAnnotationId']).toBe('line-1');
      expect(selectTool['draggingLine']).toBe(true);
    });
  });

  describe('delete key functionality', () => {
    it('should delete selected line when Delete key is pressed', () => {
      // Select a line
      selectTool.selectAnnotation('line-1');
      const initialLength = lineAnnotations.length;

      // Simulate Delete key press
      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      document.dispatchEvent(deleteEvent);

      // Line should be deleted
      expect(lineAnnotations.length).toBe(initialLength - 1);
      expect(lineAnnotations.find((l) => l.id === 'line-1')).toBeUndefined();
      expect(selectTool['selectedAnnotationId']).toBeNull();
    });

    it('should delete selected rectangle when Backspace key is pressed', () => {
      // Select a rectangle
      selectTool.selectAnnotation('rect-1');
      const initialLength = rectangleAnnotations.length;

      // Simulate Backspace key press
      const backspaceEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
      document.dispatchEvent(backspaceEvent);

      // Rectangle should be deleted
      expect(rectangleAnnotations.length).toBe(initialLength - 1);
      expect(
        rectangleAnnotations.find((r) => r.id === 'rect-1')
      ).toBeUndefined();
      expect(selectTool['selectedAnnotationId']).toBeNull();
    });

    it('should not delete when no annotation is selected', () => {
      const initialLinesLength = lineAnnotations.length;
      const initialRectsLength = rectangleAnnotations.length;

      // Simulate Delete key press with no selection
      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      document.dispatchEvent(deleteEvent);

      // Nothing should be deleted
      expect(lineAnnotations.length).toBe(initialLinesLength);
      expect(rectangleAnnotations.length).toBe(initialRectsLength);
    });

    it('should cleanup event listener on deactivate', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      selectTool.deactivate();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
      expect(selectTool['keydownHandler']).toBeNull();
    });

    it('should delete selected arrow when Delete key is pressed', () => {
      arrowAnnotations.push({
        id: 'arrow-1',
        x1: 400,
        y1: 400,
        x2: 500,
        y2: 500,
        color: '#E74C3C',
        width: 3,
      });

      selectTool.deactivate();
      selectTool = new SelectTool(
        lineAnnotations,
        arrowAnnotations,
        rectangleAnnotations,
        [],
        mockRedraw
      );
      selectTool.activate();

      selectTool.selectAnnotation('arrow-1');
      const initialLength = arrowAnnotations.length;

      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      document.dispatchEvent(deleteEvent);

      expect(arrowAnnotations.length).toBe(initialLength - 1);
      expect(arrowAnnotations.find((a) => a.id === 'arrow-1')).toBeUndefined();
      expect(selectTool['selectedAnnotationId']).toBeNull();
    });
  });

  describe('zero-length line detection', () => {
    it('should detect hover on zero-length line', () => {
      lineAnnotations.push({
        id: 'point-1',
        x1: 200,
        y1: 200,
        x2: 200,
        y2: 200,
        color: '#E74C3C',
        width: 3,
      });

      selectTool = new SelectTool(
        lineAnnotations,
        arrowAnnotations,
        rectangleAnnotations,
        [],
        mockRedraw
      );

      selectTool.handleMouseMove(
        { clientX: 200, clientY: 200 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(selectTool['hoveredAnnotationId']).toBe('point-1');
    });

    it('should not detect hover far from zero-length line', () => {
      lineAnnotations.push({
        id: 'point-2',
        x1: 200,
        y1: 200,
        x2: 200,
        y2: 200,
        color: '#E74C3C',
        width: 3,
      });

      selectTool = new SelectTool(
        lineAnnotations,
        arrowAnnotations,
        rectangleAnnotations,
        [],
        mockRedraw
      );

      selectTool.handleMouseMove(
        { clientX: 250, clientY: 250 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(selectTool['hoveredAnnotationId']).toBeNull();
    });
  });

  describe('arrow hover rendering', () => {
    it('should call renderArrowhead when hovering over arrow', () => {
      arrowAnnotations.push({
        id: 'arrow-1',
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 200,
        color: '#E74C3C',
        width: 3,
      });

      selectTool = new SelectTool(
        lineAnnotations,
        arrowAnnotations,
        rectangleAnnotations,
        [],
        mockRedraw
      );

      // Hover over the arrow
      selectTool.handleMouseMove(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      // Render should be called with the arrow hovered
      selectTool.render(mockCtx);

      // Should have called rendering methods for arrowhead
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });
  });

  describe('cursor changes on handle hover', () => {
    it('should set cursor to move when hovering over line handle', () => {
      selectTool['selectedAnnotationId'] = 'line-1';
      selectTool['selectedAnnotationType'] = 'line';

      selectTool.handleMouseMove(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockCanvas.style.cursor).toBe('move');
    });

    it('should set cursor to move when hovering over line body', () => {
      selectTool['selectedAnnotationId'] = 'line-1';
      selectTool['selectedAnnotationType'] = 'line';

      selectTool.handleMouseMove(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockCanvas.style.cursor).toBe('move');
    });

    it('should set cursor to nwse-resize when hovering over rectangle top-left handle', () => {
      selectTool['selectedAnnotationId'] = 'rect-1';
      selectTool['selectedAnnotationType'] = 'rectangle';

      selectTool.handleMouseMove(
        { clientX: 100, clientY: 300 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockCanvas.style.cursor).toBe('nwse-resize');
    });

    it('should set cursor to nesw-resize when hovering over rectangle top-right handle', () => {
      selectTool['selectedAnnotationId'] = 'rect-1';
      selectTool['selectedAnnotationType'] = 'rectangle';

      selectTool.handleMouseMove(
        { clientX: 200, clientY: 300 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockCanvas.style.cursor).toBe('nesw-resize');
    });

    it('should set cursor to nesw-resize when hovering over rectangle bottom-left handle', () => {
      selectTool['selectedAnnotationId'] = 'rect-1';
      selectTool['selectedAnnotationType'] = 'rectangle';

      selectTool.handleMouseMove(
        { clientX: 100, clientY: 350 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockCanvas.style.cursor).toBe('nesw-resize');
    });

    it('should set cursor to nwse-resize when hovering over rectangle bottom-right handle', () => {
      selectTool['selectedAnnotationId'] = 'rect-1';
      selectTool['selectedAnnotationType'] = 'rectangle';

      selectTool.handleMouseMove(
        { clientX: 200, clientY: 350 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockCanvas.style.cursor).toBe('nwse-resize');
    });

    it('should set cursor to move when hovering over rectangle body', () => {
      selectTool['selectedAnnotationId'] = 'rect-1';
      selectTool['selectedAnnotationType'] = 'rectangle';

      selectTool.handleMouseMove(
        { clientX: 100, clientY: 325 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockCanvas.style.cursor).toBe('move');
    });

    it('should set cursor to pointer when hovering over unselected annotation', () => {
      expect(selectTool['selectedAnnotationId']).toBeNull();

      selectTool.handleMouseMove(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockCanvas.style.cursor).toBe('pointer');
    });
  });

  describe('deactivate', () => {
    it('should remove keyboard listener', () => {
      const removeListenerSpy = vi.spyOn(document, 'removeEventListener');
      selectTool['keydownHandler'] = vi.fn();

      selectTool.deactivate();

      expect(removeListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
      expect(selectTool['keydownHandler']).toBeNull();
    });
  });

  describe('text annotation support', () => {
    let textAnnotations: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      text: string;
      color: string;
      fontSize: number;
    }>;

    beforeEach(() => {
      textAnnotations = [
        {
          id: 'text-1',
          x: 100,
          y: 400,
          width: 200,
          height: 100,
          text: 'Test text',
          color: '#E74C3C',
          fontSize: 14,
        },
      ];
      selectTool.deactivate();
      selectTool = new SelectTool(
        lineAnnotations,
        arrowAnnotations,
        rectangleAnnotations,
        textAnnotations,
        mockRedraw
      );
      selectTool.activate();
    });

    describe('text box selection', () => {
      it('should select text annotation when clicking on border edge', () => {
        // Click on left edge of text box
        selectTool.handleClick(
          { clientX: 100, clientY: 450 } as MouseEvent,
          mockCanvas
        );

        expect(selectTool['selectedAnnotationId']).toBe('text-1');
        expect(selectTool['selectedAnnotationType']).toBe('text');
        expect(mockRedraw).toHaveBeenCalled();
      });

      it('should not select text annotation when clicking inside (not on edge)', () => {
        // Click inside the text box (not near edges)
        selectTool.handleClick(
          { clientX: 200, clientY: 450 } as MouseEvent,
          mockCanvas
        );

        expect(selectTool['selectedAnnotationId']).toBeNull();
      });

      it('should deselect text annotation when clicking empty space', () => {
        selectTool['selectedAnnotationId'] = 'text-1';
        selectTool['selectedAnnotationType'] = 'text';

        selectTool.handleClick(
          { clientX: 500, clientY: 500 } as MouseEvent,
          mockCanvas
        );

        expect(selectTool['selectedAnnotationId']).toBeNull();
        expect(selectTool['selectedAnnotationType']).toBeNull();
      });
    });

    describe('text annotation handle rendering', () => {
      it('should render 4 corner handles when text annotation is selected', () => {
        selectTool['selectedAnnotationId'] = 'text-1';
        selectTool['selectedAnnotationType'] = 'text';

        selectTool.render(mockCtx);

        // Should render 4 corner handles
        expect(mockCtx.fillRect).toHaveBeenCalledTimes(4);
        expect(mockCtx.strokeRect).toHaveBeenCalledTimes(4);
      });

      it('should render handles at correct corner positions', () => {
        selectTool['selectedAnnotationId'] = 'text-1';
        selectTool['selectedAnnotationType'] = 'text';

        selectTool.render(mockCtx);

        // Check positions of the 4 corner handles (centered on corners)
        // Top-left
        expect(mockCtx.fillRect).toHaveBeenNthCalledWith(1, 96, 396, 8, 8);
        // Top-right
        expect(mockCtx.fillRect).toHaveBeenNthCalledWith(2, 296, 396, 8, 8);
        // Bottom-left
        expect(mockCtx.fillRect).toHaveBeenNthCalledWith(3, 96, 496, 8, 8);
        // Bottom-right
        expect(mockCtx.fillRect).toHaveBeenNthCalledWith(4, 296, 496, 8, 8);
      });
    });

    describe('text annotation deletion', () => {
      it('should delete selected text annotation when Delete key is pressed', () => {
        selectTool.selectAnnotation('text-1');
        const initialLength = textAnnotations.length;

        const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
        document.dispatchEvent(deleteEvent);

        expect(textAnnotations.length).toBe(initialLength - 1);
        expect(textAnnotations.find((t) => t.id === 'text-1')).toBeUndefined();
        expect(selectTool['selectedAnnotationId']).toBeNull();
      });
    });

    describe('text box edge detection', () => {
      it('should detect click on top edge', () => {
        selectTool.handleClick(
          { clientX: 150, clientY: 400 } as MouseEvent,
          mockCanvas
        );
        expect(selectTool['selectedAnnotationId']).toBe('text-1');
      });

      it('should detect click on bottom edge', () => {
        selectTool.handleClick(
          { clientX: 150, clientY: 500 } as MouseEvent,
          mockCanvas
        );
        expect(selectTool['selectedAnnotationId']).toBe('text-1');
      });

      it('should detect click on left edge', () => {
        selectTool.handleClick(
          { clientX: 100, clientY: 450 } as MouseEvent,
          mockCanvas
        );
        expect(selectTool['selectedAnnotationId']).toBe('text-1');
      });

      it('should detect click on right edge', () => {
        selectTool.handleClick(
          { clientX: 300, clientY: 450 } as MouseEvent,
          mockCanvas
        );
        expect(selectTool['selectedAnnotationId']).toBe('text-1');
      });

      it('should not detect click far from edges', () => {
        selectTool.handleClick(
          { clientX: 150, clientY: 450 } as MouseEvent,
          mockCanvas
        );
        expect(selectTool['selectedAnnotationId']).toBeNull();
      });
    });

    describe('priority: text over rectangles and lines', () => {
      it('should select text annotation first when overlapping with rectangle', () => {
        // Add overlapping items at same position
        rectangleAnnotations.push({
          id: 'rect-overlap',
          x: 100,
          y: 400,
          width: 200,
          height: 100,
          color: '#E74C3C',
          strokeWidth: 2,
        });

        selectTool.deactivate();
        selectTool = new SelectTool(
          lineAnnotations,
          arrowAnnotations,
          rectangleAnnotations,
          textAnnotations,
          mockRedraw
        );
        selectTool.activate();

        // Click on overlapping area
        selectTool.handleClick(
          { clientX: 100, clientY: 450 } as MouseEvent,
          mockCanvas
        );

        // Should select text annotation (checked first)
        expect(selectTool['selectedAnnotationId']).toBe('text-1');
        expect(selectTool['selectedAnnotationType']).toBe('text');
      });
    });

    describe('text box resizing', () => {
      it('should resize text box from top-left handle', () => {
        selectTool['selectedAnnotationId'] = 'text-1';
        selectTool['selectedAnnotationType'] = 'text';

        selectTool.handleMouseDown(
          { clientX: 100, clientY: 400 } as MouseEvent,
          mockCanvas
        );
        selectTool.handleMouseMove(
          { clientX: 120, clientY: 420 } as MouseEvent,
          mockCanvas,
          mockCtx
        );

        const textBox = textAnnotations[0];
        expect(textBox.x).toBe(120);
        expect(textBox.y).toBe(420);
        expect(textBox.width).toBe(180);
        expect(textBox.height).toBe(80);
      });

      it('should resize text box from top-right handle', () => {
        selectTool['selectedAnnotationId'] = 'text-1';
        selectTool['selectedAnnotationType'] = 'text';

        selectTool.handleMouseDown(
          { clientX: 300, clientY: 400 } as MouseEvent,
          mockCanvas
        );
        selectTool.handleMouseMove(
          { clientX: 320, clientY: 420 } as MouseEvent,
          mockCanvas,
          mockCtx
        );

        const textBox = textAnnotations[0];
        expect(textBox.x).toBe(100);
        expect(textBox.y).toBe(420);
        expect(textBox.width).toBe(220);
        expect(textBox.height).toBe(80);
      });

      it('should resize text box from bottom-left handle', () => {
        selectTool['selectedAnnotationId'] = 'text-1';
        selectTool['selectedAnnotationType'] = 'text';

        selectTool.handleMouseDown(
          { clientX: 100, clientY: 500 } as MouseEvent,
          mockCanvas
        );
        selectTool.handleMouseMove(
          { clientX: 120, clientY: 520 } as MouseEvent,
          mockCanvas,
          mockCtx
        );

        const textBox = textAnnotations[0];
        expect(textBox.x).toBe(120);
        expect(textBox.y).toBe(400);
        expect(textBox.width).toBe(180);
        expect(textBox.height).toBe(120);
      });

      it('should resize text box from bottom-right handle', () => {
        selectTool['selectedAnnotationId'] = 'text-1';
        selectTool['selectedAnnotationType'] = 'text';

        selectTool.handleMouseDown(
          { clientX: 300, clientY: 500 } as MouseEvent,
          mockCanvas
        );
        selectTool.handleMouseMove(
          { clientX: 320, clientY: 520 } as MouseEvent,
          mockCanvas,
          mockCtx
        );

        const textBox = textAnnotations[0];
        expect(textBox.x).toBe(100);
        expect(textBox.y).toBe(400);
        expect(textBox.width).toBe(220);
        expect(textBox.height).toBe(120);
      });

      it('should enforce minimum width when resizing from left edge', () => {
        selectTool['selectedAnnotationId'] = 'text-1';
        selectTool['selectedAnnotationType'] = 'text';

        // Try to resize below minimum width from top-left handle
        selectTool.handleMouseDown(
          { clientX: 100, clientY: 400 } as MouseEvent,
          mockCanvas
        );
        selectTool.handleMouseMove(
          { clientX: 290, clientY: 410 } as MouseEvent,
          mockCanvas,
          mockCtx
        );

        const textBox = textAnnotations[0];
        // Width should be minimum 40, and x position adjusted
        expect(textBox.width).toBe(40);
        expect(textBox.x).toBe(260); // 300 (right edge) - 40 (min width)
      });

      it('should enforce minimum height when resizing from top edge', () => {
        selectTool['selectedAnnotationId'] = 'text-1';
        selectTool['selectedAnnotationType'] = 'text';

        // Try to resize below minimum height from top-left handle
        selectTool.handleMouseDown(
          { clientX: 100, clientY: 400 } as MouseEvent,
          mockCanvas
        );
        selectTool.handleMouseMove(
          { clientX: 110, clientY: 490 } as MouseEvent,
          mockCanvas,
          mockCtx
        );

        const textBox = textAnnotations[0];
        // Height should be minimum 40, and y position adjusted
        expect(textBox.height).toBe(40);
        expect(textBox.y).toBe(460); // 500 (bottom edge) - 40 (min height)
      });
    });
  });

  describe('additional edge cases', () => {
    it('should handle zero-length line in distance calculation', () => {
      const zeroLengthLine: LineAnnotation = {
        id: 'zero-line',
        x1: 100,
        x2: 100,
        y1: 100,
        y2: 100,
        color: '#E74C3C',
        width: 3,
      };
      lineAnnotations.push(zeroLengthLine);
      selectTool = new SelectTool(
        lineAnnotations,
        arrowAnnotations,
        rectangleAnnotations,
        [],
        mockRedraw
      );

      // Mouse directly on the point
      selectTool.handleMouseMove(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(selectTool['hoveredAnnotationId']).toBe('zero-line');
    });

    it('should handle draggingLine with arrow type', () => {
      const arrow: LineAnnotation = {
        id: 'arrow-1',
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 200,
        color: '#E74C3C',
        width: 3,
      };
      arrowAnnotations.push(arrow);
      selectTool = new SelectTool(
        [],
        arrowAnnotations,
        rectangleAnnotations,
        [],
        mockRedraw
      );

      selectTool['selectedAnnotationId'] = 'arrow-1';
      selectTool['selectedAnnotationType'] = 'line'; // Arrows use 'line' type in drag logic
      selectTool['draggingLine'] = true;
      selectTool['dragOffset'] = { x: 100, y: 100 };

      // Drag the arrow
      selectTool.handleMouseMove(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(arrow.x1).toBe(150);
      expect(arrow.y1).toBe(150);
      expect(arrow.x2).toBe(250);
      expect(arrow.y2).toBe(250);
    });

    it('should drag text annotation when draggingLine is true with text type', () => {
      const textAnnotations: TextAnnotation[] = [
        {
          id: 'text-1',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          text: 'Test',
          color: '#E74C3C',
          fontSize: 14,
        },
      ];

      selectTool = new SelectTool([], [], [], textAnnotations, mockRedraw);

      selectTool['selectedAnnotationId'] = 'text-1';
      selectTool['selectedAnnotationType'] = 'text';
      selectTool['draggingLine'] = true;
      selectTool['dragOffset'] = { x: 100, y: 100 };

      // Drag the text box
      selectTool.handleMouseMove(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(textAnnotations[0].x).toBe(150);
      expect(textAnnotations[0].y).toBe(150);
    });
  });

  describe('handleMouseMove cursor edge cases', () => {
    it('should set nesw-resize cursor when hovering topRight handle of text box', () => {
      const textAnnotations: TextAnnotation[] = [
        {
          id: 'text-1',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          text: 'Test',
          color: '#E74C3C',
          fontSize: 14,
        },
      ];
      const selectTool = new SelectTool(
        lineAnnotations,
        arrowAnnotations,
        rectangleAnnotations,
        textAnnotations,
        mockRedraw
      );
      selectTool['selectedAnnotationId'] = 'text-1';
      selectTool['selectedAnnotationType'] = 'text';

      // Hover over topRight handle (x + width, y)
      selectTool.handleMouseMove(
        { clientX: 300, clientY: 100 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockCanvas.style.cursor).toBe('nesw-resize');
    });

    it('should set nesw-resize cursor when hovering bottomLeft handle of text box', () => {
      const textAnnotations: TextAnnotation[] = [
        {
          id: 'text-1',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          text: 'Test',
          color: '#E74C3C',
          fontSize: 14,
        },
      ];
      const selectTool = new SelectTool(
        lineAnnotations,
        arrowAnnotations,
        rectangleAnnotations,
        textAnnotations,
        mockRedraw
      );
      selectTool['selectedAnnotationId'] = 'text-1';
      selectTool['selectedAnnotationType'] = 'text';

      // Hover over bottomLeft handle (x, y + height)
      selectTool.handleMouseMove(
        { clientX: 100, clientY: 200 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockCanvas.style.cursor).toBe('nesw-resize');
    });
  });

  describe('isPointOnLine with lengthSquared === 0', () => {
    it('should handle zero-length line (start and end at same point)', () => {
      const selectTool = new SelectTool(
        lineAnnotations,
        arrowAnnotations,
        rectangleAnnotations,
        [],
        mockRedraw
      );

      // Zero-length line
      const line: LineAnnotation = {
        id: 'line-1',
        x1: 100,
        y1: 100,
        x2: 100,
        y2: 100,
        color: '#E74C3C',
        width: 2,
      };

      // Point close to the zero-length line
      const result = selectTool['isPointOnLine'](102, 102, line);
      expect(result).toBe(true);

      // Point far from the zero-length line
      const result2 = selectTool['isPointOnLine'](150, 150, line);
      expect(result2).toBe(false);
    });
  });

  describe('text box hover detection', () => {
    it('should detect hovering over unselected text box and set pointer cursor', () => {
      const textAnnotations: TextAnnotation[] = [
        {
          id: 'text-1',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          text: 'Test',
          color: '#E74C3C',
          fontSize: 14,
        },
      ];
      const selectTool = new SelectTool(
        [],
        [],
        [],
        textAnnotations,
        mockRedraw
      );

      // No annotation selected, hover over text box edge (left edge)
      selectTool.handleMouseMove(
        { clientX: 100, clientY: 150 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockCanvas.style.cursor).toBe('pointer');
      expect(selectTool['hoveredAnnotationId']).toBe('text-1');
      expect(selectTool['hoveredAnnotationType']).toBe('text');
    });

    it('should update hovered annotation when hovering over different text box', () => {
      const textAnnotations: TextAnnotation[] = [
        {
          id: 'text-1',
          x: 100,
          y: 100,
          width: 100,
          height: 50,
          text: 'Test 1',
          color: '#E74C3C',
          fontSize: 14,
        },
        {
          id: 'text-2',
          x: 300,
          y: 100,
          width: 100,
          height: 50,
          text: 'Test 2',
          color: '#3498DB',
          fontSize: 14,
        },
      ];
      const selectTool = new SelectTool(
        [],
        [],
        [],
        textAnnotations,
        mockRedraw
      );

      // Hover over first text box edge (left edge)
      selectTool.handleMouseMove(
        { clientX: 100, clientY: 125 } as MouseEvent,
        mockCanvas,
        mockCtx
      );
      expect(selectTool['hoveredAnnotationId']).toBe('text-1');

      // Hover over second text box edge (left edge)
      selectTool.handleMouseMove(
        { clientX: 300, clientY: 125 } as MouseEvent,
        mockCanvas,
        mockCtx
      );
      expect(selectTool['hoveredAnnotationId']).toBe('text-2');
      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should set move cursor when hovering over selected text box edge', () => {
      const textAnnotations: TextAnnotation[] = [
        {
          id: 'text-1',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          text: 'Test',
          color: '#E74C3C',
          fontSize: 14,
        },
      ];
      const selectTool = new SelectTool(
        [],
        [],
        [],
        textAnnotations,
        mockRedraw
      );

      // Select the text annotation
      selectTool['selectedAnnotationId'] = 'text-1';
      selectTool['selectedAnnotationType'] = 'text';

      // Hover over the selected text box edge (top edge, not on a handle)
      selectTool.handleMouseMove(
        { clientX: 150, clientY: 100 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockCanvas.style.cursor).toBe('move');
    });
  });

  describe('text box dragging on mouseDown', () => {
    it('should start dragging text box when clicking on its edge', () => {
      const textAnnotations: TextAnnotation[] = [
        {
          id: 'text-1',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          text: 'Test',
          color: '#E74C3C',
          fontSize: 14,
        },
      ];
      const selectTool = new SelectTool(
        [],
        [],
        [],
        textAnnotations,
        mockRedraw
      );

      // First select the text box
      selectTool['selectedAnnotationId'] = 'text-1';
      selectTool['selectedAnnotationType'] = 'text';

      // Click on text box edge to start dragging
      selectTool.handleMouseDown(
        { clientX: 100, clientY: 150 } as MouseEvent,
        mockCanvas
      );

      expect(selectTool['draggingLine']).toBe(true);
      expect(selectTool['dragOffset']).toEqual({ x: 100, y: 150 });
    });
  });

  describe('handle hover detection for selected text', () => {
    it('should set nwse-resize cursor when hovering over top-left handle of selected text', () => {
      const textAnnotations: TextAnnotation[] = [
        {
          id: 'text-1',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          text: 'Test',
          color: '#E74C3C',
          fontSize: 14,
        },
      ];
      const selectTool = new SelectTool(
        [],
        [],
        [],
        textAnnotations,
        mockRedraw
      );

      selectTool['selectedAnnotationId'] = 'text-1';
      selectTool['selectedAnnotationType'] = 'text';

      // Hover over top-left handle
      selectTool.handleMouseMove(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockCanvas.style.cursor).toBe('nwse-resize');
    });

    it('should set nwse-resize cursor when hovering over bottom-right handle of selected text', () => {
      const textAnnotations: TextAnnotation[] = [
        {
          id: 'text-1',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          text: 'Test',
          color: '#E74C3C',
          fontSize: 14,
        },
      ];
      const selectTool = new SelectTool(
        [],
        [],
        [],
        textAnnotations,
        mockRedraw
      );

      selectTool['selectedAnnotationId'] = 'text-1';
      selectTool['selectedAnnotationType'] = 'text';

      // Hover over bottom-right handle
      selectTool.handleMouseMove(
        { clientX: 300, clientY: 200 } as MouseEvent,
        mockCanvas,
        mockCtx
      );

      expect(mockCanvas.style.cursor).toBe('nwse-resize');
    });
  });

  describe('findLineById edge cases', () => {
    it('should return undefined when searching empty arrays', () => {
      const selectTool = new SelectTool([], [], [], [], mockRedraw);
      const result = selectTool['findLineById']('test-id');
      expect(result).toBeUndefined();
    });

    it('should return false when removing non-existent line ID', () => {
      const selectTool = new SelectTool([], [], [], [], mockRedraw);
      const result = selectTool['removeLineById']('non-existent-id');
      expect(result).toBe(false);
    });
  });
});
