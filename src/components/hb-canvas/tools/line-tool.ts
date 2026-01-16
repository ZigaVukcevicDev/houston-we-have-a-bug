import type { Tool } from '../../../interfaces/tool.interface';
import type { LineAnnotation } from '../../../interfaces/annotation.interface';
import { toolStyles } from './tool-styles';
import { getCanvasCoordinates } from '../../../utils/get-canvas-coordinates';

export class LineTool implements Tool {
  protected lineAnnotations: LineAnnotation[];
  protected isDrawing: boolean = false;
  protected startPoint: { x: number; y: number } | null = null;
  protected readonly color: string = toolStyles.color;
  protected readonly lineWidth: number = toolStyles.lineWidth;
  protected onRedraw: () => void;
  protected onToolChange?: (tool: string, annotationId?: string) => void;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(lineAnnotations: LineAnnotation[], onRedraw: () => void, onToolChange?: (tool: string, annotationId?: string) => void) {
    this.lineAnnotations = lineAnnotations;
    this.onRedraw = onRedraw;
    this.onToolChange = onToolChange;
  }

  handleMouseDown(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const { x, y } = getCanvasCoordinates(event, canvas);

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

    let { x, y } = getCanvasCoordinates(event, canvas);

    // If Shift is pressed, constrain to horizontal or vertical
    if (event.shiftKey) {
      ({ x, y } = this.applyLineConstraint(x, y, this.startPoint));
    }

    // Redraw with preview line
    this.onRedraw();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth * (window.devicePixelRatio || 1);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.startPoint.x, this.startPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  handleMouseUp(event: MouseEvent, canvas: HTMLCanvasElement): void {
    // Handle finishing new line drawing
    if (!this.isDrawing || !this.startPoint) return;

    let { x, y } = getCanvasCoordinates(event, canvas);

    // If Shift is pressed, constrain to horizontal or vertical
    if (event.shiftKey) {
      ({ x, y } = this.applyLineConstraint(x, y, this.startPoint));
    }

    // Check if line is too short (prevent zero-length lines from single clicks)
    const lineLength = Math.sqrt((x - this.startPoint.x) ** 2 + (y - this.startPoint.y) ** 2);
    if (lineLength < 2) {
      // Too short, don't create line
      this.cleanupDrawingState();
      this.onRedraw();
      return;
    }

    // Add the line annotation (use push to maintain array reference)
    this.lineAnnotations.push({
      id: crypto.randomUUID(),
      x1: this.startPoint.x,
      y1: this.startPoint.y,
      x2: x,
      y2: y,
      color: this.color,
      width: this.lineWidth,
    });

    // Don't auto-select - handles will only show during drawing or manual selection
    this.cleanupDrawingState();
    this.onRedraw();

    // Switch to select tool after drawing and select the newly created line
    const newLineId = this.lineAnnotations[this.lineAnnotations.length - 1].id;
    this.onToolChange?.('select', newLineId);
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

  protected applyLineConstraint(
    x: number,
    y: number,
    startPoint: { x: number; y: number }
  ): { x: number; y: number } {
    const dx = Math.abs(x - startPoint.x);
    const dy = Math.abs(y - startPoint.y);

    if (dx > dy) {
      // Horizontal line
      return { x, y: startPoint.y };
    } else {
      // Vertical line
      return { x: startPoint.x, y };
    }
  }

  deactivate(): void {
    this.cancelDrawing();
  }



  render(ctx: CanvasRenderingContext2D): void {
    const dpr = window.devicePixelRatio || 1;
    this.lineAnnotations.forEach((line) => {
      ctx.save();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width * dpr;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();
      ctx.restore();
    });
  }
}
