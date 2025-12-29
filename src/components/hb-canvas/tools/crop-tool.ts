import type { Tool } from '../../../interfaces/tool.interface';
import { toolStyles } from './tool-styles';
import { renderHandle } from '../../../utils/render-handle';

export class CropTool implements Tool {
  private cropRect: { x: number; y: number; width: number; height: number } | null = null;
  private isDrawing: boolean = false;
  private startPoint: { x: number; y: number } | null = null;
  private readonly color: string = toolStyles.color;
  private onRedraw: () => void;
  private onToolChange?: (tool: string) => void;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(onRedraw: () => void, onToolChange?: (tool: string) => void) {
    this.onRedraw = onRedraw;
    this.onToolChange = onToolChange;
  }

  handleMouseDown(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    this.isDrawing = true;
    this.startPoint = { x, y };
    this.cropRect = null;

    // Add keyboard listener for Escape key
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.cancelCrop();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
  }

  handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing || !this.startPoint) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = (event.clientX - rect.left) * scaleX;
    let y = (event.clientY - rect.top) * scaleY;

    // Apply shift-key constraint for square crop
    if (event.shiftKey) {
      const dx = Math.abs(x - this.startPoint.x);
      const dy = Math.abs(y - this.startPoint.y);
      const size = Math.min(dx, dy);

      x = this.startPoint.x + (x > this.startPoint.x ? size : -size);
      y = this.startPoint.y + (y > this.startPoint.y ? size : -size);
    }

    // Calculate rectangle position and dimensions
    const rectX = Math.min(this.startPoint.x, x);
    const rectY = Math.min(this.startPoint.y, y);
    const rectWidth = Math.abs(x - this.startPoint.x);
    const rectHeight = Math.abs(y - this.startPoint.y);

    this.cropRect = { x: rectX, y: rectY, width: rectWidth, height: rectHeight };

    // Redraw will render all tools including this one
    this.onRedraw();
  }

  handleMouseUp(event: MouseEvent, canvas: HTMLCanvasElement): void {
    if (!this.isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = (event.clientX - rect.left) * scaleX;
    let y = (event.clientY - rect.top) * scaleY;

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

    // Only keep rectangle if it has some size
    if (rectWidth > 2 && rectHeight > 2) {
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

  private cancelCrop(): void {
    this.cropRect = null;
    this.isDrawing = false;
    this.startPoint = null;

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
}
