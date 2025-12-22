import type { Tool } from '../../../interfaces/tool.interface';
import type { LineAnnotation } from '../../../interfaces/annotation.interface';
import { toolStyles } from './tool-styles';

export class LineTool implements Tool {
  private lineAnnotations: LineAnnotation[];
  private isDrawing: boolean = false;
  private startPoint: { x: number; y: number } | null = null;
  private readonly color: string = toolStyles.color;
  private readonly lineWidth: number = toolStyles.lineWidth;
  private onRedraw: () => void;
  private onToolChange?: (tool: string) => void;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(lineAnnotations: LineAnnotation[], onRedraw: () => void, onToolChange?: (tool: string) => void) {
    this.lineAnnotations = lineAnnotations;
    this.onRedraw = onRedraw;
    this.onToolChange = onToolChange;
  }


  handleMouseDown(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Start drawing new line
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
    // Handle finishing new line drawing
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

    // Check if line is too short (prevent zero-length lines from single clicks)
    const lineLength = Math.sqrt((x - this.startPoint.x) ** 2 + (y - this.startPoint.y) ** 2);
    if (lineLength < 2) {
      // Too short, don't create line
      this.cleanupDrawingState();
      this.onRedraw();
      return;
    }

    // Add the line annotation
    this.lineAnnotations = [
      ...this.lineAnnotations,
      {
        id: crypto.randomUUID(),
        x1: this.startPoint.x,
        y1: this.startPoint.y,
        x2: x,
        y2: y,
        color: this.color,
        width: this.lineWidth,
      },
    ];

    // Don't auto-select - handles will only show during drawing or manual selection
    this.cleanupDrawingState();
    this.onRedraw();

    // Switch to select tool after drawing
    this.onToolChange?.('select');
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
      ctx.save();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();
      ctx.restore();
    });
  }
}
