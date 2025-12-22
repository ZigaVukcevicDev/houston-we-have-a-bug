import type { Tool } from '../../../interfaces/tool.interface';
import type { LineAnnotation } from '../../../interfaces/annotation.interface';
import { toolStyles } from './tool-styles';

const handleRadius = 8;
const lineHitThreshold = 10;

export class SelectTool implements Tool {
  private lineAnnotations: LineAnnotation[] = [];
  private selectedAnnotationId: string | null = null;
  private draggingHandle: 'start' | 'end' | null = null;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private onRedraw: () => void;

  constructor(lineAnnotations: LineAnnotation[], onRedraw: () => void) {
    this.lineAnnotations = lineAnnotations;
    this.onRedraw = onRedraw;
  }

  // Select a specific annotation by ID (for auto-selection after drawing)
  selectAnnotation(id: string): void {
    this.selectedAnnotationId = id;
    this.onRedraw();
  }

  handleClick(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Check if clicking on a line to select it (iterate backwards for most recent)
    for (let i = this.lineAnnotations.length - 1; i >= 0; i--) {
      if (this.isPointOnLine(x, y, this.lineAnnotations[i])) {
        this.selectedAnnotationId = this.lineAnnotations[i].id;
        this.onRedraw();
        return;
      }
    }

    // Click on empty space - deselect
    this.selectedAnnotationId = null;
    this.onRedraw();
  }

  handleMouseDown(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Check if clicking on a handle of selected line
    if (this.selectedAnnotationId !== null) {
      const line = this.lineAnnotations.find(l => l.id === this.selectedAnnotationId);
      if (!line) return;

      if (this.isPointOnHandle(x, y, line.x1, line.y1)) {
        this.draggingHandle = 'start';
        this.dragOffset = { x: x - line.x1, y: y - line.y1 };
        return;
      }

      if (this.isPointOnHandle(x, y, line.x2, line.y2)) {
        this.draggingHandle = 'end';
        this.dragOffset = { x: x - line.x2, y: y - line.y2 };
        return;
      }
    }
  }

  handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    if (!this.draggingHandle || this.selectedAnnotationId === null) {
      // Note: Cursor is now managed by CSS classes, not direct style manipulation
      // This prevents cursor from sticking when switching tools
      return;
    }

    // Handle dragging
    const line = this.lineAnnotations.find(l => l.id === this.selectedAnnotationId);
    if (!line) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    // Get raw mouse position first
    let x = (event.clientX - rect.left) * scaleX;
    let y = (event.clientY - rect.top) * scaleY;

    // Apply shift-key constraint for straight lines
    if (event.shiftKey) {
      const otherX = this.draggingHandle === 'start' ? line.x2 : line.x1;
      const otherY = this.draggingHandle === 'start' ? line.y2 : line.y1;

      // Get the handle's current position (where we started dragging from)
      const handleX = this.draggingHandle === 'start' ? line.x1 : line.x2;
      const handleY = this.draggingHandle === 'start' ? line.y1 : line.y2;

      // Measure drag direction from the handle's position
      const dx = Math.abs(x - (handleX + this.dragOffset.x));
      const dy = Math.abs(y - (handleY + this.dragOffset.y));

      if (dx > dy) {
        y = otherY; // Horizontal
      } else {
        x = otherX; // Vertical
      }
    }

    // Then subtract drag offset
    x = x - this.dragOffset.x;
    y = y - this.dragOffset.y;

    if (this.draggingHandle === 'start') {
      line.x1 = x;
      line.y1 = y;
    } else {
      line.x2 = x;
      line.y2 = y;
    }

    this.onRedraw();
  }

  handleMouseUp(): void {
    this.draggingHandle = null;
    this.dragOffset = { x: 0, y: 0 };
    this.onRedraw();
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Render handles for selected annotation
    if (this.selectedAnnotationId === null) return;

    const selectedLine = this.lineAnnotations.find(l => l.id === this.selectedAnnotationId);
    if (!selectedLine) return;

    this.renderHandle(ctx, selectedLine.x1, selectedLine.y1);
    this.renderHandle(ctx, selectedLine.x2, selectedLine.y2);
  }

  private renderHandle(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.fillStyle = toolStyles.handleFillColor;
    ctx.strokeStyle = toolStyles.handleStrokeColor;
    ctx.lineWidth = toolStyles.handleStrokeWidth;
    ctx.beginPath();
    ctx.arc(x, y, handleRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private isPointOnHandle(px: number, py: number, hx: number, hy: number): boolean {
    const distance = Math.sqrt((px - hx) ** 2 + (py - hy) ** 2);
    return distance <= handleRadius;
  }

  private isPointOnLine(px: number, py: number, line: LineAnnotation): boolean {
    const { x1, y1, x2, y2 } = line;

    // Calculate distance from point to line segment
    const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    if (lineLength === 0) return false;

    const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (lineLength ** 2)));
    const closestX = x1 + t * (x2 - x1);
    const closestY = y1 + t * (y2 - y1);
    const distance = Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);

    return distance <= lineHitThreshold;
  }
}
