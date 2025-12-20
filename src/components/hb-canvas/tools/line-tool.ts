import { ITool } from './base-tool';
import type { LineAnnotation } from '../types';
import { toolStyles } from './tool-styles';

const HANDLE_RADIUS = 8;
const LINE_HIT_THRESHOLD = 10;

export class LineTool implements ITool {
  private lineAnnotations: LineAnnotation[] = [];
  private isDrawing: boolean = false;
  private startPoint: { x: number; y: number } | null = null;
  private readonly color: string = toolStyles.color;
  private readonly lineWidth: number = toolStyles.lineWidth;
  private onRedraw: () => void;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  // Selection and dragging state
  private selectedLineIndex: number | null = null;
  private draggingHandle: 'start' | 'end' | null = null;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };

  constructor(onRedraw: () => void) {
    this.onRedraw = onRedraw;
  }

  handleClick(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Check if clicking on a line to select it
    for (let i = this.lineAnnotations.length - 1; i >= 0; i--) {
      if (this.isPointOnLine(x, y, this.lineAnnotations[i])) {
        this.selectedLineIndex = i;
        this.onRedraw();
        return;
      }
    }

    // Click on empty space - deselect
    this.selectedLineIndex = null;
    this.onRedraw();
  }

  handleMouseDown(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Check if clicking on a handle of selected line
    if (this.selectedLineIndex !== null) {
      const line = this.lineAnnotations[this.selectedLineIndex];

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

    // Not clicking on handle - start drawing new line
    this.selectedLineIndex = null; // Deselect when starting new line
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
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = (event.clientX - rect.left) * scaleX;
    let y = (event.clientY - rect.top) * scaleY;

    // Update cursor based on what's under the mouse
    if (!this.isDrawing && !this.draggingHandle) {
      // Check if hovering over a handle of selected line
      if (this.selectedLineIndex !== null) {
        const line = this.lineAnnotations[this.selectedLineIndex];

        if (this.isPointOnHandle(x, y, line.x1, line.y1) ||
          this.isPointOnHandle(x, y, line.x2, line.y2)) {
          canvas.style.cursor = 'move';
        } else if (this.isPointOnLine(x, y, line)) {
          canvas.style.cursor = 'pointer';
        } else {
          // Check other lines
          let onAnyLine = false;
          for (let i = this.lineAnnotations.length - 1; i >= 0; i--) {
            if (i !== this.selectedLineIndex && this.isPointOnLine(x, y, this.lineAnnotations[i])) {
              canvas.style.cursor = 'pointer';
              onAnyLine = true;
              break;
            }
          }
          if (!onAnyLine) {
            canvas.style.cursor = 'crosshair';
          }
        }
      } else {
        // No line selected - check if hovering over any line
        let found = false;
        for (let i = this.lineAnnotations.length - 1; i >= 0; i--) {
          if (this.isPointOnLine(x, y, this.lineAnnotations[i])) {
            canvas.style.cursor = 'pointer';
            found = true;
            break;
          }
        }
        if (!found) {
          canvas.style.cursor = 'crosshair';
        }
      }
    }

    // Handle dragging endpoint
    if (this.draggingHandle && this.selectedLineIndex !== null) {
      x -= this.dragOffset.x;
      y -= this.dragOffset.y;

      const line = this.lineAnnotations[this.selectedLineIndex];

      // Apply shift-key constraint if pressed
      if (event.shiftKey) {
        const refX = this.draggingHandle === 'start' ? line.x2 : line.x1;
        const refY = this.draggingHandle === 'start' ? line.y2 : line.y1;

        const dx = Math.abs(x - refX);
        const dy = Math.abs(y - refY);

        if (dx > dy) {
          y = refY; // Horizontal
        } else {
          x = refX; // Vertical
        }
      }

      // Update the line endpoint
      if (this.draggingHandle === 'start') {
        this.lineAnnotations[this.selectedLineIndex] = {
          ...line,
          x1: x,
          y1: y,
        };
      } else {
        this.lineAnnotations[this.selectedLineIndex] = {
          ...line,
          x2: x,
          y2: y,
        };
      }

      this.onRedraw();
      return;
    }

    // Handle drawing new line
    if (!this.isDrawing || !this.startPoint) return;

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

    // Show handles while drawing
    this.renderHandle(ctx, this.startPoint.x, this.startPoint.y, this.color);
    this.renderHandle(ctx, x, y, this.color);
  }

  handleMouseUp(event: MouseEvent, canvas: HTMLCanvasElement): void {
    // Handle end dragging
    if (this.draggingHandle) {
      this.draggingHandle = null;
      this.dragOffset = { x: 0, y: 0 };
      this.onRedraw();
      return;
    }

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

  private isPointOnHandle(x: number, y: number, handleX: number, handleY: number): boolean {
    const distance = Math.sqrt((x - handleX) ** 2 + (y - handleY) ** 2);
    return distance <= HANDLE_RADIUS;
  }

  private isPointOnLine(x: number, y: number, line: LineAnnotation): boolean {
    // Calculate distance from point to line segment
    const { x1, y1, x2, y2 } = line;

    const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    if (lineLength === 0) {
      // Line is actually a point
      return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2) <= LINE_HIT_THRESHOLD;
    }

    // Calculate perpendicular distance from point to line
    const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / (lineLength ** 2)));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    const distance = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);

    return distance <= LINE_HIT_THRESHOLD;
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Render all lines
    this.lineAnnotations.forEach((line, index) => {
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();

      // Render handles for selected line
      if (index === this.selectedLineIndex) {
        this.renderHandle(ctx, line.x1, line.y1, line.color);
        this.renderHandle(ctx, line.x2, line.y2, line.color);
      }
    });
  }

  private renderHandle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
    // Draw white fill
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, HANDLE_RADIUS, 0, 2 * Math.PI);
    ctx.fill();

    // Draw colored border
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}
