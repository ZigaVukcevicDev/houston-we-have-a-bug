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
  }

  handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing || !this.startPoint) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

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
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

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

    this.isDrawing = false;
    this.startPoint = null;
    this.onRedraw();
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
