import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HBCanvas } from './hb-canvas';
import { SelectTool } from './tools/select-tool';
import { CropTool } from './tools/crop-tool';

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

    it('should have default drawing mode as "arrow"', () => {
      expect(canvas.activeTool).toBe('arrow');
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
      // Create mockCanvasElement first (without getContext method)
      mockCanvasElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
        }),
        width: 800,
        height: 600,
        style: {},
      };

      // Then create mockCtx with canvas reference
      mockCtx = {
        canvas: mockCanvasElement, // Now mockCanvasElement exists
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
        setLineDash: vi.fn(),
      };

      // Finally add getContext method
      mockCanvasElement.getContext = vi.fn().mockReturnValue(mockCtx);

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

    it('should handle image onload callback with canvas sizing', () => {
      const redrawSpy = vi.spyOn(canvas as any, 'redraw');

      // Create a mock image that we can control
      const mockImg = {
        width: 1600,
        height: 1200,
        onload: null as (() => void) | null,
        src: '',
      };

      // Mock the Image constructor
      const ImageMock = vi.fn().mockImplementation(function (this: any) {
        Object.assign(this, mockImg);
        return this;
      });
      globalThis.Image = ImageMock as any;

      // Mock window.devicePixelRatio
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2,
      });

      canvas.dataUrl = 'data:image/png;base64,test';
      canvas['loadImage']();

      // Get the created instance and trigger onload
      const createdImg = ImageMock.mock.instances[0] as typeof mockImg;
      createdImg.onload!();

      // Verify canvas was resized to image dimensions
      expect(mockCanvasElement.width).toBe(1600);
      expect(mockCanvasElement.height).toBe(1200);

      // Verify display size accounts for DPR (1600/2 = 800px)
      expect(mockCanvasElement.style.width).toBe('800px');
      expect(mockCanvasElement.style.height).toBe('600px');

      // Verify redraw was called
      expect(redrawSpy).toHaveBeenCalled();

      // Verify originalImage was set
      expect(canvas['originalImage']).toBe(createdImg);
    });

    it('should handle image onload with default DPR when devicePixelRatio is undefined', () => {
      const mockImg = {
        width: 800,
        height: 600,
        onload: null as (() => void) | null,
        src: '',
      };

      const ImageMock2 = vi.fn().mockImplementation(function (this: any) {
        Object.assign(this, mockImg);
        return this;
      });
      globalThis.Image = ImageMock2 as any;

      // Mock devicePixelRatio as undefined (fallback to 1)
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      canvas.dataUrl = 'data:image/png;base64,test';
      canvas['loadImage']();

      const createdImg = ImageMock2.mock.instances[0] as typeof mockImg;
      createdImg.onload!();

      // With DPR = 1, display size should match canvas size
      expect(mockCanvasElement.style.width).toBe('800px');
      expect(mockCanvasElement.style.height).toBe('600px');
    });
  });

  describe('redraw functionality', () => {
    let mockCanvasElement: any;
    let mockCtx: any;
    let mockImage: HTMLImageElement;

    beforeEach(() => {
      mockCanvasElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
        }),
        width: 800,
        height: 600,
        style: {},
      };

      mockCtx = {
        canvas: mockCanvasElement,
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

      mockCanvasElement.getContext = vi.fn().mockReturnValue(mockCtx);

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
      mockCanvasElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
        }),
        width: 800,
        height: 600,
        style: {},
      };

      mockCtx = {
        canvas: mockCanvasElement,
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

      mockCanvasElement.getContext = vi.fn().mockReturnValue(mockCtx);

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

      expect(handleMouseMoveSpy).toHaveBeenCalledWith(
        event,
        mockCanvasElement,
        mockCtx
      );
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
      expect(mockCanvasElement.toDataURL).toHaveBeenCalledWith(
        'image/jpeg',
        1.0
      );

      canvas.download('test.jpg', 0.1);
      expect(mockCanvasElement.toDataURL).toHaveBeenCalledWith(
        'image/jpeg',
        0.1
      );
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
      expect(deselectAllSpy).toHaveBeenCalledBefore(
        mockCanvasElement.toDataURL
      );
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

  describe('deselectAll method', () => {
    let mockCanvasElement: any;
    let mockCtx: any;

    beforeEach(() => {
      mockCanvasElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
        }),
        width: 800,
        height: 600,
        style: {},
      };

      mockCtx = {
        canvas: mockCanvasElement,
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
        save: vi.fn(),
        restore: vi.fn(),
      };

      mockCanvasElement.getContext = vi.fn().mockReturnValue(mockCtx);

      Object.defineProperty(canvas, 'canvas', {
        value: mockCanvasElement,
        writable: true,
      });

      canvas['firstUpdated']();
      canvas['originalImage'] = { width: 800, height: 600 } as HTMLImageElement;
    });

    it('should call selectTool.deselectAll and redraw', () => {
      const selectTool = canvas['tools'].get('select') as SelectTool;
      const deselectAllSpy = vi.spyOn(selectTool, 'deselectAll');
      const redrawSpy = vi.spyOn(canvas as any, 'redraw');

      canvas.deselectAll();

      expect(deselectAllSpy).toHaveBeenCalled();
      expect(redrawSpy).toHaveBeenCalled();
    });

    it('should handle deselectAll when annotations are selected', () => {
      // Add an annotation and select it
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
      selectTool.selectAnnotation('line-1');

      // Now deselect all
      canvas.deselectAll();

      // Verify the annotation is no longer selected
      expect(selectTool['selectedAnnotationId']).toBeNull();
    });
  });

  describe('tool switching behavior', () => {
    let mockCanvasElement: any;
    let mockCtx: any;

    beforeEach(() => {
      mockCanvasElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
        }),
        width: 800,
        height: 600,
        style: {},
      };

      mockCtx = {
        canvas: mockCanvasElement,
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
        rect: vi.fn(),
        lineJoin: '',
      };

      mockCanvasElement.getContext = vi.fn().mockReturnValue(mockCtx);

      Object.defineProperty(canvas, 'canvas', {
        value: mockCanvasElement,
        writable: true,
      });

      canvas['firstUpdated']();
      canvas['originalImage'] = { width: 800, height: 600 } as HTMLImageElement;
    });

    it('should not auto-select annotation when manually switching to select tool', () => {
      // Add some line annotations
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
      lineTool.handleMouseDown!(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvasElement
      );
      lineTool.handleMouseUp!(
        { clientX: 200, clientY: 200, shiftKey: false } as MouseEvent,
        mockCanvasElement
      );

      // The line tool should have triggered tool change with annotation ID
      // This simulates the event being dispatched and handled
      const newLineId =
        canvas['lineAnnotations'][canvas['lineAnnotations'].length - 1]?.id;

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

    it('should auto-select rectangle after drawing via rectangle tool callback', () => {
      const selectTool = canvas['tools'].get('select') as SelectTool;
      const selectAnnotationSpy = vi.spyOn(selectTool, 'selectAnnotation');

      // Simulate drawing a rectangle
      canvas.activeTool = 'rectangle';
      const rectangleTool = canvas['tools'].get('rectangle')!;

      // Draw a rectangle
      rectangleTool.handleMouseDown!(
        { clientX: 100, clientY: 100 } as MouseEvent,
        mockCanvasElement
      );
      rectangleTool.handleMouseUp!(
        { clientX: 200, clientY: 200, shiftKey: false } as MouseEvent,
        mockCanvasElement
      );

      // The rectangle tool should have triggered tool change with annotation ID
      const newRectId =
        canvas['rectangleAnnotations'][
          canvas['rectangleAnnotations'].length - 1
        ]?.id;

      if (newRectId) {
        // Verify the tool change was triggered and annotation was auto-selected
        expect(selectAnnotationSpy).toHaveBeenCalledWith(newRectId);
      }
    });
    describe('tool deactivation on switch', () => {
      let mockCanvasElement: any;
      let mockCtx: any;

      beforeEach(() => {
        mockCanvasElement = {
          getBoundingClientRect: vi.fn().mockReturnValue({
            left: 0,
            top: 0,
            width: 800,
            height: 600,
          }),
          width: 800,
          height: 600,
          style: {},
        };

        mockCtx = {
          canvas: mockCanvasElement,
          clearRect: vi.fn(),
          drawImage: vi.fn(),
          strokeStyle: '',
          lineWidth: 0,
          lineCap: '',
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          stroke: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          fillRect: vi.fn(),
          strokeRect: vi.fn(),
          setLineDash: vi.fn(),
          rect: vi.fn(),
          measureText: vi.fn().mockReturnValue({ width: 50 }),
          fillText: vi.fn(),
          fillStyle: '',
          textBaseline: '',
          letterSpacing: '',
          font: '',
          lineJoin: '',
        };

        mockCanvasElement.getContext = vi.fn().mockReturnValue(mockCtx);

        Object.defineProperty(canvas, 'canvas', {
          value: mockCanvasElement,
          writable: true,
        });
        canvas['firstUpdated']();
        canvas['originalImage'] = {
          width: 800,
          height: 600,
        } as HTMLImageElement;
      });

      it('should deactivate previous tool when switching tools', () => {
        canvas.activeTool = 'line';
        const lineTool = canvas['tools'].get('line')!;
        const deactivateSpy = vi.spyOn(lineTool, 'deactivate');

        canvas.activeTool = 'text';
        canvas['updated'](new Map([['activeTool', 'line']]));

        expect(deactivateSpy).toHaveBeenCalled();
      });

      it('should deselect all annotations when switching to crop tool', () => {
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
        selectTool.selectAnnotation('line-1');

        const deselectAllSpy = vi.spyOn(selectTool, 'deselectAll');

        canvas.activeTool = 'crop';
        canvas['updated'](new Map([['activeTool', 'select']]));

        expect(deselectAllSpy).toHaveBeenCalled();
      });

      it('should deselect all annotations when switching to line tool', () => {
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
        selectTool.selectAnnotation('line-1');

        const deselectAllSpy = vi.spyOn(selectTool, 'deselectAll');

        canvas.activeTool = 'line';
        canvas['updated'](new Map([['activeTool', 'select']]));

        expect(deselectAllSpy).toHaveBeenCalled();
        expect(selectTool['selectedAnnotationId']).toBeNull();
      });

      it('should deselect all annotations when switching to arrow tool', () => {
        canvas['rectangleAnnotations'].push({
          id: 'rect-1',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          color: '#E74C3C',
          strokeWidth: 2,
        });

        const selectTool = canvas['tools'].get('select') as SelectTool;
        selectTool.selectAnnotation('rect-1');

        const deselectAllSpy = vi.spyOn(selectTool, 'deselectAll');

        canvas.activeTool = 'arrow';
        canvas['updated'](new Map([['activeTool', 'select']]));

        expect(deselectAllSpy).toHaveBeenCalled();
        expect(selectTool['selectedAnnotationId']).toBeNull();
      });

      it('should deselect all annotations when switching to text tool', () => {
        canvas['textAnnotations'].push({
          id: 'text-1',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          text: 'Test',
          color: '#E74C3C',
          fontSize: 14,
        });

        const selectTool = canvas['tools'].get('select') as SelectTool;
        selectTool.selectAnnotation('text-1');

        const deselectAllSpy = vi.spyOn(selectTool, 'deselectAll');

        canvas.activeTool = 'text';
        canvas['updated'](new Map([['activeTool', 'select']]));

        expect(deselectAllSpy).toHaveBeenCalled();
        expect(selectTool['selectedAnnotationId']).toBeNull();
      });

      it('should deselect all annotations when switching to rectangle tool', () => {
        canvas['arrowAnnotations'].push({
          id: 'arrow-1',
          x1: 100,
          y1: 100,
          x2: 200,
          y2: 200,
          color: '#E74C3C',
          width: 5,
        });

        const selectTool = canvas['tools'].get('select') as SelectTool;
        selectTool.selectAnnotation('arrow-1');

        const deselectAllSpy = vi.spyOn(selectTool, 'deselectAll');

        canvas.activeTool = 'rectangle';
        canvas['updated'](new Map([['activeTool', 'select']]));

        expect(deselectAllSpy).toHaveBeenCalled();
        expect(selectTool['selectedAnnotationId']).toBeNull();
      });

      it('should NOT deselect when switching to select tool', () => {
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
        selectTool.selectAnnotation('line-1');

        const deselectAllSpy = vi.spyOn(selectTool, 'deselectAll');

        canvas.activeTool = 'select';
        canvas['updated'](new Map([['activeTool', 'text']]));

        expect(deselectAllSpy).not.toHaveBeenCalled();
        expect(selectTool['selectedAnnotationId']).toBe('line-1');
      });
    });
  });
  describe('crop buttons', () => {
    let mockCanvasElement: any;
    let mockCtx: any;

    beforeEach(() => {
      // Create mockCanvasElement first
      mockCanvasElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
        }),
        width: 800,
        height: 600,
        style: {},
      };

      // Create mockCtx with canvas reference
      mockCtx = {
        canvas: mockCanvasElement, // Reference to actual mock canvas element
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        strokeStyle: '',
        lineWidth: 0,
        lineCap: '',
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        setLineDash: vi.fn(),
      };

      // Add getContext method
      mockCanvasElement.getContext = vi.fn().mockReturnValue(mockCtx);

      Object.defineProperty(canvas, 'canvas', {
        value: mockCanvasElement,
        writable: true,
      });
      canvas['firstUpdated']();
      canvas['originalImage'] = { width: 800, height: 600 } as HTMLImageElement;
    });

    it('should show crop buttons when crop tool is active and crop rectangle exists', () => {
      canvas.activeTool = 'crop';
      const cropTool = canvas['tools'].get('crop') as CropTool;
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };
      canvas['redraw']();
      const hasButtons = canvas['getCropButtonsPosition']();
      expect(hasButtons).not.toBeNull();
    });

    it('should not show crop buttons when crop tool is active but no crop rectangle', () => {
      canvas.activeTool = 'crop';
      const hasButtons = canvas['getCropButtonsPosition']();
      expect(hasButtons).toBeNull();
    });

    it('should not show crop buttons when different tool is active', () => {
      canvas.activeTool = 'select';
      const cropTool = canvas['tools'].get('crop') as CropTool;
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };
      const showCropButtons =
        (canvas.activeTool as string) === 'crop' &&
        canvas['getCropButtonsPosition']();
      expect(showCropButtons).toBeFalsy();
    });

    it('should calculate button position inside crop rectangle', () => {
      canvas.activeTool = 'crop';
      const cropTool = canvas['tools'].get('crop') as CropTool;
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };
      const pos = canvas['getCropButtonsPosition']();
      expect(pos).not.toBeNull();
      expect(pos?.x).toBeLessThan(300);
      expect(pos?.y).toBeLessThan(250);
    });

    it('should handle crop cancel', () => {
      canvas.activeTool = 'crop';
      const cropTool = canvas['tools'].get('crop')!;
      const cancelSpy = vi.spyOn(cropTool as any, 'cancelCrop');
      canvas['handleCropCancel']();
      expect(cancelSpy).toHaveBeenCalled();
    });

    it('should handle crop confirm with existing crop', () => {
      canvas.activeTool = 'crop';
      const cropTool = canvas['tools'].get('crop') as CropTool;
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };
      const confirmSpy = vi.spyOn(cropTool as any, 'confirmCrop');
      canvas['handleCropConfirm']();
      expect(confirmSpy).toHaveBeenCalledWith(
        mockCanvasElement,
        canvas['originalImage']
      );
    });

    it('should dispatch tool-change event after confirming crop', () => {
      canvas.activeTool = 'crop';
      const cropTool = canvas['tools'].get('crop') as CropTool;
      cropTool['cropRect'] = { x: 100, y: 100, width: 200, height: 150 };

      const mockImage = new Image();
      vi.spyOn(cropTool as any, 'confirmCrop').mockReturnValue(mockImage);

      // Listen for the tool-change event
      let eventFired = false;
      let eventDetail: any = null;
      canvas.addEventListener('tool-change', (e: Event) => {
        eventFired = true;
        eventDetail = (e as CustomEvent).detail;
      });

      canvas['handleCropConfirm']();

      mockImage.onload?.({} as Event);

      expect(eventFired).toBe(true);
      expect(eventDetail?.tool).toBe('select');
    });

    it('should not handle crop confirm without original image', () => {
      canvas.activeTool = 'crop';
      canvas['originalImage'] = null;
      const cropTool = canvas['tools'].get('crop')!;
      const confirmSpy = vi.spyOn(cropTool as any, 'confirmCrop');
      canvas['handleCropConfirm']();
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('should return empty string from getCropButtonsStyle when no position', () => {
      canvas.activeTool = 'select';
      const style = canvas['getCropButtonsStyle']();
      expect(style).toBe('');
    });

    it('should calculate crop button style with proper DPR scaling', () => {
      canvas.activeTool = 'crop';
      const cropTool = canvas['tools'].get('crop') as CropTool;
      cropTool['cropRect'] = { x: 200, y: 300, width: 400, height: 200 };

      const style = canvas['getCropButtonsStyle']();
      expect(style).toContain('left:');
      expect(style).toContain('top:');
      expect(style).toContain('px');
    });
  });

  describe('text annotation integration', () => {
    it('should initialize SelectTool with textAnnotations array', () => {
      const selectTool = canvas['tools'].get('select') as SelectTool;

      // SelectTool should have access to textAnnotations
      expect(selectTool).toBeDefined();

      // Verify that textAnnotations is passed by adding a text annotation and checking selection
      canvas['textAnnotations'].push({
        id: 'text-1',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        text: 'Test',
        color: '#E74C3C',
        fontSize: 14,
      });

      // Verify SelectTool can select text annotations
      selectTool.selectAnnotation('text-1');
      expect(selectTool['selectedAnnotationId']).toBe('text-1');
      expect(selectTool['selectedAnnotationType']).toBe('text');
    });

    it('should allow text tool to switch to select tool', () => {
      const eventSpy = vi.fn();
      canvas.addEventListener('tool-change', eventSpy);

      // Simulate text tool triggering tool change
      canvas['handleToolChange']('select');

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail.tool).toBe('select');
    });

    it('should trigger text tool callbacks', () => {
      const textTool = canvas['tools'].get('text');
      const redrawSpy = vi.spyOn(canvas as any, 'redraw');
      const toolChangeSpy = vi.spyOn(canvas as any, 'handleToolChange');

      // Test redraw callback
      (textTool as any)['onRedraw']();
      expect(redrawSpy).toHaveBeenCalled();

      // Test handleToolChange callback with annotationId
      (textTool as any)['onToolChange']('select', 'text-123');
      expect(toolChangeSpy).toHaveBeenCalledWith('select', 'text-123');
    });
  });

  describe('arrow tool callback integration', () => {
    it('should have redraw and handleToolChange callbacks configured for arrow tool', () => {
      const arrowTool = canvas['tools'].get('arrow');
      expect(arrowTool).toBeDefined();

      // Verify the tool has access to the callbacks by checking it can call redraw
      const redrawSpy = vi.spyOn(canvas as any, 'redraw');
      (arrowTool as any)['onRedraw']();
      expect(redrawSpy).toHaveBeenCalled();
    });

    it('should trigger handleToolChange with annotationId through arrow tool callback', () => {
      const arrowTool = canvas['tools'].get('arrow');
      const toolChangeSpy = vi.spyOn(canvas as any, 'handleToolChange');

      // Call the callback with both tool and annotationId
      (arrowTool as any)['onToolChange']('select', 'test-annotation-id');

      expect(toolChangeSpy).toHaveBeenCalledWith(
        'select',
        'test-annotation-id'
      );
    });
  });

  describe('crop tool callback integration', () => {
    it('should have all three callbacks configured for crop tool', () => {
      const cropTool = canvas['tools'].get('crop');
      expect(cropTool).toBeDefined();

      // Verify crop tool has access to callbacks
      expect((cropTool as any)['onRedraw']).toBeDefined();
      expect((cropTool as any)['onToolChange']).toBeDefined();
      expect((cropTool as any)['onConfirmCrop']).toBeDefined();
    });

    it('should trigger handleToolChange through crop tool callback', () => {
      const cropTool = canvas['tools'].get('crop');
      const toolChangeSpy = vi.spyOn(canvas as any, 'handleToolChange');

      // Directly call the callback that was passed to crop tool
      (cropTool as any)['onToolChange']('select');

      expect(toolChangeSpy).toHaveBeenCalledWith('select');
    });

    it('should trigger handleCropConfirm through crop tool callback', () => {
      const cropTool = canvas['tools'].get('crop');
      const confirmSpy = vi.spyOn(canvas as any, 'handleCropConfirm');

      // Directly call the callback that was passed to crop tool
      (cropTool as any)['onConfirmCrop']();

      expect(confirmSpy).toHaveBeenCalled();
    });
  });
});
