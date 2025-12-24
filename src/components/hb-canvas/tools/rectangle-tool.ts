import type { Tool } from '../../../interfaces/tool.interface';
import type { RectangleAnnotation } from '../../../interfaces/annotation.interface';
import { toolStyles } from './tool-styles';

export class RectangleTool implements Tool {
  private rectangleAnnotations: RectangleAnnotation[];
  private isDrawing: boolean = false;
  private startPoint: { x: number; y: number } | null = null;
  private readonly color: string = toolStyles.color;
  private readonly strokeWidth: number = toolStyles.lineWidth;
  private onRedraw: () => void;
  private onToolChange?: (tool: string, annotationId?: string) => void;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(rectangleAnnotations: RectangleAnnotation[], onRedraw: () => void, onToolChange?: (tool: string, annotationId?: string) => void) {
    this.rectangleAnnotations = rectangleAnnotations;
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

    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.cancelDrawing();
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

    let width = x - this.startPoint.x;
    let height = y - this.startPoint.y;

    // If Shift is pressed, constrain to square
    if (event.shiftKey) {
      const size = Math.max(Math.abs(width), Math.abs(height));
      width = width >= 0 ? size : -size;
      height = height >= 0 ? size : -size;
    }

    // Redraw with preview rectangle
    this.onRedraw();
    const dpr = window.devicePixelRatio || 1;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.strokeWidth * dpr;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.rect(this.startPoint.x, this.startPoint.y, width, height);
    ctx.stroke();
  }

  handleMouseUp(event: MouseEvent, canvas: HTMLCanvasElement): void {
    if (!this.isDrawing || !this.startPoint) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = (event.clientX - rect.left) * scaleX;
    let y = (event.clientY - rect.top) * scaleY;

    let width = x - this.startPoint.x;
    let height = y - this.startPoint.y;

    // If Shift is pressed, constrain to square
    if (event.shiftKey) {
      const size = Math.max(Math.abs(width), Math.abs(height));
      width = width >= 0 ? size : -size;
      height = height >= 0 ? size : -size;
    }

    // Normalize to ensure positive width/height
    const finalX = width >= 0 ? this.startPoint.x : this.startPoint.x + width;
    const finalY = height >= 0 ? this.startPoint.y : this.startPoint.y + height;
    const finalWidth = Math.abs(width);
    const finalHeight = Math.abs(height);

    // Only create rectangle if it has some size
    if (finalWidth > 1 && finalHeight > 1) {
      this.rectangleAnnotations.push({
        id: `rect-${Date.now()}`,
        x: finalX,
        y: finalY,
        width: finalWidth,
        height: finalHeight,
        color: this.color,
        strokeWidth: this.strokeWidth,
      });

      this.cleanupDrawingState();
      this.onRedraw();

      // Switch to select tool after drawing and select the newly created rectangle
      const newRectId = this.rectangleAnnotations[this.rectangleAnnotations.length - 1].id;
      this.onToolChange?.('select', newRectId);
    } else {
      this.cancelDrawing();
    }
  }

  activate(): void {
    // No setup needed
  }

  deactivate(): void {
    this.cancelDrawing();
  }

  private cancelDrawing(): void {
    if (!this.isDrawing) return;

    this.cleanupDrawingState();
    this.onRedraw();
  }

  private cleanupDrawingState(): void {
    this.isDrawing = false;
    this.startPoint = null;

    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const dpr = window.devicePixelRatio || 1;
    this.rectangleAnnotations.forEach((rectangle) => {
      ctx.save();
      ctx.strokeStyle = rectangle.color;
      ctx.lineWidth = rectangle.strokeWidth * dpr;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
      ctx.stroke();
      ctx.restore();
    });
  }
}
