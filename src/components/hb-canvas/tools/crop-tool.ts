import type { Tool } from '../../../interfaces/tool.interface';
import type { HandleType } from '../../../types/handle-type.type';
import { toolStyles } from './tool-styles';
import { renderHandle, handleSize, handleHitThreshold } from '../../../utils/render-handle';
import { getCanvasCoordinates } from '../../../utils/get-canvas-coordinates';

export class CropTool implements Tool {
  private cropRect: { x: number; y: number; width: number; height: number } | null = null;
  private isDrawing: boolean = false;
  private startPoint: { x: number; y: number } | null = null;
  private readonly color: string = toolStyles.color;
  private onRedraw: () => void;
  private onToolChange?: (tool: string) => void;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;
  private draggedHandle: HandleType | null = null;
  private dragStartPoint: { x: number; y: number } | null = null;
  private originalCropRect: { x: number; y: number; width: number; height: number } | null = null;
  private isDraggingCrop: boolean = false;

  constructor(onRedraw: () => void, onToolChange?: (tool: string) => void) {
    this.onRedraw = onRedraw;
    this.onToolChange = onToolChange;
  }

  handleMouseDown(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const { x, y } = getCanvasCoordinates(event, canvas);

    // Check if clicking on an existing handle
    const handle = this.getHandleAtPoint(x, y);

    if (handle && this.cropRect) {
      // Start dragging a handle
      this.draggedHandle = handle;
      this.dragStartPoint = { x, y };
      this.originalCropRect = { ...this.cropRect };
      this.isDrawing = false;
      this.isDraggingCrop = false;
    } else if (this.cropRect && this.isPointInCropRect(x, y)) {
      // Start dragging the entire crop rectangle
      this.isDraggingCrop = true;
      this.dragStartPoint = { x, y };
      this.originalCropRect = { ...this.cropRect };
      this.isDrawing = false;
      this.draggedHandle = null;
    } else {
      // Start drawing a new crop rectangle
      this.isDrawing = true;
      this.startPoint = { x, y };
      this.cropRect = null;
      this.draggedHandle = null;
      this.isDraggingCrop = false;
    }

    // Add keyboard listener for Escape key
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.cancelCrop();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
  }

  handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    const { x, y } = getCanvasCoordinates(event, canvas);

    // Handle dragging logic
    if (this.draggedHandle && this.dragStartPoint && this.originalCropRect) {
      this.resizeCropRect(this.draggedHandle, x, y);
      this.onRedraw();
      return;
    }

    // Crop rectangle dragging logic
    if (this.isDraggingCrop && this.dragStartPoint && this.originalCropRect) {
      const dx = x - this.dragStartPoint.x;
      const dy = y - this.dragStartPoint.y;
      this.cropRect = {
        x: this.originalCropRect.x + dx,
        y: this.originalCropRect.y + dy,
        width: this.originalCropRect.width,
        height: this.originalCropRect.height,
      };
      this.onRedraw();
      return;
    }

    // Handle hovering - update cursor
    if (!this.isDrawing && this.cropRect) {
      const handle = this.getHandleAtPoint(x, y);
      if (handle) {
        canvas.style.cursor = this.getCursorForHandle(handle);
      } else if (this.isPointInCropRect(x, y)) {
        canvas.style.cursor = 'move';
      } else {
        canvas.style.cursor = 'crosshair';
      }
      return;
    }

    // Original drawing logic
    if (!this.isDrawing || !this.startPoint) return;

    let currentX = x;
    let currentY = y;

    // Apply shift-key constraint for square crop
    if (event.shiftKey) {
      const dx = Math.abs(currentX - this.startPoint.x);
      const dy = Math.abs(currentY - this.startPoint.y);
      const size = Math.min(dx, dy);

      currentX = this.startPoint.x + (currentX > this.startPoint.x ? size : -size);
      currentY = this.startPoint.y + (currentY > this.startPoint.y ? size : -size);
    }

    // Calculate rectangle position and dimensions
    const rectX = Math.min(this.startPoint.x, currentX);
    const rectY = Math.min(this.startPoint.y, currentY);
    const rectWidth = Math.abs(currentX - this.startPoint.x);
    const rectHeight = Math.abs(currentY - this.startPoint.y);

    this.cropRect = { x: rectX, y: rectY, width: rectWidth, height: rectHeight };

    // Redraw will render all tools including this one
    this.onRedraw();
  }

  handleMouseUp(event: MouseEvent, canvas: HTMLCanvasElement): void {
    // If dragging a handle, finalize it
    if (this.draggedHandle) {
      this.draggedHandle = null;
      this.dragStartPoint = null;
      this.originalCropRect = null;
      this.onRedraw();
      return;
    }

    // If dragging entire crop, finalize it
    if (this.isDraggingCrop) {
      this.isDraggingCrop = false;
      this.dragStartPoint = null;
      this.originalCropRect = null;
      this.onRedraw();
      return;
    }

    // Original drawing logic
    if (!this.isDrawing) return;

    let { x, y } = getCanvasCoordinates(event, canvas);

    if (!this.startPoint) return;

    // Apply shift-key constraint for square crop
    if (event.shiftKey) {
      const dx = Math.abs(x - this.startPoint.x);
      const dy = Math.abs(y - this.startPoint.y);
      const size = Math.min(dx, dy);

      x = this.startPoint.x + (x > this.startPoint.x ? size : -size);
      y = this.startPoint.y + (y > this.startPoint.y ? size : -size);
    }

    // Calculate final rectangle
    const rectX = Math.min(this.startPoint.x, x);
    const rectY = Math.min(this.startPoint.y, y);
    const rectWidth = Math.abs(x - this.startPoint.x);
    const rectHeight = Math.abs(y - this.startPoint.y);

    const minWidth = 56;
    const minHeight = 29;
    if (rectWidth > minWidth && rectHeight > minHeight) {
      this.cropRect = { x: rectX, y: rectY, width: rectWidth, height: rectHeight };
    } else {
      this.cropRect = null;
    }

    this.isDrawing = false;
    this.startPoint = null;
    this.onRedraw();
  }

  handleClick(event: MouseEvent, canvas: HTMLCanvasElement): void {
    // Crop tool uses drag interaction, no click handling needed
  }

  private resizeCropRect(handle: HandleType, x: number, y: number): void {
    if (!this.originalCropRect || !this.dragStartPoint) return;

    const orig = this.originalCropRect;
    const dx = x - this.dragStartPoint.x;
    const dy = y - this.dragStartPoint.y;

    let newX = orig.x;
    let newY = orig.y;
    let newWidth = orig.width;
    let newHeight = orig.height;

    switch (handle) {
      case 'top-left':
        newX = orig.x + dx;
        newY = orig.y + dy;
        newWidth = orig.width - dx;
        newHeight = orig.height - dy;
        break;
      case 'top-right':
        newY = orig.y + dy;
        newWidth = orig.width + dx;
        newHeight = orig.height - dy;
        break;
      case 'bottom-left':
        newX = orig.x + dx;
        newWidth = orig.width - dx;
        newHeight = orig.height + dy;
        break;
      case 'bottom-right':
        newWidth = orig.width + dx;
        newHeight = orig.height + dy;
        break;
      case 'left':
        newX = orig.x + dx;
        newWidth = orig.width - dx;
        break;
      case 'right':
        newWidth = orig.width + dx;
        break;
      case 'top':
        newY = orig.y + dy;
        newHeight = orig.height - dy;
        break;
      case 'bottom':
        newHeight = orig.height + dy;
        break;
    }

    // Ensure minimum size
    if (newWidth < 10) newWidth = 10;
    if (newHeight < 10) newHeight = 10;

    // Adjust position if width/height went negative
    if (newWidth === 10 && handle.includes('left')) {
      newX = orig.x + orig.width - 10;
    }
    if (newHeight === 10 && handle.includes('top')) {
      newY = orig.y + orig.height - 10;
    }

    this.cropRect = { x: newX, y: newY, width: newWidth, height: newHeight };
  }

  private getHandleAtPoint(x: number, y: number): HandleType | null {
    if (!this.cropRect) return null;

    const { x: cropX, y: cropY, width, height } = this.cropRect;
    const threshold = handleSize / 2 + handleHitThreshold;

    const handles: { type: HandleType; x: number; y: number }[] = [
      { type: 'top-left', x: cropX, y: cropY },
      { type: 'top-right', x: cropX + width, y: cropY },
      { type: 'bottom-left', x: cropX, y: cropY + height },
      { type: 'bottom-right', x: cropX + width, y: cropY + height },
      { type: 'top', x: cropX + width / 2, y: cropY },
      { type: 'bottom', x: cropX + width / 2, y: cropY + height },
      { type: 'left', x: cropX, y: cropY + height / 2 },
      { type: 'right', x: cropX + width, y: cropY + height / 2 },
    ];

    for (const handle of handles) {
      const dx = Math.abs(x - handle.x);
      const dy = Math.abs(y - handle.y);
      if (dx <= threshold && dy <= threshold) {
        return handle.type;
      }
    }

    return null;
  }

  private isPointInCropRect(x: number, y: number): boolean {
    if (!this.cropRect) return false;

    const { x: cropX, y: cropY, width, height } = this.cropRect;
    return (
      x >= cropX &&
      x <= cropX + width &&
      y >= cropY &&
      y <= cropY + height
    );
  }

  private getCursorForHandle(handle: HandleType): string {
    const cursorMap: Record<HandleType, string> = {
      'top-left': 'nwse-resize',
      'bottom-right': 'nwse-resize',
      'top-right': 'nesw-resize',
      'bottom-left': 'nesw-resize',
      'left': 'ew-resize',
      'right': 'ew-resize',
      'top': 'ns-resize',
      'bottom': 'ns-resize',
    };
    return cursorMap[handle];
  }

  cancelCrop(): void {
    this.cropRect = null;
    this.isDrawing = false;
    this.startPoint = null;
    this.draggedHandle = null;
    this.isDraggingCrop = false;

    // Remove keyboard listener
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }

    this.onRedraw();

    // Switch to select tool
    this.onToolChange?.('select');
  }

  deactivate(): void {
    // Clear crop rectangle when switching tools
    this.cropRect = null;
    this.isDrawing = false;
    this.startPoint = null;

    // Remove keyboard listener if exists
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }

    this.onRedraw();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.cropRect) return;

    const dpr = window.devicePixelRatio || 1;
    const { x, y, width, height } = this.cropRect;

    ctx.save();

    // Draw semi-transparent overlay outside crop area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';

    // Get canvas dimensions
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Draw overlay in 4 rectangles around the crop area
    // Top
    ctx.fillRect(0, 0, canvasWidth, y);
    // Bottom
    ctx.fillRect(0, y + height, canvasWidth, canvasHeight - (y + height));
    // Left
    ctx.fillRect(0, y, x, height);
    // Right
    ctx.fillRect(x + width, y, canvasWidth - (x + width), height);

    // Draw crop rectangle border
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(x, y, width, height);

    // Render 8 handles
    // 4 corners
    renderHandle(ctx, x, y); // Top-left
    renderHandle(ctx, x + width, y); // Top-right
    renderHandle(ctx, x, y + height); // Bottom-left
    renderHandle(ctx, x + width, y + height); // Bottom-right

    // 4 midpoints (top, bottom, left, right)
    renderHandle(ctx, x + width / 2, y); // Top-center
    renderHandle(ctx, x + width / 2, y + height); // Bottom-center
    renderHandle(ctx, x, y + height / 2); // Left-center
    renderHandle(ctx, x + width, y + height / 2); // Right-center

    ctx.restore();
  }

  getCropRect(): { x: number; y: number; width: number; height: number } | null {
    return this.cropRect;
  }

  getIsDrawing(): boolean {
    return this.isDrawing;
  }

  confirmCrop(canvas: HTMLCanvasElement, originalImage: HTMLImageElement): HTMLImageElement | null {
    if (!this.cropRect) return null;
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = this.cropRect.width;
    croppedCanvas.height = this.cropRect.height;
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return null;
    croppedCtx.drawImage(
      originalImage,
      this.cropRect.x,
      this.cropRect.y,
      this.cropRect.width,
      this.cropRect.height,
      0,
      0,
      this.cropRect.width,
      this.cropRect.height
    );
    const croppedImage = new Image();
    croppedImage.src = croppedCanvas.toDataURL();
    return croppedImage;
  }
}
