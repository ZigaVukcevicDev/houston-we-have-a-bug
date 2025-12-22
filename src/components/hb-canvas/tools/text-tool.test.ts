import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { TextTool } from './text-tool';

// Helper to get input element with proper typing
const getTextInput = (): HTMLInputElement | null => {
  return document.querySelector('input[type="text"]') as HTMLInputElement | null;
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
      textBaseline: '',
      fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
  });

  afterEach(() => {
    // Clean up any text inputs that might have been created
    document.querySelectorAll('input[type="text"]').forEach((input) => {
      input.remove();
    });
  });

  describe('handleClick', () => {
    it('should create text input on first click', () => {
      const event = {
        clientX: 100,
        clientY: 150,
      } as MouseEvent;

      textTool.handleClick(event, mockCanvas);

      const input = getTextInput();
      expect(input).toBeTruthy();
      expect(input?.style.position).toBe('fixed');
    });

    it('should finalize existing text input on second click', () => {
      // First click - create input
      textTool.handleClick(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );

      const input = getTextInput()!;
      input.value = 'Test Text';

      // Second click - finalize
      textTool.handleClick(
        { clientX: 200, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      expect(textTool['annotations']).toHaveLength(1);
      expect(textTool['annotations'][0].text).toBe('Test Text');
      expect(getTextInput()).toBeNull();
    });

    it('should position text input correctly with canvas scaling', () => {
      mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 400, // Half width
        height: 300, // Half height
      });

      textTool.handleClick(
        { clientX: 100, clientY: 150 } as MouseEvent,
        mockCanvas
      );

      const input = getTextInput()!;
      expect(input.dataset.canvasX).toBe('200');
      expect(input.dataset.canvasY).toBe('300');
    });

    it('should apply correct styling to text input', () => {
      textTool.handleClick(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );

      const input = getTextInput()!;
      expect(input.style.position).toBe('fixed');
      expect(input.style.color).toBe('#BD2D1E');
      expect(input.style.fontWeight).toBe('bold');
      expect(input.style.fontFamily).toContain('Arial');
    });

    it('should focus text input after creation', () => {
      const focusSpy = vi.spyOn(HTMLInputElement.prototype, 'focus');

      textTool.handleClick(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );

      expect(focusSpy).toHaveBeenCalled();
      focusSpy.mockRestore();
    });
  });

  describe('keyboard handling', () => {
    beforeEach(() => {
      textTool.handleClick(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
    });

    it('should finalize text on Enter key', () => {
      const input = getTextInput()!;
      input.value = 'Enter Test';

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);

      expect(textTool['annotations']).toHaveLength(1);
      expect(textTool['annotations'][0].text).toBe('Enter Test');
      expect(getTextInput()).toBeNull();
    });

    it('should cancel text input on Escape key', () => {
      const input = getTextInput()!;
      input.value = 'Escape Test';

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      input.dispatchEvent(escapeEvent);

      expect(textTool['annotations']).toHaveLength(0);
      expect(getTextInput()).toBeNull();
    });

    it('should not finalize on other keys', () => {
      const input = getTextInput()!;
      input.value = 'Other Key Test';

      const aKeyEvent = new KeyboardEvent('keydown', { key: 'a' });
      input.dispatchEvent(aKeyEvent);

      expect(textTool['annotations']).toHaveLength(0);
      expect(getTextInput()).toBeTruthy();
    });
  });

  describe('text finalization', () => {
    beforeEach(() => {
      textTool.handleClick(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );
      mockRedraw.mockClear();
    });

    it('should add annotation with correct properties', () => {
      const input = getTextInput()!;
      input.value = 'Test Annotation';
      input.dataset.canvasX = '150';
      input.dataset.canvasY = '200';

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);

      expect(textTool['annotations'][0]).toMatchObject({
        x: 150,
        y: 200,
        text: 'Test Annotation',
        color: '#BD2D1E',
        fontSize: 24,
      });
    });

    it('should call redraw after finalization', () => {
      const input = getTextInput()!;
      input.value = 'Redraw Test';

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);

      expect(mockRedraw).toHaveBeenCalled();
    });

    it('should not add annotation if text is empty', () => {
      const input = getTextInput()!;
      input.value = '   '; // Only whitespace

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);

      expect(textTool['annotations']).toHaveLength(0);
    });

    it('should trim whitespace from text', () => {
      const input = getTextInput()!;
      input.value = '  Trimmed Text  ';

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);

      expect(textTool['annotations'][0].text).toBe('Trimmed Text');
    });

    it('should allow multiple text annotations', () => {
      // First annotation
      const input1 = getTextInput()!;
      input1.value = 'First';
      const enterEvent1 = new KeyboardEvent('keydown', { key: 'Enter' });
      input1.dispatchEvent(enterEvent1);

      // Second annotation
      textTool.handleClick(
        { clientX: 200, clientY: 200 } as MouseEvent,
        mockCanvas
      );
      const input2 = getTextInput()!;
      input2.value = 'Second';
      const enterEvent2 = new KeyboardEvent('keydown', { key: 'Enter' });
      input2.dispatchEvent(enterEvent2);

      expect(textTool['annotations']).toHaveLength(2);
      expect(textTool['annotations'][0].text).toBe('First');
      expect(textTool['annotations'][1].text).toBe('Second');
    });
  });

  describe('render', () => {
    beforeEach(() => {
      // Add some annotations
      textTool.handleClick(
        { clientX: 50, clientY: 50 } as MouseEvent,
        mockCanvas
      );
      let input = getTextInput()!;
      input.value = 'First Text';
      input.dataset.canvasX = '100';
      input.dataset.canvasY = '100';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      textTool.handleClick(
        { clientX: 150, clientY: 150 } as MouseEvent,
        mockCanvas
      );
      input = getTextInput()!;
      input.value = 'Second Text';
      input.dataset.canvasX = '200';
      input.dataset.canvasY = '200';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      mockCtx.fillText = vi.fn();
    });

    it('should render all text annotations', () => {
      textTool.render(mockCtx);

      expect(mockCtx.fillText).toHaveBeenCalledTimes(2);
      expect(mockCtx.fillText).toHaveBeenCalledWith('First Text', 100, 100);
      expect(mockCtx.fillText).toHaveBeenCalledWith('Second Text', 200, 200);
    });

    it('should apply correct text styling', () => {
      textTool.render(mockCtx);

      expect(mockCtx.font).toBe('bold 24px Arial, sans-serif');
      expect(mockCtx.fillStyle).toBe('#BD2D1E');
      expect(mockCtx.textBaseline).toBe('middle');
    });

    it('should handle empty annotations', () => {
      const emptyTextTool = new TextTool([], vi.fn());

      emptyTextTool.render(mockCtx);

      expect(mockCtx.fillText).not.toHaveBeenCalled();
    });

    it('should render each annotation with its own color and fontSize', () => {
      // Manually create annotations with different properties
      textTool['annotations'] = [
        { x: 10, y: 10, text: 'Red 20', color: '#FF0000', fontSize: 20 },
        { x: 20, y: 20, text: 'Blue 30', color: '#0000FF', fontSize: 30 },
      ];

      textTool.render(mockCtx);

      // Font should change for each annotation
      expect(mockCtx.font).toBe('bold 30px Arial, sans-serif'); // Last one
      expect(mockCtx.fillStyle).toBe('#0000FF'); // Last one
    });
  });

  describe('edge cases', () => {
    it('should handle rapid clicks without errors', () => {
      expect(() => {
        textTool.handleClick({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvas);
        textTool.handleClick({ clientX: 110, clientY: 110 } as MouseEvent, mockCanvas);
        textTool.handleClick({ clientX: 120, clientY: 120 } as MouseEvent, mockCanvas);
      }).not.toThrow();
    });

    it('should handle canvas offset correctly', () => {
      mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 50,
        top: 100,
        width: 800,
        height: 600,
      });

      textTool.handleClick(
        { clientX: 150, clientY: 200 } as MouseEvent,
        mockCanvas
      );

      const input = getTextInput()!;
      expect(input.dataset.canvasX).toBe('100');
      expect(input.dataset.canvasY).toBe('100');
    });

    it('should clean up event listeners when removing input', () => {
      const removeEventListenerSpy = vi.spyOn(
        HTMLInputElement.prototype,
        'removeEventListener'
      );

      textTool.handleClick(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );

      const input = getTextInput()!;
      input.value = 'Test';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'blur',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });

    it('should handle very long text', () => {
      textTool.handleClick(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );

      const input = getTextInput()!;
      const longText = 'A'.repeat(1000);
      input.value = longText;

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(textTool['annotations'][0].text).toBe(longText);
    });

    it('should handle special characters in text', () => {
      textTool.handleClick(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );

      const input = getTextInput()!;
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      input.value = specialText;

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(textTool['annotations'][0].text).toBe(specialText);
    });
  });

  describe('blur handling', () => {
    it('should finalize text on blur', async () => {
      textTool.handleClick(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvas
      );

      const input = getTextInput()!;
      input.value = 'Blur Test';

      input.dispatchEvent(new Event('blur'));

      // Blur has a timeout, so we need to wait
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(textTool['annotations']).toHaveLength(1);
      expect(textTool['annotations'][0].text).toBe('Blur Test');
    });
  });
});
