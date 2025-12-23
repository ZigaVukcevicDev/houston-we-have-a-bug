import type { Tool } from '../../../interfaces/tool.interface';
import type { LineAnnotation } from '../../../interfaces/annotation.interface';
import { toolStyles } from './tool-styles';

const handleRadius = 8;
const lineHitThreshold = 10;

export class SelectTool implements Tool {
  private lineAnnotations: LineAnnotation[] = [];
  private selectedAnnotationId: string | null = null;
  private hoveredAnnotationId: string | null = null;
  private draggingHandle: 'start' | 'end' | null = null;
  private draggingLine: boolean = false;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private dragStartPosition: { x: number; y: number } = { x: 0, y: 0 };
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

      // Check start handle first
      if (this.isPointOnHandle(x, y, line.x1, line.y1)) {
        this.draggingHandle = 'start';
        this.dragOffset = { x: x - line.x1, y: y - line.y1 };
        return;
      }

      // Check end handle second
      if (this.isPointOnHandle(x, y, line.x2, line.y2)) {
        this.draggingHandle = 'end';
        this.dragOffset = { x: x - line.x2, y: y - line.y2 };
        return;
      }

      // Check if clicking on the line body (to drag entire line)
      if (this.isPointOnLine(x, y, line)) {
        this.draggingLine = true;
        this.dragOffset = { x, y };
        return;
      }
    }
  }

  handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    // Provide cursor feedback when hovering (but not while dragging)
    if (!this.draggingHandle && !this.draggingLine) {
      // Provide cursor feedback when hovering over handles or lines
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      // Check if hovering over a handle of selected line
      const selectedLine = this.lineAnnotations.find(l => l.id === this.selectedAnnotationId);
      if (selectedLine) {
        if (this.isPointOnHandle(x, y, selectedLine.x1, selectedLine.y1) ||
          this.isPointOnHandle(x, y, selectedLine.x2, selectedLine.y2)) {
          canvas.style.cursor = 'move';
          this.hoveredAnnotationId = null;
          this.onRedraw();
          return;
        }
      }

      // Check if hovering over any line (iterate backwards for most recent)
      for (let i = this.lineAnnotations.length - 1; i >= 0; i--) {
        if (this.isPointOnLine(x, y, this.lineAnnotations[i])) {
          canvas.style.cursor = 'pointer';
          if (this.hoveredAnnotationId !== this.lineAnnotations[i].id) {
            this.hoveredAnnotationId = this.lineAnnotations[i].id;
            this.onRedraw();
          }
          return;
        }
      }

      // Not hovering over anything - reset to CSS-controlled cursor
      if (this.hoveredAnnotationId !== null) {
        this.hoveredAnnotationId = null;
        this.onRedraw();
      }
      canvas.style.cursor = '';
      return;
    }

    // Handle dragging (cursor doesn't change during drag)
    const line = this.lineAnnotations.find(l => l.id === this.selectedAnnotationId);
    if (!line) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = (event.clientX - rect.left) * scaleX;
    let y = (event.clientY - rect.top) * scaleY;

    if (this.draggingLine) {
      // Dragging entire line - move both endpoints
      const dx = x - this.dragOffset.x;
      const dy = y - this.dragOffset.y;

      line.x1 += dx;
      line.y1 += dy;
      line.x2 += dx;
      line.y2 += dy;

      this.dragOffset = { x, y };
      this.onRedraw();
      return;
    }

    // Handle dragging endpoints
    // Subtract drag offset
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
    this.draggingLine = false;
    this.dragOffset = { x: 0, y: 0 };
    this.onRedraw();
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Render stroke for hovered annotation (if not selected)
    if (this.hoveredAnnotationId !== null && this.hoveredAnnotationId !== this.selectedAnnotationId) {
      const hoveredLine = this.lineAnnotations.find(l => l.id === this.hoveredAnnotationId);
      if (hoveredLine) {
        // Draw thin stroke outline around hovered line
        ctx.save();
        ctx.strokeStyle = toolStyles.handleStrokeColor;
        ctx.lineWidth = hoveredLine.width + 4; // Thin outline (2px on each side)
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(hoveredLine.x1, hoveredLine.y1);
        ctx.lineTo(hoveredLine.x2, hoveredLine.y2);
        ctx.stroke();
        ctx.restore();

        // Draw the line itself on top in its original color
        ctx.save();
        ctx.strokeStyle = hoveredLine.color;
        ctx.lineWidth = hoveredLine.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(hoveredLine.x1, hoveredLine.y1);
        ctx.lineTo(hoveredLine.x2, hoveredLine.y2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Render handles for selected annotation
    if (this.selectedAnnotationId === null) return;

    const selectedLine = this.lineAnnotations.find(l => l.id === this.selectedAnnotationId);
    if (!selectedLine) return;

    // Draw handles only (no stroke outline for selected line)
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
