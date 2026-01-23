import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type Mock,
} from 'vitest';
import { TextTool } from './text-tool';
import type { TextAnnotation } from '../../../interfaces/annotation.interface';

// Helper to get text div element
const getTextDiv = (): HTMLDivElement | null => {
  return document.querySelector(
    'div[contenteditable="true"]'
  ) as HTMLDivElement | null;
};

describe('TextTool', () => {
  let textTool: TextTool;
  let mockRedraw: Mock;
  let mockToolChange: Mock;
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    mockRedraw = vi.fn();
    mockToolChange = vi.fn();
    textTool = new TextTool([], mockRedraw, mockToolChange);

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
      style: {} as CSSStyleDeclaration,
    } as unknown as HTMLCanvasElement;

    // Mock context
    mockCtx = {
      canvas: mockCanvas, // Add reference to canvas for getBoundingClientRect access
      font: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      textBaseline: '',
      letterSpacing: '',
      fillText: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      setLineDash: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 50 }),
    } as unknown as CanvasRenderingContext2D;
  });

  afterEach(() => {
    // Clean up any contenteditable divs
    document.querySelectorAll('div[contenteditable="true"]').forEach((div) => {
      div.remove();
    });
  });

  describe('drawing rectangle', () => {
    it('should start drawing on mousedown', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );

      expect(textTool['isDrawing']).toBe(true);
      expect(textTool['startPoint']).toEqual({ x: 100, y: 100 });
    });

    it('should update currentBox on mousemove while drawing', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 200, clientY: 150 } as MouseEvent,
        mockCanvas
      );

      expect(textTool['currentBox']).toEqual({
        x: 100,
        y: 100,
        width: 100,
        height: 60,
      });
    });

    it('should constrain dragging to right and down only', () => {
      textTool.handleMouseDown(
        { clientX: 200, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      // Try to drag left and up
      textTool.handleMouseMove(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );

      // Width and height should be minimum size (40px width, 60px height), not 0
      expect(textTool['currentBox']?.width).toBe(40);
      expect(textTool['currentBox']?.height).toBe(60);
    });

    it('should call redraw during mousemove', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      mockRedraw.mockClear();

      textTool.handleMouseMove(
        { clientX: 200, clientY: 150 } as MouseEvent,
        mockCanvas
      );

      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should not update box if not drawing', () => {
      textTool.handleMouseMove(
        { clientX: 200, clientY: 150 } as MouseEvent,
        mockCanvas
      );

      expect(textTool['currentBox']).toBeNull();
    });
  });

  describe('text div creation', () => {
    it('should create contenteditable div on mouseup with valid box size', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      const textDiv = getTextDiv();
      expect(textDiv).toBeTruthy();
      expect(textDiv?.tagName).toBe('DIV');
      expect(textDiv?.contentEditable).toBe('true');
    });

    it('should create textDiv with minimum 40px dimensions even when dragging small', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 105, clientY: 105 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 105, clientY: 105 } as MouseEvent,
        mockCanvas
      );

      const textDiv = getTextDiv();
      expect(textDiv).toBeTruthy();
      expect(textDiv?.dataset.canvasWidth).toBe('40');
      expect(textDiv?.dataset.canvasHeight).toBe('60');
    });

    it('should auto-focus textDiv on creation', () => {
      const focusSpy = vi.spyOn(HTMLDivElement.prototype, 'focus');

      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      expect(focusSpy).toHaveBeenCalled();
      focusSpy.mockRestore();
    });

    it('should apply correct styling to textDiv', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      const textDiv = getTextDiv()!;
      expect(textDiv.style.position).toBe('fixed');
      expect(textDiv.style.fontFamily).toContain('Inter');
      expect(textDiv.style.fontWeight).toBe('500');
      expect(textDiv.style.whiteSpace).toBe('pre-wrap');
      expect(textDiv.contentEditable).toBe('true');
    });
  });

  describe('annotation creation', () => {
    it('should create annotation with width and height on blur', async () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 300, clientY: 250 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 300, clientY: 250 } as MouseEvent,
        mockCanvas
      );

      const textDiv = getTextDiv()!;
      textDiv.textContent = 'Test text';
      textDiv.dispatchEvent(new Event('blur'));

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(textTool['annotations']).toHaveLength(1);
      expect(textTool['annotations'][0]).toMatchObject({
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        text: 'Test text',
        color: '#E74C3C',
        fontSize: 15,
      });
    });

    it('should not create annotation if text is empty', async () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 300, clientY: 250 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 300, clientY: 250 } as MouseEvent,
        mockCanvas
      );

      const textDiv = getTextDiv()!;
      textDiv.textContent = '   '; // Only whitespace
      textDiv.dispatchEvent(new Event('blur'));

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(textTool['annotations']).toHaveLength(0);
    });

    it('should trim whitespace from text', async () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 300, clientY: 250 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 300, clientY: 250 } as MouseEvent,
        mockCanvas
      );

      const textDiv = getTextDiv()!;
      textDiv.textContent = '  Trimmed text  ';
      textDiv.dispatchEvent(new Event('blur'));

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(textTool['annotations'][0].text).toBe('Trimmed text');
    });

    it('should generate unique ID for annotation', async () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 300, clientY: 250 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 300, clientY: 250 } as MouseEvent,
        mockCanvas
      );

      const textDiv = getTextDiv()!;
      textDiv.textContent = 'Test';
      textDiv.dispatchEvent(new Event('blur'));

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(textTool['annotations'][0].id).toBeTruthy();
      expect(typeof textTool['annotations'][0].id).toBe('string');
    });
  });

  describe('keyboard handling', () => {
    it('should remove textDiv on Escape key', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 300, clientY: 250 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 300, clientY: 250 } as MouseEvent,
        mockCanvas
      );

      // Annotation is created immediately on mouseup (with empty text)
      expect(textTool['annotations']).toHaveLength(1);

      const textDiv = getTextDiv()!;
      textDiv.textContent = 'Should be cancelled';

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      textDiv.dispatchEvent(escapeEvent);

      expect(getTextDiv()).toBeNull();
      // Annotation should be removed on Escape
      expect(textTool['annotations']).toHaveLength(0);
    });

    it('should allow Enter key for multiline text', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 300, clientY: 250 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 300, clientY: 250 } as MouseEvent,
        mockCanvas
      );

      const textDiv = getTextDiv()!;
      textDiv.textContent = 'Line 1';

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      textDiv.dispatchEvent(enterEvent);

      // Textarea should still exist for multiline input
      expect(getTextDiv()).toBeTruthy();
    });
  });

  describe('rendering', () => {
    it('should render drawing preview rectangle', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 300, clientY: 250 } as MouseEvent,
        mockCanvas
      );

      textTool.render(mockCtx);

      expect(mockCtx.strokeRect).toHaveBeenCalledWith(100, 100, 200, 150);
    });

    it('should render saved annotations with border', () => {
      textTool['annotations'] = [
        {
          id: 'test-1',
          x: 50,
          y: 50,
          width: 200,
          height: 100,
          text: 'Test',
          color: '#E74C3C',
          fontSize: 15,
        },
      ];

      textTool.render(mockCtx);

      expect(mockCtx.strokeRect).toHaveBeenCalledWith(50, 50, 200, 100);
    });

    it('should render text with wrapping', () => {
      textTool['annotations'] = [
        {
          id: 'test-1',
          x: 50,
          y: 50,
          width: 200,
          height: 100,
          text: 'Test text',
          color: '#E74C3C',
          fontSize: 15,
        },
      ];

      textTool.render(mockCtx);

      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it('should not render if box has no size', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      // No mousemove, so box has size 0

      textTool.render(mockCtx);

      expect(mockCtx.strokeRect).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should finalize existing textDiv before starting new rectangle', () => {
      // Create first textDiv
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 300, clientY: 250 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 300, clientY: 250 } as MouseEvent,
        mockCanvas
      );

      const firstTextarea = getTextDiv()!;
      firstTextarea.textContent = 'First';

      // Try to start new rectangle
      textTool.handleMouseDown(
        { clientX: 400, clientY: 400 } as MouseEvent,
        mockCanvas
      );

      // First textDiv should be removed
      expect(getTextDiv()).toBeNull();
    });

    it('should remove annotation when finalizing with empty text', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      // Annotation created on mouseup
      expect(textTool['annotations']).toHaveLength(1);

      const textDiv = getTextDiv()!;
      textDiv.textContent = ''; // Empty text

      // Finalize by clicking outside
      textTool.handleMouseDown(
        { clientX: 400, clientY: 400 } as MouseEvent,
        mockCanvas
      );

      // Annotation should be removed since text is empty
      expect(textTool['annotations']).toHaveLength(0);
    });

    it('should handle canvas offset correctly', () => {
      mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 50,
        top: 100,
        width: 800,
        height: 600,
      });

      textTool.handleMouseDown(
        { clientX: 150, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 350, clientY: 350 } as MouseEvent,
        mockCanvas
      );

      expect(textTool['currentBox']).toEqual({
        x: 100,
        y: 100,
        width: 200,
        height: 150,
      });
    });
  });

  describe('tool switching', () => {
    it('should call onToolChange with "select" and annotation ID immediately on mouseup', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      // Tool change should happen immediately with annotation ID
      expect(mockToolChange).toHaveBeenCalledTimes(1);
      expect(mockToolChange).toHaveBeenCalledWith('select', expect.any(String));
    });

    it('should call onToolChange even with small drags (enforces 40px minimum)', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 105, clientY: 105 } as MouseEvent,
        mockCanvas
      );

      textTool.handleMouseUp(
        { clientX: 105, clientY: 105 } as MouseEvent,
        mockCanvas
      );

      expect(mockToolChange).toHaveBeenCalledWith('select', expect.any(String));
    });

    it('should create annotation and switch to select tool immediately', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      // Annotation should be created immediately
      expect(textTool['annotations']).toHaveLength(1);
      expect(textTool['annotations'][0].text).toBe('');

      // Tool change should be called with annotation ID
      expect(mockToolChange).toHaveBeenCalledWith(
        'select',
        textTool['annotations'][0].id
      );

      // Textarea should be created
      const textDiv = getTextDiv();
      expect(textDiv).toBeTruthy();
    });

    it('should store annotation ID in textDiv dataset', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      // Annotation should be created
      expect(textTool['annotations']).toHaveLength(1);
      const annotationId = textTool['annotations'][0].id;

      // Textarea should have the annotation ID stored
      const textDiv = getTextDiv()!;
      expect(textDiv.dataset.annotationId).toBe(annotationId);
    });
  });

  describe('textDiv positioning to match strokeRect', () => {
    it('should offset textDiv position by borderWidth/2 to match strokeRect visual rendering', () => {
      // Draw a box
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 300, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 300, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      const textDiv = getTextDiv();
      expect(textDiv).toBeTruthy();

      if (textDiv) {
        // strokeRect with 2px lineWidth centers 1px inside and 1px outside the path
        // For a box at (100, 100), the visual border extends from (99, 99) to (301, 201)
        // Textarea should be positioned to match this, offset by borderWidth/2 = 1px
        const borderOffset = 1; // 2px border / 2

        // Extract numeric values from position strings
        const leftPx = parseFloat(textDiv.style.left);
        const topPx = parseFloat(textDiv.style.top);
        const widthPx = parseFloat(textDiv.style.width);
        const heightPx = parseFloat(textDiv.style.height);

        // Textarea offset by borderWidth/2 for text alignment
        expect(leftPx).toBe(100 - borderOffset);
        expect(topPx).toBe(100 - borderOffset);

        // Width/height expanded by borderOffset on both sides
        expect(widthPx).toBe(200 + borderOffset * 2);
        expect(heightPx).toBe(100 + borderOffset * 2);
      }
    });

    it('should ensure textDiv border visually aligns with rendered rectangle preview', () => {
      // This test verifies that the border doesn't "jump" when transitioning
      // from drawing preview (strokeRect) to textDiv input
      textTool.handleMouseDown(
        { clientX: 50, clientY: 50 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 150 } as MouseEvent,
        mockCanvas
      );

      // Before mouseup, currentBox is rendered with strokeRect
      expect(textTool['currentBox']).toEqual({
        x: 50,
        y: 50,
        width: 200,
        height: 100,
      });

      textTool.handleMouseUp(
        { clientX: 250, clientY: 150 } as MouseEvent,
        mockCanvas
      );

      const textDiv = getTextDiv();
      expect(textDiv).toBeTruthy();

      if (textDiv) {
        // Textarea offset by borderWidth/2 to align with strokeRect visual rendering
        expect(parseFloat(textDiv.style.left)).toBe(49);
        expect(parseFloat(textDiv.style.top)).toBe(49);
        expect(parseFloat(textDiv.style.width)).toBe(202);
        expect(parseFloat(textDiv.style.height)).toBe(102);
      }
    });
  });
  describe('text rendering position alignment', () => {
    it('should calculate text position with borderOffset + padding to prevent jump', () => {
      // Create a text annotation
      const annotation = {
        id: 'test-1',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        text: 'Test text',
        color: '#E74C3C',
        fontSize: 15,
      };

      const annotations = [annotation];
      const testTool = new TextTool(annotations, mockRedraw, mockToolChange);

      // Render the annotation
      testTool.render(mockCtx);

      // The text should be rendered with fillText
      expect(mockCtx.fillText).toHaveBeenCalled();

      // Get the position where text was rendered
      const fillTextCalls = (mockCtx.fillText as Mock).mock.calls;
      const firstCall = fillTextCalls[0];
      const renderedX = firstCall[1];
      const renderedY = firstCall[2];

      // Expected position calculation with alphabetic baseline:
      // strokeRect centers 2px border: inner edge at x + 1
      // Textarea padding: 5px
      // Half-leading: (18 - 15) / 2 = 1.5px
      // Ascent: 15 * 0.9 = 13.5px
      // Total Y offset: 1 + 5 + 1.5 + 13.5 = 21px
      const borderOffset = 1;
      const padding = 5;
      const cssLineHeight = annotation.fontSize * 1.2;
      const halfLeading = (cssLineHeight - annotation.fontSize) / 2;
      const ascent = annotation.fontSize * 0.9;
      const expectedX = annotation.x + borderOffset + padding;
      const expectedY =
        annotation.y + borderOffset + padding + halfLeading + ascent;

      expect(renderedX).toBe(expectedX);
      expect(renderedY).toBe(expectedY);
    });

    it('should calculate maxWidth accounting for borderOffset on both sides', () => {
      const annotation = {
        id: 'test-2',
        x: 50,
        y: 50,
        width: 200,
        height: 100,
        text: 'Long text for wrapping test',
        color: '#E74C3C',
        fontSize: 15,
      };

      const annotations = [annotation];
      const testTool = new TextTool(annotations, mockRedraw, mockToolChange);

      // Spy on wrapText to verify maxWidth calculation
      const wrapTextSpy = vi.spyOn(
        testTool as unknown as {
          wrapText: (
            ctx: CanvasRenderingContext2D,
            text: string,
            maxWidth: number
          ) => string[];
        },
        'wrapText'
      );

      testTool.render(mockCtx);

      // Verify wrapText was called
      expect(wrapTextSpy).toHaveBeenCalled();

      // Get the maxWidth parameter
      const wrapTextCall = wrapTextSpy.mock.calls[0] as unknown[];
      const maxWidth = wrapTextCall[2] as number; // third parameter

      // Expected maxWidth calculation:
      // width - (borderOffset + padding) * 2
      // 200 - (1 + 5) * 2 = 200 - 12 = 188
      const borderOffset = 1;
      const padding = 5;
      const expectedMaxWidth = annotation.width - (borderOffset + padding) * 2;

      expect(maxWidth).toBe(expectedMaxWidth);
    });
  });

  describe('text jump bug with DPR > 1', () => {
    it('should render text at the same position as textDiv with DPR=2', () => {
      // Set DPR to 2 to simulate retina display
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2,
      });

      // Configure canvas for retina display BEFORE rendering
      mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 400, // Displayed at 400px
        height: 300,
      });
      mockCanvas.width = 800; // Internal canvas size (400 * 2 for retina)
      mockCanvas.height = 600;

      // Create annotation
      const annotation = {
        id: 'test-dpr',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        text: 'Test',
        color: '#E74C3C',
        fontSize: 15,
      };

      textTool['annotations'] = [annotation];

      // Render to canvas (now scaleX will be 2)
      textTool.render(mockCtx);

      // Get where canvas text was rendered
      const fillTextCalls = (mockCtx.fillText as Mock).mock.calls;
      const canvasTextX = fillTextCalls[0][1] as number;

      // Now simulate textDiv creation at the same position
      const box = { x: 100, y: 100, width: 200, height: 100 };

      textTool['createTextDiv'](mockCanvas, box);

      const textDiv = getTextDiv()!;
      expect(textDiv).toBeTruthy();

      // Calculate where textDiv text would appear in canvas coordinates
      const scaleX = mockCanvas.width / 400; // 800 / 400 = 2
      const textDivLeft = parseFloat(textDiv.style.left); // CSS pixels
      const textDivPadding = 5; // CSS pixels
      const textDivBorder = 2; // CSS pixels, but textDiv has no border - this is for strokeRect offset
      // Textarea positioned with borderOffset, text starts at: left + border + padding
      const textDivTextStartCSS = textDivLeft + textDivBorder + textDivPadding;
      const textDivTextStartCanvas = textDivTextStartCSS * scaleX;

      // Canvas text position (already in canvas pixels)
      // Expected: both should be at the same position
      // Canvas renders at: x + (borderOffset + textDivPadding) = 100 + (1*scaleX + 5*scaleX) = 100 + 12 = 112
      // Textarea text at: see calculation above
      // They should match!
      expect(canvasTextX).toBe(textDivTextStartCanvas);

      // Clean up
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 1,
      });
    });

    it('should handle case where scaleX != DPR (common in real browsers)', () => {
      // Simulate a scenario where canvas scaling doesn't match DPR
      // E.g., DPR=2 but canvas is 1000px wide displayed at 400px (scaleX=2.5)
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2,
      });

      // Configure canvas with non-standard scaling BEFORE rendering
      mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 400,
        height: 300,
      });
      mockCanvas.width = 1000; // Not 400*2 = 800, but 1000!
      mockCanvas.height = 750;

      const annotation = {
        id: 'test-mismatch',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        text: 'Test',
        color: '#E74C3C',
        fontSize: 15,
      };

      textTool['annotations'] = [annotation];
      textTool.render(mockCtx);

      const fillTextCalls = (mockCtx.fillText as Mock).mock.calls;
      const canvasTextX = fillTextCalls[0][1] as number;

      // Canvas with non-standard scaling
      const box = { x: 100, y: 100, width: 200, height: 100 };

      textTool['createTextDiv'](mockCanvas, box);

      const textDiv = getTextDiv()!;
      const scaleX = mockCanvas.width / 400; // 1000 / 400 = 2.5
      const textDivTextStartCanvas =
        (parseFloat(textDiv.style.left) + 2 + 5) * scaleX;

      // Now they should match because we're using scaleX consistently!
      expect(canvasTextX).toBe(textDivTextStartCanvas);

      // Clean up
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 1,
      });
    });
  });

  describe('deactivate', () => {
    it('should finalize text area when deactivating', async () => {
      const annotations: TextAnnotation[] = [];
      const textTool = new TextTool(annotations, mockRedraw, mockToolChange);

      textTool.handleMouseDown(
        { clientX: 200, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 400, clientY: 300 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 400, clientY: 300 } as MouseEvent,
        mockCanvas
      );

      const textDiv = getTextDiv();
      expect(textDiv).toBeTruthy();

      textDiv!.textContent = 'Test text';

      // After creating text box, it switches to select tool and keeps textDiv active
      // To finalize, trigger blur event (like clicking outside)
      textDiv!.dispatchEvent(new Event('blur'));

      // Wait for the blur timeout (100ms)
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(annotations.length).toBe(1);
      expect(annotations[0].text).toBe('Test text');
      expect(getTextDiv()).toBeNull();
    });

    it('should handle deactivate when no text area exists', () => {
      const annotations: TextAnnotation[] = [];
      const textTool = new TextTool(annotations, mockRedraw, mockToolChange);

      expect(() => textTool.deactivate()).not.toThrow();
      expect(annotations.length).toBe(0);
    });
  });

  describe('keepTextDivActive flag behavior', () => {
    it('should set keepTextDivActive to true when creating annotation', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      // Flag should be set to true
      expect(textTool['keepTextDivActive']).toBe(true);
    });

    it('should prevent deactivate from finalizing when keepTextDivActive is true', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      const textDiv = getTextDiv();
      expect(textDiv).toBeTruthy();

      // Call deactivate (simulating tool switch to select)
      textTool.deactivate();

      // Textarea should still exist
      expect(getTextDiv()).toBeTruthy();
    });

    it('should reset keepTextDivActive flag after preventing finalization', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      expect(textTool['keepTextDivActive']).toBe(true);

      // Call deactivate
      textTool.deactivate();

      // Flag should be reset to false
      expect(textTool['keepTextDivActive']).toBe(false);
    });

    it('should finalize textDiv on second deactivate call when keepTextDivActive is false', async () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      const textDiv = getTextDiv()!;
      textDiv.textContent = 'Test text';

      // First deactivate - should keep textDiv
      textTool.deactivate();
      expect(getTextDiv()).toBeTruthy();

      // Second deactivate - should finalize
      textTool.deactivate();

      // Wait for finalization
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(getTextDiv()).toBeNull();
    });

    it('should set keepTextDivActive even with small drags (enforces 40px minimum)', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 105, clientY: 105 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 105, clientY: 105 } as MouseEvent,
        mockCanvas
      );

      // Flag should be true due to 40px minimum enforcement
      expect(textTool['keepTextDivActive']).toBe(true);
    });
  });

  describe('edge case coverage', () => {
    it('should handle mouseup when not drawing', () => {
      // Don't call mousedown first
      textTool.handleMouseUp(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas
      );

      // Should not create textDiv
      expect(getTextDiv()).toBeNull();
      expect(mockToolChange).not.toHaveBeenCalled();
    });

    it('should handle mouseup when currentBox is null', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      // Manually clear currentBox
      textTool['currentBox'] = null;

      textTool.handleMouseUp(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas
      );

      expect(getTextDiv()).toBeNull();
      expect(mockToolChange).not.toHaveBeenCalled();
    });

    it('should handle Escape when currentBox and startPoint exist', () => {
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 200, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 200, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      const textDiv = getTextDiv()!;
      expect(textDiv).toBeTruthy();

      // Simulate Escape key
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      textDiv.dispatchEvent(event);

      // TextDiv should be removed
      expect(getTextDiv()).toBeNull();
      // CurrentBox and startPoint should be cleared
      expect(textTool['currentBox']).toBeNull();
      expect(textTool['startPoint']).toBeNull();
    });

    it('should handle removeTextDiv when textDiv does not exist', () => {
      // Call removeTextDiv directly without creating a textDiv
      expect(() => {
        textTool['removeTextDiv']();
      }).not.toThrow();
    });

    it('should handle word wrapping with long word that needs current line pushed first', () => {
      const mockContext = {
        ...mockCtx,
        measureText: vi.fn((text: string) => {
          // "short" fits (10), "verylongwordthatexceedswidth" exceeds (50)
          if (text === 'short') return { width: 10 };
          if (text === 'verylongwordthatexceedswidth') return { width: 50 };
          if (text === 'short verylongwordthatexceedswidth')
            return { width: 60 };
          // For character-by-character breaking
          if (text.length <= 5) return { width: text.length * 2 };
          return { width: 50 };
        }),
      } as unknown as CanvasRenderingContext2D;

      const lines = textTool['wrapText'](
        mockContext,
        'short verylongwordthatexceedswidth',
        30
      );

      // First line should be "short", then the long word gets broken
      expect(lines[0]).toBe('short');
      expect(lines.length).toBeGreaterThan(1);
    });

    it('should handle single character that exceeds maxWidth', () => {
      const mockContext = {
        ...mockCtx,
        measureText: vi.fn((text: string) => {
          // Even a single character "W" exceeds width (50 > 30)
          // This specifically tests the case where even adding one character
          // exceeds maxWidth, forcing the else branch (lines 261-262)
          if (text.length === 0) return { width: 0 };
          if (text.length === 1 && text === 'W') return { width: 50 };
          if (text === 'WW') return { width: 100 };
          return { width: text.length * 50 };
        }),
      } as unknown as CanvasRenderingContext2D;

      const lines = textTool['wrapText'](mockContext, 'WWW', 30);

      // Each character should be on its own line since they all exceed maxWidth
      expect(lines.length).toBe(3);
      lines.forEach((line) => {
        expect(line.length).toBe(1);
        expect(line).toBe('W');
      });
    });

    it('should move word to next line when it does not fit with current line', () => {
      const mockContext = {
        ...mockCtx,
        measureText: vi.fn((text: string) => {
          if (text === 'hello') return { width: 25 };
          if (text === 'world') return { width: 25 };
          if (text === 'hello world') return { width: 60 };
          return { width: 50 };
        }),
      } as unknown as CanvasRenderingContext2D;

      const lines = textTool['wrapText'](mockContext, 'hello world', 40);

      // "hello world" exceeds 40, so should be split
      expect(lines.length).toBe(2);
      expect(lines[0]).toBe('hello');
      expect(lines[1]).toBe('world');
    });
  });

  describe('multiple annotations workflow', () => {
    it('should handle creating multiple text annotations sequentially', async () => {
      const annotations: TextAnnotation[] = [];
      const textTool = new TextTool(annotations, mockRedraw, mockToolChange);

      // Create first annotation
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      let textDiv = getTextDiv()!;
      textDiv.textContent = 'First annotation';
      textDiv.dispatchEvent(new Event('blur'));

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(annotations.length).toBe(1);
      expect(annotations[0].text).toBe('First annotation');

      // Create second annotation
      textTool.handleMouseDown(
        { clientX: 300, clientY: 300 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 450, clientY: 400 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 450, clientY: 400 } as MouseEvent,
        mockCanvas
      );

      textDiv = getTextDiv()!;
      textDiv.textContent = 'Second annotation';
      textDiv.dispatchEvent(new Event('blur'));

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(annotations.length).toBe(2);
      expect(annotations[0].text).toBe('First annotation');
      expect(annotations[1].text).toBe('Second annotation');
    });

    it('should finalize existing textDiv when starting new annotation', async () => {
      const annotations: TextAnnotation[] = [];
      const textTool = new TextTool(annotations, mockRedraw, mockToolChange);

      // Create first annotation
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      const firstTextarea = getTextDiv()!;
      firstTextarea.textContent = 'First text';

      // Start new annotation before finalizing first
      textTool.handleMouseDown(
        { clientX: 300, clientY: 300 } as MouseEvent,
        mockCanvas
      );

      // Wait for finalization timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      // First annotation should be created with text
      expect(annotations.length).toBe(1);
      expect(annotations[0].text).toBe('First text');

      // New drawing should have started
      expect(textTool['isDrawing']).toBe(true);
      expect(textTool['startPoint']).toEqual({ x: 300, y: 300 });
    });

    it('should remove first annotation if empty when starting second annotation', () => {
      const annotations: TextAnnotation[] = [];
      const textTool = new TextTool(annotations, mockRedraw, mockToolChange);

      // Create first annotation
      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      expect(annotations.length).toBe(1);
      expect(annotations[0].text).toBe('');

      // Start new annotation with first still empty
      textTool.handleMouseDown(
        { clientX: 300, clientY: 300 } as MouseEvent,
        mockCanvas
      );

      // First annotation should be removed
      expect(annotations.length).toBe(0);
    });

    it('should properly update annotation text when finalized', async () => {
      const annotations: TextAnnotation[] = [];
      const textTool = new TextTool(annotations, mockRedraw, mockToolChange);

      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      // Annotation created with empty text
      expect(annotations.length).toBe(1);
      expect(annotations[0].text).toBe('');

      const textDiv = getTextDiv()!;
      textDiv.textContent = 'Updated text';
      textDiv.dispatchEvent(new Event('blur'));

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Same annotation should be updated
      expect(annotations.length).toBe(1);
      expect(annotations[0].text).toBe('Updated text');
    });
  });

  describe('annotation lifecycle and updates', () => {
    it('should create annotation immediately on mouseup with empty text', () => {
      const annotations: TextAnnotation[] = [];
      const textTool = new TextTool(annotations, mockRedraw, mockToolChange);

      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      expect(annotations.length).toBe(1);
      expect(annotations[0]).toMatchObject({
        x: 100,
        y: 100,
        width: 150,
        height: 100,
        text: '',
        color: '#E74C3C',
        fontSize: 15,
      });
      expect(annotations[0].id).toBeTruthy();
    });

    it('should update the same annotation when text is finalized', async () => {
      const annotations: TextAnnotation[] = [];
      const textTool = new TextTool(annotations, mockRedraw, mockToolChange);

      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      const annotationId = annotations[0].id;

      const textDiv = getTextDiv()!;
      textDiv.textContent = 'Final text';
      textDiv.dispatchEvent(new Event('blur'));

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should still be 1 annotation
      expect(annotations.length).toBe(1);
      // Same ID
      expect(annotations[0].id).toBe(annotationId);
      // Updated text
      expect(annotations[0].text).toBe('Final text');
    });

    it('should remove annotation on Escape even after initial creation', () => {
      const annotations: TextAnnotation[] = [];
      const textTool = new TextTool(annotations, mockRedraw, mockToolChange);

      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      // Annotation created
      expect(annotations.length).toBe(1);

      const textDiv = getTextDiv()!;
      textDiv.textContent = 'Some text';

      // Press Escape
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      textDiv.dispatchEvent(escapeEvent);

      // Annotation should be removed
      expect(annotations.length).toBe(0);
      expect(getTextDiv()).toBeNull();
    });

    it('should match annotation ID in textDiv dataset with created annotation', () => {
      const annotations: TextAnnotation[] = [];
      const textTool = new TextTool(annotations, mockRedraw, mockToolChange);

      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      const annotation = annotations[0];
      const textDiv = getTextDiv()!;

      expect(textDiv.dataset.annotationId).toBe(annotation.id);
    });
  });

  describe('canvas scaling edge cases', () => {
    it('should handle canvas with different display size vs internal size', () => {
      // Canvas displayed at 400x300 but internal size is 800x600
      mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 400,
        height: 300,
      });
      mockCanvas.width = 800;
      mockCanvas.height = 600;

      textTool.handleMouseDown(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseMove(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      textTool.handleMouseUp(
        { clientX: 250, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      const textDiv = getTextDiv()!;
      expect(textDiv).toBeTruthy();

      // Textarea should be positioned correctly accounting for scale
      // CSS coordinates (100-1, 100-1) with scale 2
      expect(parseFloat(textDiv.style.left)).toBe(99);
      expect(parseFloat(textDiv.style.top)).toBe(99);
    });

    it('should correctly scale font size in render based on canvas scale', () => {
      mockCanvas.width = 1600;
      mockCanvas.height = 1200;
      mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
      });

      const annotation: TextAnnotation = {
        id: 'test-scale',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        text: 'Scaled text',
        color: '#E74C3C',
        fontSize: 15,
      };

      textTool['annotations'] = [annotation];
      textTool.render(mockCtx);

      // Font should be scaled: 15 * scaleX = 15 * 2 = 30
      const expectedFontSize = 15 * 2;
      expect(mockCtx.font).toContain(`${expectedFontSize}px`);
    });
  });

  describe('word wrapping edge cases', () => {
    it('should handle word wrapping when line width exceeds maxWidth', () => {
      const annotation: TextAnnotation = {
        id: 'text-wrap',
        x: 100,
        y: 100,
        width: 50,
        height: 100,
        text: 'This is a very long text that needs wrapping',
        color: '#E74C3C',
        fontSize: 15,
      };

      const annotations = [annotation];
      const textTool = new TextTool(annotations, mockRedraw, mockToolChange);

      textTool.render(mockCtx);

      const fillTextCalls = (mockCtx.fillText as Mock).mock.calls;
      expect(fillTextCalls.length).toBeGreaterThan(1);
    });

    it('should preserve empty lines in text', () => {
      const annotation: TextAnnotation = {
        id: 'text-empty-lines',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        text: 'Line 1\n\nLine 3',
        color: '#E74C3C',
        fontSize: 15,
      };

      const annotations = [annotation];
      const textTool = new TextTool(annotations, mockRedraw, mockToolChange);

      textTool.render(mockCtx);

      const fillTextCalls = (mockCtx.fillText as Mock).mock.calls;
      expect(fillTextCalls.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('word wrapping edge cases - single character exceeds width branch', () => {
    it('should handle single character that exceeds maxWidth (else branch at line 261-262)', () => {
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

      const mockCtx = {
        canvas: mockCanvas,
        font: '14px Arial',
        measureText: vi.fn((text: string) => {
          // Make single characters return width greater than maxWidth
          if (text.length === 1) {
            return { width: 250 }; // Exceeds maxWidth of 200
          }
          return { width: text.length * 20 };
        }),
        fillText: vi.fn(),
        fillStyle: '',
        save: vi.fn(),
        restore: vi.fn(),
        strokeRect: vi.fn(),
        strokeStyle: '',
        lineWidth: 0,
      } as unknown as CanvasRenderingContext2D;

      const annotation: TextAnnotation = {
        id: 'test-1',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        text: 'A B C', // Each char will exceed width when measured alone
        color: '#E74C3C',
        fontSize: 15,
      };

      const annotations = [annotation];
      const textTool = new TextTool(annotations, mockRedraw, mockToolChange);

      textTool.render(mockCtx);

      // Should still render even though single chars exceed width
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it('should push single character anyway when it exceeds width in remaining word', () => {
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

      const mockCtx = {
        canvas: mockCanvas,
        font: '14px Arial',
        measureText: vi.fn((text: string) => {
          // Make the word "WWWWW" too wide, and each W also too wide individually
          if (text === 'WWWWW' || text.startsWith('W')) {
            return { width: 250 }; // Exceeds maxWidth
          }
          return { width: text.length * 8 };
        }),
        fillText: vi.fn(),
        fillStyle: '',
        save: vi.fn(),
        restore: vi.fn(),
        strokeRect: vi.fn(),
        strokeStyle: '',
        lineWidth: 0,
      } as unknown as CanvasRenderingContext2D;

      const annotation: TextAnnotation = {
        id: 'test-1',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        text: 'WWWWW', // Word too wide, and chars also too wide
        color: '#E74C3C',
        fontSize: 15,
      };

      const annotations = [annotation];
      const textTool = new TextTool(annotations, mockRedraw, mockToolChange);

      textTool.render(mockCtx);

      // Each character should still be pushed to lines even though they exceed width
      const fillTextCalls = (mockCtx.fillText as Mock).mock.calls;
      expect(fillTextCalls.length).toBeGreaterThan(0);
    });

    it('should handle when charLine is null and push single character anyway', () => {
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

      const mockCtx = {
        canvas: mockCanvas,
        font: '14px Arial',
        measureText: vi.fn(() => {
          // Make everything too wide, including single characters
          // And make findLongestFittingSubstring return empty string
          return { width: 300 }; // Always exceeds maxWidth of 200
        }),
        fillText: vi.fn(),
        fillStyle: '',
        save: vi.fn(),
        restore: vi.fn(),
        strokeRect: vi.fn(),
        strokeStyle: '',
        lineWidth: 0,
      } as unknown as CanvasRenderingContext2D;

      const annotation: TextAnnotation = {
        id: 'test-1',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        text: 'ABC',
        color: '#E74C3C',
        fontSize: 15,
      };

      const annotations = [annotation];
      const textTool = new TextTool(annotations, mockRedraw, mockToolChange);

      textTool.render(mockCtx);

      // Should still render characters even when they all exceed width
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it('should push single character when charLine loop produces empty string', () => {
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

      // Create a mock that simulates charLine remaining empty
      // because the first character itself exceeds width
      const mockCtx = {
        canvas: mockCanvas,
        font: '14px Arial',
        measureText: vi.fn((text: string) => {
          // Single characters are too wide (even one char)
          // This forces charLine to stay empty in the loop
          if (text.length === 1) {
            return { width: 250 }; // First character exceeds maxWidth
          }
          // Any accumulated string is also too wide
          return { width: 300 };
        }),
        fillText: vi.fn(),
        fillStyle: '',
        save: vi.fn(),
        restore: vi.fn(),
        strokeRect: vi.fn(),
        strokeStyle: '',
        lineWidth: 0,
      } as unknown as CanvasRenderingContext2D;

      const annotation: TextAnnotation = {
        id: 'test-1',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        text: 'W',
        color: '#E74C3C',
        fontSize: 15,
      };

      const annotations = [annotation];
      const textTool = new TextTool(annotations, mockRedraw, mockToolChange);

      textTool.render(mockCtx);

      // Should still render the character even though it's too wide
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it('should handle text with multiple consecutive newlines (empty paragraphs)', () => {
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

      const mockCtx = {
        canvas: mockCanvas,
        font: '14px Arial',
        measureText: vi.fn((text: string) => ({
          width: text.length * 8,
        })),
        fillText: vi.fn(),
        fillStyle: '',
        save: vi.fn(),
        restore: vi.fn(),
        strokeRect: vi.fn(),
        strokeStyle: '',
        lineWidth: 0,
      } as unknown as CanvasRenderingContext2D;

      const annotation: TextAnnotation = {
        id: 'test-1',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        text: 'Line1\n\nLine3',
        color: '#E74C3C',
        fontSize: 15,
      };

      const annotations = [annotation];
      const textTool = new TextTool(annotations, mockRedraw, mockToolChange);

      textTool.render(mockCtx);

      // Should render all lines including the empty one
      // First line "Line1", empty line, then "Line3"
      expect(mockCtx.fillText).toHaveBeenCalled();
      const calls = (mockCtx.fillText as any).mock.calls;
      // Should have at least 3 calls for the 3 lines
      expect(calls.length).toBeGreaterThanOrEqual(3);
    });
  });
});
