import { ITool } from './base-tool';
import type { LineAnnotation } from '../types';
import { toolStyles } from './tool-styles';

export class LineTool implements ITool {
  private lineAnnotations: LineAnnotation[] = [];
  private isDrawing: boolean = false;
  private startPoint: { x: number; y: number } | null = null;
  private readonly color: string = toolStyles.color;
  private readonly lineWidth: number = toolStyles.lineWidth;
  private onRedraw: () => void;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(onRedraw: () => void) {
    this.onRedraw = onRedraw;
  }

  handleMouseDown(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    this.isDrawing = true;
    this.startPoint = { x, y };

    // Add keyboard listener for Escape key
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

    // If Shift is pressed, constrain to horizontal or vertical
    if (event.shiftKey) {
      const dx = Math.abs(x - this.startPoint.x);
      const dy = Math.abs(y - this.startPoint.y);

      // Snap to the direction with more movement
      if (dx > dy) {
        // Horizontal line
        y = this.startPoint.y;
      } else {
        // Vertical line
        x = this.startPoint.x;
      }
    }

    // Redraw with preview line
    this.onRedraw();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.startPoint.x, this.startPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  handleMouseUp(event: MouseEvent, canvas: HTMLCanvasElement): void {
    if (!this.isDrawing || !this.startPoint) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = (event.clientX - rect.left) * scaleX;
    let y = (event.clientY - rect.top) * scaleY;

    // If Shift is pressed, constrain to horizontal or vertical
    if (event.shiftKey) {
      const dx = Math.abs(x - this.startPoint.x);
      const dy = Math.abs(y - this.startPoint.y);

      // Snap to the direction with more movement
      if (dx > dy) {
        // Horizontal line
        y = this.startPoint.y;
      } else {
        // Vertical line
        x = this.startPoint.x;
      }
    }

    // Add the line annotation
    this.lineAnnotations = [
      ...this.lineAnnotations,
      {
        x1: this.startPoint.x,
        y1: this.startPoint.y,
        x2: x,
        y2: y,
        color: this.color,
        width: this.lineWidth,
      },
    ];

    this.cleanupDrawingState();
    this.onRedraw();
  }

  private cancelDrawing(): void {
    if (!this.isDrawing) return;

    this.cleanupDrawingState();
    this.onRedraw();
  }

  private cleanupDrawingState(): void {
    this.isDrawing = false;
    this.startPoint = null;

    // Remove keyboard listener
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.lineAnnotations.forEach((line) => {
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();
    });
  }
}
