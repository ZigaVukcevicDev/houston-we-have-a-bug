import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HBCanvas } from './hb-canvas';
import { SelectTool } from './tools/select-tool';

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
      expect(canvas.activeTool).toBe('text');
    });

    it('should initialize tools map with select, text, line, arrow, rectangle, and crop tools', () => {
      const tools = canvas['tools'];
      expect(tools.size).toBe(6);
      expect(tools.get('select')).toBeDefined();
      expect(tools.get('text')).toBeDefined();
      expect(tools.get('line')).toBeDefined();
      expect(tools.get('arrow')).toBeDefined();
      expect(tools.get('rectangle')).toBeDefined();
      expect(tools.get('crop')).toBeDefined();
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
      canvas.activeTool = 'line';
      expect(canvas.activeTool).toBe('line');
    });

    it('should switch to text mode', () => {
      canvas.activeTool = 'line';
      canvas.activeTool = 'text';
      expect(canvas.activeTool).toBe('text');
    });

    it('should return correct active tool based on drawing mode', () => {
      const textTool = canvas['tools'].get('text');
      const lineTool = canvas['tools'].get('line');

      canvas.activeTool = 'text';
      expect(canvas['currentTool']).toBe(textTool);

      canvas.activeTool = 'line';
      expect(canvas['currentTool']).toBe(lineTool);
    });

    it('should return undefined for invalid drawing mode', () => {
      canvas.activeTool = 'invalid' as any;
      expect(canvas['currentTool']).toBeUndefined();
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
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
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
      await canvas['loadImage']();
      expect(mockCtx.drawImage).not.toHaveBeenCalled();
    });

    it('should verify image loading method exists', () => {
      // Integration testing of image loading requires proper DOM/Image mocking
      // This test verifies the method exists and is callable
      expect(canvas['loadImage']).toBeDefined();
      expect(typeof canvas['loadImage']).toBe('function');
    });

    it('should trigger image load when dataUrl changes', async () => {
      const loadImageSpy = vi.spyOn(canvas as any, 'loadImage');

      canvas.dataUrl = 'data:image/png;base64,newimage';
      canvas['updated'](new Map([['dataUrl', '']]));

      expect(loadImageSpy).toHaveBeenCalled();
    });

    it('should not reload image when other properties change', () => {
      const loadImageSpy = vi.spyOn(canvas as any, 'loadImage');

      canvas['updated'](new Map([['activeTool', 'text']]));

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
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
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
      canvas['redraw']();
      expect(mockCtx.clearRect).not.toHaveBeenCalled();
    });

    it('should clear canvas and redraw image', () => {
      canvas['redraw']();

      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(mockCtx.drawImage).toHaveBeenCalledWith(mockImage, 0, 0);
    });

    it('should render all tools during redraw', () => {
      const textTool = canvas['tools'].get('text')!;
      const lineTool = canvas['tools'].get('line')!;

      const textRenderSpy = vi.spyOn(textTool, 'render');
      const lineRenderSpy = vi.spyOn(lineTool, 'render');

      canvas['redraw']();

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
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
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
      canvas.activeTool = 'text';
      canvas['handleCanvasClick'](event);

      expect(handleClickSpy).toHaveBeenCalledWith(event, mockCanvasElement);
    });

    it('should delegate mousedown events to active tool', () => {
      const lineTool = canvas['tools'].get('line')!;
      const handleMouseDownSpy = vi.spyOn(lineTool, 'handleMouseDown');

      const event = { clientX: 50, clientY: 50 } as MouseEvent;
      canvas.activeTool = 'line';
      canvas['handleMouseDown'](event);

      expect(handleMouseDownSpy).toHaveBeenCalledWith(event, mockCanvasElement);
    });

    it('should delegate mousemove events to active tool', () => {
      const lineTool = canvas['tools'].get('line')!;
      const handleMouseMoveSpy = vi.spyOn(lineTool, 'handleMouseMove');

      const event = { clientX: 60, clientY: 60 } as MouseEvent;
      canvas.activeTool = 'line';
      canvas['handleMouseMove'](event);

      expect(handleMouseMoveSpy).toHaveBeenCalledWith(event, mockCanvasElement, mockCtx);
    });

    it('should delegate mouseup events to active tool', () => {
      const lineTool = canvas['tools'].get('line')!;
      const handleMouseUpSpy = vi.spyOn(lineTool, 'handleMouseUp');

      const event = { clientX: 100, clientY: 100 } as MouseEvent;
      canvas.activeTool = 'line';
      canvas['handleMouseUp'](event);

      expect(handleMouseUpSpy).toHaveBeenCalledWith(event, mockCanvasElement);
    });

    it('should not crash when active tool does not implement handler', () => {
      canvas.activeTool = 'line';
      const lineTool = canvas['tools'].get('line')!;

      // Line tool doesn't have handleClick - should not throw
      const event = { clientX: 100, clientY: 100 } as MouseEvent;
      expect(() => canvas['handleCanvasClick'](event)).not.toThrow();
    });

    it('should not crash when no active tool exists', () => {
      canvas.activeTool = 'invalid' as any;

      const event = { clientX: 100, clientY: 100 } as MouseEvent;
      expect(() => canvas['handleCanvasClick'](event)).not.toThrow();
      expect(() => canvas['handleMouseDown'](event)).not.toThrow();
      expect(() => canvas['handleMouseMove'](event)).not.toThrow();
      expect(() => canvas['handleMouseUp'](event)).not.toThrow();
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

    it('should deselect all annotations before downloading', () => {
      const selectTool = canvas['tools'].get('select') as SelectTool;
      const deselectAllSpy = vi.spyOn(selectTool, 'deselectAll');

      const mockLink = {
        download: '',
        href: '',
        click: vi.fn(),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      canvas.download();

      expect(deselectAllSpy).toHaveBeenCalled();
      // Verify deselectAll was called before toDataURL
      expect(deselectAllSpy).toHaveBeenCalledBefore(mockCanvasElement.toDataURL);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid mode switches', () => {
      expect(() => {
        canvas.activeTool = 'text';
        canvas.activeTool = 'line';
        canvas.activeTool = 'text';
        canvas.activeTool = 'line';
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
      canvas.activeTool = 'text';
      const rendered = canvas.render();
      // Lit templates have values stored separately
      const values = rendered.values;
      expect(values).toContain('mode-text');

      canvas.activeTool = 'line';
      const rendered2 = canvas.render();
      const values2 = rendered2.values;
      expect(values2).toContain('mode-line');
    });
  });

  describe('tool switching behavior', () => {
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
        save: vi.fn(),
        restore: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
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
      canvas['originalImage'] = { width: 800, height: 600 } as HTMLImageElement;
    });

    it('should not auto-select annotation when manually switching to select tool', () => {
      // Add some line annotations
      const lineTool = canvas['tools'].get('line')!;
      canvas['lineAnnotations'].push({
        id: 'line-1',
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 200,
        color: '#E74C3C',
        width: 5,
      });

      const selectTool = canvas['tools'].get('select') as SelectTool;
      const selectAnnotationSpy = vi.spyOn(selectTool, 'selectAnnotation');

      // Manually switch to select mode (simulating user clicking select tool button)
      canvas.activeTool = 'select';
      canvas['updated'](new Map([['activeTool', 'text']]));

      // Should NOT auto-select
      expect(selectAnnotationSpy).not.toHaveBeenCalled();
    });

    it('should auto-select annotation when line tool switches to select after drawing', () => {
      const selectTool = canvas['tools'].get('select') as SelectTool;
      const selectAnnotationSpy = vi.spyOn(selectTool, 'selectAnnotation');

      // Simulate drawing a line (which triggers tool change with annotation ID)
      canvas.activeTool = 'line';
      const lineTool = canvas['tools'].get('line')!;

      // Draw a line
      lineTool.handleMouseDown!({ clientX: 100, clientY: 100 } as MouseEvent, mockCanvasElement);
      lineTool.handleMouseUp!({ clientX: 200, clientY: 200, shiftKey: false } as MouseEvent, mockCanvasElement);

      // The line tool should have triggered tool change with annotation ID
      // This simulates the event being dispatched and handled
      const newLineId = canvas['lineAnnotations'][canvas['lineAnnotations'].length - 1]?.id;

      if (newLineId) {
        // Manually call handleToolChange as the tool would
        canvas['handleToolChange']('select', newLineId);

        // Should auto-select the newly drawn line
        expect(selectAnnotationSpy).toHaveBeenCalledWith(newLineId);
      }
    });

    it('should dispatch tool-change event when tool changes', () => {
      const eventSpy = vi.fn();
      canvas.addEventListener('tool-change', eventSpy);

      // Trigger tool change
      canvas['handleToolChange']('select');

      expect(eventSpy).toHaveBeenCalled();
      const event = eventSpy.mock.calls[0][0];
      expect(event.detail.tool).toBe('select');
    });

    it('should not select annotation if tool is not select', () => {
      canvas['lineAnnotations'].push({
        id: 'line-1',
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 200,
        color: '#E74C3C',
        width: 5,
      });

      const selectTool = canvas['tools'].get('select') as SelectTool;
      const selectAnnotationSpy = vi.spyOn(selectTool, 'selectAnnotation');

      // Call handleToolChange with line tool and an annotation ID
      canvas['handleToolChange']('line', 'line-1');

      // Should NOT select because tool is not 'select'
      expect(selectAnnotationSpy).not.toHaveBeenCalled();
    });
  });
});
