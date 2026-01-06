import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { TextTool } from './text-tool';

// Helper to get textarea element
const getTextArea = (): HTMLTextAreaElement | null => {
  return document.querySelector('textarea') as HTMLTextAreaElement | null;
};

describe('TextTool', () => {
  let textTool: TextTool;
  let mockRedraw: Mock;
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    mockRedraw = vi.fn();
    textTool = new TextTool([], mockRedraw);

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

      // Width and height should be 0, not negative
      expect(textTool['currentBox']?.width).toBe(0);
      expect(textTool['currentBox']?.height).toBe(0);
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
      expect(mockCtx.setLineDash).toHaveBeenCalled();
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
});
