import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { TextTool } from './text-tool';

// Helper to get textarea element
const getTextArea = (): HTMLTextAreaElement | null => {
  return document.querySelector('textarea') as HTMLTextAreaElement | null;
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
      canvas: mockCanvas,  // Add reference to canvas for getBoundingClientRect access
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
    // Clean up any textareas
    document.querySelectorAll('textarea').forEach((textarea) => {
      textarea.remove();
    });
  });

  describe('drawing rectangle', () => {
    it('should start drawing on mousedown', () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      expect(textTool['isDrawing']).toBe(true);
      expect(textTool['startPoint']).toEqual({ x: 100, y: 100 });
    });

    it('should update currentBox on mousemove while drawing', () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 200, clientY: 150 } as MouseEvent, mockCanvas);

      expect(textTool['currentBox']).toEqual({
        x: 100,
        y: 100,
        width: 100,
        height: 50,
      });
    });

    it('should constrain dragging to right and down only', () => {
      textTool.handleMouseDown({ clientX: 200, clientY: 200 } as MouseEvent, mockCanvas);

      // Try to drag left and up
      textTool.handleMouseMove({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      // Width and height should be minimum size (2px), not 0
      expect(textTool['currentBox']?.width).toBe(2);
      expect(textTool['currentBox']?.height).toBe(2);
    });

    it('should call redraw during mousemove', () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      mockRedraw.mockClear();

      textTool.handleMouseMove({ clientX: 200, clientY: 150 } as MouseEvent, mockCanvas);

      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should not update box if not drawing', () => {
      textTool.handleMouseMove({ clientX: 200, clientY: 150 } as MouseEvent, mockCanvas);

      expect(textTool['currentBox']).toBeNull();
    });
  });

  describe('textarea creation', () => {
    it('should create textarea on mouseup with valid box size', () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 250, clientY: 200 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 250, clientY: 200 } as MouseEvent, mockCanvas);

      const textarea = getTextArea();
      expect(textarea).toBeTruthy();
      expect(textarea?.tagName).toBe('TEXTAREA');
    });

    it('should not create textarea if box is too small', () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 105, clientY: 105 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 105, clientY: 105 } as MouseEvent, mockCanvas);

      expect(getTextArea()).toBeNull();
    });

    it('should auto-focus textarea on creation', () => {
      const focusSpy = vi.spyOn(HTMLTextAreaElement.prototype, 'focus');

      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 250, clientY: 200 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 250, clientY: 200 } as MouseEvent, mockCanvas);

      expect(focusSpy).toHaveBeenCalled();
      focusSpy.mockRestore();
    });

    it('should apply correct styling to textarea', () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 250, clientY: 200 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 250, clientY: 200 } as MouseEvent, mockCanvas);

      const textarea = getTextArea()!;
      expect(textarea.style.position).toBe('fixed');
      expect(textarea.style.fontFamily).toContain('Inter');
      expect(textarea.style.fontWeight).toBe('500');
      expect(textarea.style.resize).toBe('none');
      expect(textarea.style.whiteSpace).toBe('pre-wrap');
    });
  });

  describe('annotation creation', () => {
    it('should create annotation with width and height on blur', async () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      const textarea = getTextArea()!;
      textarea.value = 'Test text';
      textarea.dispatchEvent(new Event('blur'));

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(textTool['annotations']).toHaveLength(1);
      expect(textTool['annotations'][0]).toMatchObject({
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        text: 'Test text',
        color: '#E74C3C',
        fontSize: 14,
      });
    });

    it('should not create annotation if text is empty', async () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      const textarea = getTextArea()!;
      textarea.value = '   '; // Only whitespace
      textarea.dispatchEvent(new Event('blur'));

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(textTool['annotations']).toHaveLength(0);
    });

    it('should trim whitespace from text', async () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      const textarea = getTextArea()!;
      textarea.value = '  Trimmed text  ';
      textarea.dispatchEvent(new Event('blur'));

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(textTool['annotations'][0].text).toBe('Trimmed text');
    });

    it('should generate unique ID for annotation', async () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      const textarea = getTextArea()!;
      textarea.value = 'Test';
      textarea.dispatchEvent(new Event('blur'));

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(textTool['annotations'][0].id).toBeTruthy();
      expect(typeof textTool['annotations'][0].id).toBe('string');
    });
  });

  describe('keyboard handling', () => {
    it('should remove textarea on Escape key', () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      const textarea = getTextArea()!;
      textarea.value = 'Should be cancelled';

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      textarea.dispatchEvent(escapeEvent);

      expect(getTextArea()).toBeNull();
      expect(textTool['annotations']).toHaveLength(0);
    });

    it('should allow Enter key for multiline text', () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      const textarea = getTextArea()!;
      textarea.value = 'Line 1';

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      textarea.dispatchEvent(enterEvent);

      // Textarea should still exist for multiline input
      expect(getTextArea()).toBeTruthy();
    });
  });

  describe('rendering', () => {
    it('should render drawing preview rectangle', () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      textTool.render(mockCtx);

      expect(mockCtx.strokeRect).toHaveBeenCalledWith(100, 100, 200, 150);
    });

    it('should render saved annotations with border', () => {
      textTool['annotations'] = [{
        id: 'test-1',
        x: 50,
        y: 50,
        width: 200,
        height: 100,
        text: 'Test',
        color: '#E74C3C',
        fontSize: 14,
      }];

      textTool.render(mockCtx);

      expect(mockCtx.strokeRect).toHaveBeenCalledWith(50, 50, 200, 100);
    });

    it('should render text with wrapping', () => {
      textTool['annotations'] = [{
        id: 'test-1',
        x: 50,
        y: 50,
        width: 200,
        height: 100,
        text: 'Test text',
        color: '#E74C3C',
        fontSize: 14,
      }];

      textTool.render(mockCtx);

      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it('should not render if box has no size', () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      // No mousemove, so box has size 0

      textTool.render(mockCtx);

      expect(mockCtx.strokeRect).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should finalize existing textarea before starting new rectangle', () => {
      // Create first textarea
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      const firstTextarea = getTextArea()!;
      firstTextarea.value = 'First';

      // Try to start new rectangle
      textTool.handleMouseDown({ clientX: 400, clientY: 400 } as MouseEvent, mockCanvas);

      // First textarea should be removed
      expect(getTextArea()).toBeNull();
    });

    it('should switch to select tool when finalizing even if user does not enter text', () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 250, clientY: 200 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 250, clientY: 200 } as MouseEvent, mockCanvas);

      const textarea = getTextArea()!;
      textarea.value = ''; // Empty text
      mockToolChange.mockClear();

      // Finalize by clicking outside
      textTool.handleMouseDown({ clientX: 400, clientY: 400 } as MouseEvent, mockCanvas);

      // Should still switch to select tool even with no text
      expect(mockToolChange).toHaveBeenCalledWith('select');
    });

    it('should handle canvas offset correctly', () => {
      mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 50,
        top: 100,
        width: 800,
        height: 600,
      });

      textTool.handleMouseDown({ clientX: 150, clientY: 200 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 350, clientY: 350 } as MouseEvent, mockCanvas);

      expect(textTool['currentBox']).toEqual({
        x: 100,
        y: 100,
        width: 200,
        height: 150,
      });
    });
  });

  describe('tool switching', () => {
    it('should call onToolChange with "select" after finalizing textarea', () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 250, clientY: 200 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 250, clientY: 200 } as MouseEvent, mockCanvas);

      // Tool change should NOT happen yet (allow resizing)
      expect(mockToolChange).not.toHaveBeenCalled();

      // Finalize by clicking outside
      textTool.handleMouseDown({ clientX: 400, clientY: 400 } as MouseEvent, mockCanvas);

      // Now tool change should happen
      expect(mockToolChange).toHaveBeenCalledWith('select');
      expect(mockToolChange).toHaveBeenCalledTimes(1);
    });

    it('should not call onToolChange if box is too small', () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 105, clientY: 105 } as MouseEvent, mockCanvas);

      textTool.handleMouseUp({ clientX: 105, clientY: 105 } as MouseEvent, mockCanvas);

      expect(mockToolChange).not.toHaveBeenCalled();
    });

    it('should not call onToolChange until finalizing textarea', () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 250, clientY: 200 } as MouseEvent, mockCanvas);
      mockToolChange.mockClear();

      textTool.handleMouseUp({ clientX: 250, clientY: 200 } as MouseEvent, mockCanvas);

      // Tool change should NOT be called yet
      expect(mockToolChange).not.toHaveBeenCalled();

      // Textarea should be created
      const textarea = getTextArea();
      expect(textarea).toBeTruthy();
    });

    it('should switch to select tool even if user does not enter text', () => {
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 250, clientY: 200 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 250, clientY: 200 } as MouseEvent, mockCanvas);

      // Tool change should not happen yet
      expect(mockToolChange).not.toHaveBeenCalled();

      // Finalize by clicking outside (without entering text)
      textTool.handleMouseDown({ clientX: 400, clientY: 400 } as MouseEvent, mockCanvas);

      // Should switch to select tool regardless of text input
      expect(mockToolChange).toHaveBeenCalledWith('select');
    });
  });

  describe('textarea positioning to match strokeRect', () => {
    it('should offset textarea position by borderWidth/2 to match strokeRect visual rendering', () => {
      // Draw a box
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 200 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 200 } as MouseEvent, mockCanvas);

      const textarea = getTextArea();
      expect(textarea).toBeTruthy();

      if (textarea) {
        // strokeRect with 2px lineWidth centers 1px inside and 1px outside the path
        // For a box at (100, 100), the visual border extends from (99, 99) to (301, 201)
        // Textarea should be positioned to match this, offset by borderWidth/2 = 1px
        const borderOffset = 1; // 2px border / 2

        // Extract numeric values from position strings
        const leftPx = parseFloat(textarea.style.left);
        const topPx = parseFloat(textarea.style.top);
        const widthPx = parseFloat(textarea.style.width);
        const heightPx = parseFloat(textarea.style.height);

        // Textarea offset by borderWidth/2 for text alignment
        expect(leftPx).toBe(100 - borderOffset);
        expect(topPx).toBe(100 - borderOffset);

        // Width/height expanded by borderOffset on both sides
        expect(widthPx).toBe(200 + borderOffset * 2);
        expect(heightPx).toBe(100 + borderOffset * 2);
      }
    });

    it('should ensure textarea border visually aligns with rendered rectangle preview', () => {
      // This test verifies that the border doesn't "jump" when transitioning
      // from drawing preview (strokeRect) to textarea input
      textTool.handleMouseDown({ clientX: 50, clientY: 50 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 250, clientY: 150 } as MouseEvent, mockCanvas);

      // Before mouseup, currentBox is rendered with strokeRect
      expect(textTool['currentBox']).toEqual({
        x: 50,
        y: 50,
        width: 200,
        height: 100,
      });

      textTool.handleMouseUp({ clientX: 250, clientY: 150 } as MouseEvent, mockCanvas);

      const textarea = getTextArea();
      expect(textarea).toBeTruthy();

      if (textarea) {
        // Textarea offset by borderWidth/2 to align with strokeRect visual rendering
        expect(parseFloat(textarea.style.left)).toBe(49);
        expect(parseFloat(textarea.style.top)).toBe(49);
        expect(parseFloat(textarea.style.width)).toBe(202);
        expect(parseFloat(textarea.style.height)).toBe(102);
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
        fontSize: 14,
      };

      const annotations = [annotation];
      const testTool = new TextTool(annotations, mockRedraw, mockToolChange);

      // Render the annotation
      testTool.render(mockCtx);

      // The text should be rendered with fillText
      expect(mockCtx.fillText).toHaveBeenCalled();

      // Get the position where text was rendered
      const fillTextCalls = (mockCtx.fillText as any).mock.calls;
      const firstCall = fillTextCalls[0];
      const renderedX = firstCall[1];
      const renderedY = firstCall[2];

      // Expected position calculation:
      // strokeRect centers 2px border: inner edge at x + 1
      // Textarea padding: 10px
      // Font metrics adjustment: 1px (to align with textarea rendering)
      // Total X offset: 1 + 10 = 11px
      // Total Y offset: 1 + 10 + 1 = 12px
      const borderOffset = 1; // borderWidth(2px) / 2
      const padding = 10;
      const fontMetricsAdjustment = 1; // Compensation for textarea vs canvas text rendering
      const expectedX = annotation.x + borderOffset + padding; // 100 + 11 = 111
      const expectedY = annotation.y + borderOffset + padding + fontMetricsAdjustment; // 100 + 12 = 112

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
        fontSize: 14,
      };

      const annotations = [annotation];
      const testTool = new TextTool(annotations, mockRedraw, mockToolChange);

      // Spy on wrapText to verify maxWidth calculation
      const wrapTextSpy = vi.spyOn(testTool as any, 'wrapText');

      testTool.render(mockCtx);

      // Verify wrapText was called
      expect(wrapTextSpy).toHaveBeenCalled();

      // Get the maxWidth parameter
      const wrapTextCall = wrapTextSpy.mock.calls[0];
      const maxWidth = wrapTextCall[2]; // third parameter

      // Expected maxWidth calculation:
      // width - (borderOffset + padding) * 2
      // 200 - (1 + 10) * 2 = 200 - 22 = 178
      const borderOffset = 1;
      const padding = 10;
      const expectedMaxWidth = annotation.width - (borderOffset + padding) * 2;

      expect(maxWidth).toBe(expectedMaxWidth);
    });
  });

  describe('text jump bug with DPR > 1', () => {
    it('should render text at the same position as textarea with DPR=2', () => {
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
        width: 400,  // Displayed at 400px
        height: 300,
      });
      mockCanvas.width = 800;  // Internal canvas size (400 * 2 for retina)
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
        fontSize: 14,
      };

      textTool['annotations'] = [annotation];

      // Render to canvas (now scaleX will be 2)
      textTool.render(mockCtx);

      // Get where canvas text was rendered
      const fillTextCalls = (mockCtx.fillText as any).mock.calls;
      const canvasTextX = fillTextCalls[0][1];
      const canvasTextY = fillTextCalls[0][2];

      // Now simulate textarea creation at the same position
      const box = { x: 100, y: 100, width: 200, height: 100 };

      textTool['createTextArea'](mockCanvas, box);

      const textarea = getTextArea()!;
      expect(textarea).toBeTruthy();

      // Calculate where textarea text would appear in canvas coordinates
      const scaleX = mockCanvas.width / 400; // 800 / 400 = 2
      const textareaLeft = parseFloat(textarea.style.left); // CSS pixels
      const textareaPadding = 10; // CSS pixels
      const textareaBorder = 2; // CSS pixels, but textarea has no border - this is for strokeRect offset
      // Textarea positioned with borderOffset, text starts at: left + border + padding
      const textareaTextStartCSS = textareaLeft + textareaBorder + textareaPadding;
      const textareaTextStartCanvas = textareaTextStartCSS * scaleX;

      // Canvas text position (already in canvas pixels)
      // Expected: both should be at the same position
      // Canvas renders at: x + (borderOffset + textareaPadding) = 100 + (1*scaleX + 10*scaleX) = 100 + 22 = 122
      // Textarea text at: see calculation above
      // They should match!
      expect(canvasTextX).toBe(textareaTextStartCanvas);

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
      mockCanvas.width = 1000;  // Not 400*2 = 800, but 1000!
      mockCanvas.height = 750;

      const annotation = {
        id: 'test-mismatch',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        text: 'Test',
        color: '#E74C3C',
        fontSize: 14,
      };

      textTool['annotations'] = [annotation];
      textTool.render(mockCtx);

      const fillTextCalls = (mockCtx.fillText as any).mock.calls;
      const canvasTextX = fillTextCalls[0][1];

      // Canvas with non-standard scaling
      const box = { x: 100, y: 100, width: 200, height: 100 };

      textTool['createTextArea'](mockCanvas, box);

      const textarea = getTextArea()!;
      const scaleX = mockCanvas.width / 400; // 1000 / 400 = 2.5
      const textareaTextStartCanvas = (parseFloat(textarea.style.left) + 2 + 10) * scaleX;

      // Now they should match because we're using scaleX consistently!
      expect(canvasTextX).toBe(textareaTextStartCanvas);

      // Clean up
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 1,
      });
    });
  });

  describe('resize handles', () => {
    it('should render 4 corner handles when textarea is active', () => {
      // Draw and create textarea
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      // Clear previous calls
      vi.clearAllMocks();

      // Render with textarea active
      textTool.render(mockCtx);

      // Should render the rectangle border
      expect(mockCtx.strokeRect).toHaveBeenCalled();
    });

    it('should detect top-left handle click and start resize', () => {
      // Create textarea
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      const textarea = getTextArea()!;
      expect(textarea).not.toBeNull();

      // Click on top-left handle (100, 100)
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      // Textarea should still exist (not finalized)
      expect(getTextArea()).not.toBeNull();
    });

    it('should detect bottom-right handle click and start resize', () => {
      // Create textarea
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      // Click on bottom-right handle (300, 250)
      textTool.handleMouseDown({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      // Textarea should still exist (not finalized)
      expect(getTextArea()).not.toBeNull();
    });

    it('should resize from bottom-right handle', () => {
      // Create textarea
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      const textarea = getTextArea()!;
      const initialWidth = textarea.style.width;
      const initialHeight = textarea.style.height;

      // Start resize from bottom-right
      textTool.handleMouseDown({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      // Drag to make it larger
      textTool.handleMouseMove({ clientX: 400, clientY: 350 } as MouseEvent, mockCanvas);

      // Textarea dimensions should have changed
      expect(textarea.style.width).not.toBe(initialWidth);
      expect(textarea.style.height).not.toBe(initialHeight);
    });

    it('should resize from top-left handle', () => {
      // Create textarea
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      const textarea = getTextArea()!;
      const initialLeft = textarea.style.left;
      const initialTop = textarea.style.top;

      // Start resize from top-left
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      // Drag inward
      textTool.handleMouseMove({ clientX: 150, clientY: 150 } as MouseEvent, mockCanvas);

      // Textarea position and size should have changed
      expect(textarea.style.left).not.toBe(initialLeft);
      expect(textarea.style.top).not.toBe(initialTop);
    });

    it('should end resize on mouseup', () => {
      // Create textarea
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      // Start resize
      textTool.handleMouseDown({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 400, clientY: 350 } as MouseEvent, mockCanvas);

      // End resize
      textTool.handleMouseUp({ clientX: 400, clientY: 350 } as MouseEvent, mockCanvas);

      // Should call onRedraw
      expect(mockRedraw).toHaveBeenCalled();

      // Textarea should still exist (not finalized)
      expect(getTextArea()).not.toBeNull();
    });

    it('should enforce minimum size during resize', () => {
      // Create textarea
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      const textarea = getTextArea()!;

      // Start resize from bottom-right
      textTool.handleMouseDown({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      // Try to drag to make it very small (less than minimum 50px)
      textTool.handleMouseMove({ clientX: 110, clientY: 110 } as MouseEvent, mockCanvas);

      // Parse dimensions (remove 'px' and convert to number)
      const width = parseFloat(textarea.style.width);
      const height = parseFloat(textarea.style.height);

      // Should be at least minimum size
      expect(width).toBeGreaterThanOrEqual(50);
      expect(height).toBeGreaterThanOrEqual(50);
    });

    it('should set nwse-resize cursor when hovering over top-left handle', () => {
      // Create textarea
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      // Hover over top-left handle
      textTool.handleMouseMove({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      expect(mockCanvas.style.cursor).toBe('nwse-resize');
    });

    it('should set nesw-resize cursor when hovering over top-right handle', () => {
      // Create textarea
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      // Hover over top-right handle
      textTool.handleMouseMove({ clientX: 300, clientY: 100 } as MouseEvent, mockCanvas);

      expect(mockCanvas.style.cursor).toBe('nesw-resize');
    });

    it('should set text cursor when hovering over textarea content', () => {
      // Create textarea
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      // Hover over center of textarea
      textTool.handleMouseMove({ clientX: 200, clientY: 175 } as MouseEvent, mockCanvas);

      expect(mockCanvas.style.cursor).toBe('text');
    });

    it('should update textarea data attributes during resize', () => {
      // Create textarea
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      const textarea = getTextArea()!;
      const initialCanvasWidth = textarea.dataset.canvasWidth;

      // Resize from bottom-right
      textTool.handleMouseDown({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 400, clientY: 350 } as MouseEvent, mockCanvas);

      // Dataset should be updated
      expect(textarea.dataset.canvasWidth).not.toBe(initialCanvasWidth);
    });

    it('should disable textarea pointer events when hovering over handles', () => {
      // Draw and create textarea
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      const textarea = getTextArea()!;
      expect(textarea).toBeTruthy();

      // Initially pointer events should be auto
      expect(textarea.style.pointerEvents).toBe('auto');

      // Hover over top-left handle
      textTool.handleMouseMove({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);

      // Pointer events should be disabled
      expect(textarea.style.pointerEvents).toBe('none');

      // Move away from handle
      textTool.handleMouseMove({ clientX: 200, clientY: 175 } as MouseEvent, mockCanvas);

      // Pointer events should be re-enabled
      expect(textarea.style.pointerEvents).toBe('auto');

      // Clean up
      textarea.remove();
    });

    it('should keep pointer events disabled during resize and restore after', () => {
      // Draw and create textarea
      textTool.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
      textTool.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);
      textTool.handleMouseUp({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      const textarea = getTextArea()!;

      // Start resize
      textTool.handleMouseDown({ clientX: 300, clientY: 250 } as MouseEvent, mockCanvas);

      // During resize, pointer events should be disabled
      textTool.handleMouseMove({ clientX: 350, clientY: 300 } as MouseEvent, mockCanvas);
      expect(textarea.style.pointerEvents).toBe('none');

      // End resize
      textTool.handleMouseUp({ clientX: 350, clientY: 300 } as MouseEvent, mockCanvas);

      // After resize, pointer events should be restored
      expect(textarea.style.pointerEvents).toBe('auto');

      // Clean up
      textarea.remove();
    });
  });
});

