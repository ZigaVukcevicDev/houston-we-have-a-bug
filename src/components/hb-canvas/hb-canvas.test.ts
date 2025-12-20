import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HBCanvas } from './hb-canvas';

describe('HBCanvas', () => {
  let canvas: HBCanvas;

  beforeEach(() => {
    canvas = new HBCanvas();
  });

  afterEach(() => {
    // Clean up any text inputs that might have been created
    document.querySelectorAll('input[type="text"]').forEach((input) => {
      input.remove();
    });
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should have default dataUrl property', () => {
      expect(canvas.dataUrl).toBe('');
    });

    it('should have default drawing mode as "text"', () => {
      expect(canvas.drawingMode).toBe('text');
    });

    it('should initialize tools map with text and line tools', () => {
      const tools = canvas['tools'];
      expect(tools.size).toBe(2);
      expect(tools.get('text')).toBeDefined();
      expect(tools.get('line')).toBeDefined();
    });

    it('should create tools with render method', () => {
      const textTool = canvas['tools'].get('text');
      const lineTool = canvas['tools'].get('line');

      expect(textTool).toBeDefined();
      expect(lineTool).toBeDefined();
      expect(typeof textTool?.render).toBe('function');
      expect(typeof lineTool?.render).toBe('function');
    });
  });

  describe('drawing mode', () => {
    it('should switch to line mode', () => {
      canvas.drawingMode = 'line';
      expect(canvas.drawingMode).toBe('line');
    });

    it('should switch to text mode', () => {
      canvas.drawingMode = 'line';
      canvas.drawingMode = 'text';
      expect(canvas.drawingMode).toBe('text');
    });

    it('should return correct active tool based on drawing mode', () => {
      const textTool = canvas['tools'].get('text');
      const lineTool = canvas['tools'].get('line');

      canvas.drawingMode = 'text';
      expect(canvas['_activeTool']).toBe(textTool);

      canvas.drawingMode = 'line';
      expect(canvas['_activeTool']).toBe(lineTool);
    });

    it('should return undefined for invalid drawing mode', () => {
      canvas.drawingMode = 'invalid' as any;
      expect(canvas['_activeTool']).toBeUndefined();
    });
  });

  describe('image loading', () => {
    let mockCanvasElement: any;
    let mockCtx: any;

    beforeEach(() => {
      mockCtx = {
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        fillText: vi.fn(),
        strokeStyle: '',
        lineWidth: 0,
        lineCap: '',
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
      };

      mockCanvasElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
        }),
        width: 800,
        height: 600,
        getContext: vi.fn().mockReturnValue(mockCtx),
        style: {},
      };

      Object.defineProperty(canvas, 'canvas', {
        value: mockCanvasElement,
        writable: true,
      });

      canvas['firstUpdated']();
    });

    it('should not load image if dataUrl is empty', async () => {
      canvas.dataUrl = '';
      await canvas['_loadImage']();
      expect(mockCtx.drawImage).not.toHaveBeenCalled();
    });

    it('should verify image loading method exists', () => {
      // Integration testing of image loading requires proper DOM/Image mocking
      // This test verifies the method exists and is callable
      expect(canvas['_loadImage']).toBeDefined();
      expect(typeof canvas['_loadImage']).toBe('function');
    });

    it('should trigger image load when dataUrl changes', async () => {
      const loadImageSpy = vi.spyOn(canvas as any, '_loadImage');

      canvas.dataUrl = 'data:image/png;base64,newimage';
      canvas['updated'](new Map([['dataUrl', '']]));

      expect(loadImageSpy).toHaveBeenCalled();
    });

    it('should not reload image when other properties change', () => {
      const loadImageSpy = vi.spyOn(canvas as any, '_loadImage');

      canvas['updated'](new Map([['drawingMode', 'text']]));

      expect(loadImageSpy).not.toHaveBeenCalled();
    });
  });

  describe('redraw functionality', () => {
    let mockCanvasElement: any;
    let mockCtx: any;
    let mockImage: HTMLImageElement;

    beforeEach(() => {
      mockCtx = {
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        fillText: vi.fn(),
        font: '',
        fillStyle: '',
        textBaseline: '',
        strokeStyle: '',
        lineWidth: 0,
        lineCap: '',
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
      };

      mockCanvasElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
        }),
        width: 800,
        height: 600,
        getContext: vi.fn().mockReturnValue(mockCtx),
        style: {},
      };

      mockImage = { width: 800, height: 600 } as HTMLImageElement;

      Object.defineProperty(canvas, 'canvas', {
        value: mockCanvasElement,
        writable: true,
      });

      canvas['firstUpdated']();
      canvas['originalImage'] = mockImage;
    });

    it('should not redraw if no image is loaded', () => {
      canvas['originalImage'] = null;
      canvas['_redraw']();
      expect(mockCtx.clearRect).not.toHaveBeenCalled();
    });

    it('should clear canvas and redraw image', () => {
      canvas['_redraw']();

      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(mockCtx.drawImage).toHaveBeenCalledWith(mockImage, 0, 0);
    });

    it('should render all tools during redraw', () => {
      const textTool = canvas['tools'].get('text')!;
      const lineTool = canvas['tools'].get('line')!;

      const textRenderSpy = vi.spyOn(textTool, 'render');
      const lineRenderSpy = vi.spyOn(lineTool, 'render');

      canvas['_redraw']();

      expect(textRenderSpy).toHaveBeenCalledWith(mockCtx);
      expect(lineRenderSpy).toHaveBeenCalledWith(mockCtx);
    });
  });

  describe('event handling delegation', () => {
    let mockCanvasElement: any;
    let mockCtx: any;

    beforeEach(() => {
      mockCtx = {
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        fillText: vi.fn(),
        strokeStyle: '',
        lineWidth: 0,
        lineCap: '',
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
      };

      mockCanvasElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
        }),
        width: 800,
        height: 600,
        getContext: vi.fn().mockReturnValue(mockCtx),
        style: {},
      };

      Object.defineProperty(canvas, 'canvas', {
        value: mockCanvasElement,
        writable: true,
      });

      canvas['firstUpdated']();
    });

    it('should delegate click events to active tool', () => {
      const textTool = canvas['tools'].get('text')!;
      const handleClickSpy = vi.spyOn(textTool, 'handleClick' as any);

      const event = { clientX: 100, clientY: 100 } as MouseEvent;
      canvas.drawingMode = 'text';
      canvas['_handleCanvasClick'](event);

      expect(handleClickSpy).toHaveBeenCalledWith(event, mockCanvasElement);
    });

    it('should delegate mousedown events to active tool', () => {
      const lineTool = canvas['tools'].get('line')!;
      const handleMouseDownSpy = vi.spyOn(lineTool, 'handleMouseDown');

      const event = { clientX: 50, clientY: 50 } as MouseEvent;
      canvas.drawingMode = 'line';
      canvas['_handleMouseDown'](event);

      expect(handleMouseDownSpy).toHaveBeenCalledWith(event, mockCanvasElement);
    });

    it('should delegate mousemove events to active tool', () => {
      const lineTool = canvas['tools'].get('line')!;
      const handleMouseMoveSpy = vi.spyOn(lineTool, 'handleMouseMove');

      const event = { clientX: 60, clientY: 60 } as MouseEvent;
      canvas.drawingMode = 'line';
      canvas['_handleMouseMove'](event);

      expect(handleMouseMoveSpy).toHaveBeenCalledWith(event, mockCanvasElement, mockCtx);
    });

    it('should delegate mouseup events to active tool', () => {
      const lineTool = canvas['tools'].get('line')!;
      const handleMouseUpSpy = vi.spyOn(lineTool, 'handleMouseUp');

      const event = { clientX: 100, clientY: 100 } as MouseEvent;
      canvas.drawingMode = 'line';
      canvas['_handleMouseUp'](event);

      expect(handleMouseUpSpy).toHaveBeenCalledWith(event, mockCanvasElement);
    });

    it('should not crash when active tool does not implement handler', () => {
      canvas.drawingMode = 'line';
      const lineTool = canvas['tools'].get('line')!;

      // Line tool doesn't have handleClick - should not throw
      const event = { clientX: 100, clientY: 100 } as MouseEvent;
      expect(() => canvas['_handleCanvasClick'](event)).not.toThrow();
    });

    it('should not crash when no active tool exists', () => {
      canvas.drawingMode = 'invalid' as any;

      const event = { clientX: 100, clientY: 100 } as MouseEvent;
      expect(() => canvas['_handleCanvasClick'](event)).not.toThrow();
      expect(() => canvas['_handleMouseDown'](event)).not.toThrow();
      expect(() => canvas['_handleMouseMove'](event)).not.toThrow();
      expect(() => canvas['_handleMouseUp'](event)).not.toThrow();
    });
  });

  describe('download', () => {
    let mockCanvasElement: any;

    beforeEach(() => {
      mockCanvasElement = {
        toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,mock'),
      };

      Object.defineProperty(canvas, 'canvas', {
        value: mockCanvasElement,
        writable: true,
      });
    });

    it('should create download link with default filename and quality', () => {
      const mockLink = {
        download: '',
        href: '',
        click: vi.fn(),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      canvas.download();

      expect(mockCanvasElement.toDataURL).toHaveBeenCalledWith(
        'image/jpeg',
        0.85
      );
      expect(mockLink.download).toBe('screenshot.jpg');
      expect(mockLink.href).toBe('data:image/jpeg;base64,mock');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should use custom filename and quality', () => {
      const mockLink = {
        download: '',
        href: '',
        click: vi.fn(),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      canvas.download('custom-name.png', 0.95);

      expect(mockCanvasElement.toDataURL).toHaveBeenCalledWith(
        'image/jpeg',
        0.95
      );
      expect(mockLink.download).toBe('custom-name.jpg');
    });

    it('should replace .png extension with .jpg (case insensitive)', () => {
      const mockLink = {
        download: '',
        href: '',
        click: vi.fn(),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      canvas.download('test.PNG');

      expect(mockLink.download).toBe('test.jpg');
    });

    it('should handle filenames without .png extension', () => {
      const mockLink = {
        download: '',
        href: '',
        click: vi.fn(),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      canvas.download('my-screenshot');

      expect(mockLink.download).toBe('my-screenshot');
    });

    it('should handle various quality values', () => {
      const mockLink = {
        download: '',
        href: '',
        click: vi.fn(),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      canvas.download('test.jpg', 1.0);
      expect(mockCanvasElement.toDataURL).toHaveBeenCalledWith('image/jpeg', 1.0);

      canvas.download('test.jpg', 0.1);
      expect(mockCanvasElement.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.1);
    });
  });



  describe('edge cases', () => {
    it('should handle rapid mode switches', () => {
      expect(() => {
        canvas.drawingMode = 'text';
        canvas.drawingMode = 'line';
        canvas.drawingMode = 'text';
        canvas.drawingMode = 'line';
      }).not.toThrow();
    });

    it('should handle dataUrl updates while drawing', () => {
      const mockCanvasElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
        }),
        width: 800,
        height: 600,
        getContext: vi.fn().mockReturnValue({
          clearRect: vi.fn(),
          drawImage: vi.fn(),
        }),
        style: {},
      };

      Object.defineProperty(canvas, 'canvas', {
        value: mockCanvasElement,
        writable: true,
      });

      canvas['firstUpdated']();

      expect(() => {
        canvas.dataUrl = 'data:image/png;base64,test1';
        canvas.dataUrl = 'data:image/png;base64,test2';
      }).not.toThrow();
    });

    it('should handle empty dataUrl gracefully', () => {
      canvas.dataUrl = '';
      expect(canvas.dataUrl).toBe('');
    });
  });

  describe('render method', () => {
    it('should render canvas with correct mode class', () => {
      canvas.drawingMode = 'text';
      const rendered = canvas.render();
      // Lit templates have values stored separately
      const values = rendered.values;
      expect(values).toContain('mode-text');

      canvas.drawingMode = 'line';
      const rendered2 = canvas.render();
      const values2 = rendered2.values;
      expect(values2).toContain('mode-line');
    });
  });
});
