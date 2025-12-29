import type { Tool } from '../../../interfaces/tool.interface';
import type { LineAnnotation, RectangleAnnotation } from '../../../interfaces/annotation.interface';
import { renderHandle, isPointOnHandle } from '../../../utils/render-handle';

const lineHitThreshold = 10;

export class SelectTool implements Tool {
  private lineAnnotations: LineAnnotation[] = [];
  private rectangleAnnotations: RectangleAnnotation[] = [];
  private selectedAnnotationId: string | null = null;
  private selectedAnnotationType: 'line' | 'rectangle' | null = null;
  private hoveredAnnotationId: string | null = null;
  private hoveredAnnotationType: 'line' | 'rectangle' | null = null;
  private draggingHandle: 'start' | 'end' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null = null;
  private draggingLine: boolean = false;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  private onRedraw: () => void;

  constructor(lineAnnotations: LineAnnotation[], rectangleAnnotations: RectangleAnnotation[], onRedraw: () => void) {
    this.lineAnnotations = lineAnnotations;
    this.rectangleAnnotations = rectangleAnnotations;
    this.onRedraw = onRedraw;
  }

  activate(): void {
    // Add keyboard listener for Delete/Backspace keys
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        this.deleteSelectedAnnotation();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);
  }

  deactivate(): void {
    // Remove keyboard listener
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
  }

  private deleteSelectedAnnotation(): void {
    if (this.selectedAnnotationId === null) return;

    if (this.selectedAnnotationType === 'line') {
      const index = this.lineAnnotations.findIndex(l => l.id === this.selectedAnnotationId);
      if (index !== -1) {
        this.lineAnnotations.splice(index, 1);
      }
    } else if (this.selectedAnnotationType === 'rectangle') {
      const index = this.rectangleAnnotations.findIndex(r => r.id === this.selectedAnnotationId);
      if (index !== -1) {
        this.rectangleAnnotations.splice(index, 1);
      }
    }

    // Clear selection after deletion
    this.selectedAnnotationId = null;
    this.selectedAnnotationType = null;
    this.onRedraw();
  }

  // Select a specific annotation by ID (for auto-selection after drawing)
  selectAnnotation(id: string): void {
    this.selectedAnnotationId = id;
    // Determine annotation type
    if (this.lineAnnotations.find(l => l.id === id)) {
      this.selectedAnnotationType = 'line';
    } else if (this.rectangleAnnotations.find(r => r.id === id)) {
      this.selectedAnnotationType = 'rectangle';
    }
    this.onRedraw();
  }

  // Deselect all annotations (used for download)
  deselectAll(): void {
    this.selectedAnnotationId = null;
    this.selectedAnnotationType = null;
    this.hoveredAnnotationId = null;
    this.hoveredAnnotationType = null;
    this.onRedraw();
  }


  handleClick(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Check rectangles first (iterate backwards for most recent)
    for (let i = this.rectangleAnnotations.length - 1; i >= 0; i--) {
      if (this.isPointOnRectangle(x, y, this.rectangleAnnotations[i])) {
        this.selectedAnnotationId = this.rectangleAnnotations[i].id;
        this.selectedAnnotationType = 'rectangle';
        this.onRedraw();
        return;
      }
    }

    // Check lines (iterate backwards for most recent)
    for (let i = this.lineAnnotations.length - 1; i >= 0; i--) {
      if (this.isPointOnLine(x, y, this.lineAnnotations[i])) {
        this.selectedAnnotationId = this.lineAnnotations[i].id;
        this.selectedAnnotationType = 'line';
        this.onRedraw();
        return;
      }
    }

    // Click on empty space - deselect
    this.selectedAnnotationId = null;
    this.selectedAnnotationType = null;
    this.onRedraw();
  }

  handleMouseDown(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Check if clicking on a handle or body of selected annotation
    if (this.selectedAnnotationId !== null) {
      // Handle line annotations
      if (this.selectedAnnotationType === 'line') {
        const line = this.lineAnnotations.find(l => l.id === this.selectedAnnotationId);
        if (!line) return;

        // Check start handle first
        if (isPointOnHandle(x, y, line.x1, line.y1)) {
          this.draggingHandle = 'start';
          this.dragOffset = { x: x - line.x1, y: y - line.y1 };
          return;
        }

        // Check end handle second
        if (isPointOnHandle(x, y, line.x2, line.y2)) {
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
      // Handle rectangle annotations
      else if (this.selectedAnnotationType === 'rectangle') {
        const rectangle = this.rectangleAnnotations.find(r => r.id === this.selectedAnnotationId);
        if (!rectangle) return;

        // Check corner handles first (top-left, top-right, bottom-left, bottom-right)
        const topLeft = { x: rectangle.x, y: rectangle.y };
        const topRight = { x: rectangle.x + rectangle.width, y: rectangle.y };
        const bottomLeft = { x: rectangle.x, y: rectangle.y + rectangle.height };
        const bottomRight = { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height };

        if (isPointOnHandle(x, y, topLeft.x, topLeft.y)) {
          this.draggingHandle = 'top-left';
          this.dragOffset = { x: x - topLeft.x, y: y - topLeft.y };
          return;
        }
        if (isPointOnHandle(x, y, topRight.x, topRight.y)) {
          this.draggingHandle = 'top-right';
          this.dragOffset = { x: x - topRight.x, y: y - topRight.y };
          return;
        }
        if (isPointOnHandle(x, y, bottomLeft.x, bottomLeft.y)) {
          this.draggingHandle = 'bottom-left';
          this.dragOffset = { x: x - bottomLeft.x, y: y - bottomLeft.y };
          return;
        }
        if (isPointOnHandle(x, y, bottomRight.x, bottomRight.y)) {
          this.draggingHandle = 'bottom-right';
          this.dragOffset = { x: x - bottomRight.x, y: y - bottomRight.y };
          return;
        }

        // Check if clicking on the rectangle body (to drag entire rectangle)
        if (this.isPointOnRectangle(x, y, rectangle)) {
          this.draggingLine = true; // Reusing draggingLine flag for rectangle dragging
          this.dragOffset = { x, y };
          return;
        }
      }
    }

    // Allow dragging hovered (not selected) annotations immediately
    // Check rectangles first (iterate backwards for most recent)
    for (let i = this.rectangleAnnotations.length - 1; i >= 0; i--) {
      if (this.isPointOnRectangle(x, y, this.rectangleAnnotations[i])) {
        this.selectedAnnotationId = this.rectangleAnnotations[i].id;
        this.selectedAnnotationType = 'rectangle';
        this.draggingLine = true;
        this.dragOffset = { x, y };
        this.onRedraw();
        return;
      }
    }

    // Check lines (iterate backwards for most recent)
    for (let i = this.lineAnnotations.length - 1; i >= 0; i--) {
      if (this.isPointOnLine(x, y, this.lineAnnotations[i])) {
        this.selectedAnnotationId = this.lineAnnotations[i].id;
        this.selectedAnnotationType = 'line';
        this.draggingLine = true;
        this.dragOffset = { x, y };
        this.onRedraw();
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
        if (isPointOnHandle(x, y, selectedLine.x1, selectedLine.y1) ||
          isPointOnHandle(x, y, selectedLine.x2, selectedLine.y2)) {
          canvas.style.cursor = 'move';
          this.hoveredAnnotationId = null;
          this.onRedraw();
          return;
        }
      }

      // Check if hovering over a handle of selected rectangle
      const selectedRect = this.rectangleAnnotations.find(r => r.id === this.selectedAnnotationId);
      if (selectedRect) {
        const topLeft = { x: selectedRect.x, y: selectedRect.y };
        const topRight = { x: selectedRect.x + selectedRect.width, y: selectedRect.y };
        const bottomLeft = { x: selectedRect.x, y: selectedRect.y + selectedRect.height };
        const bottomRight = { x: selectedRect.x + selectedRect.width, y: selectedRect.y + selectedRect.height };

        if (isPointOnHandle(x, y, topLeft.x, topLeft.y) ||
          isPointOnHandle(x, y, topRight.x, topRight.y) ||
          isPointOnHandle(x, y, bottomLeft.x, bottomLeft.y) ||
          isPointOnHandle(x, y, bottomRight.x, bottomRight.y)) {
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
            this.hoveredAnnotationType = 'line';
            this.onRedraw();
          }
          return;
        }
      }

      // Check if hovering over any rectangle (iterate backwards for most recent)
      for (let i = this.rectangleAnnotations.length - 1; i >= 0; i--) {
        if (this.isPointOnRectangle(x, y, this.rectangleAnnotations[i])) {
          canvas.style.cursor = 'pointer';
          if (this.hoveredAnnotationId !== this.rectangleAnnotations[i].id) {
            this.hoveredAnnotationId = this.rectangleAnnotations[i].id;
            this.hoveredAnnotationType = 'rectangle';
            this.onRedraw();
          }
          return;
        }
      }

      // Not hovering over anything - reset to CSS-controlled cursor
      if (this.hoveredAnnotationId !== null) {
        this.hoveredAnnotationId = null;
        this.hoveredAnnotationType = null;
        this.onRedraw();
      }
      canvas.style.cursor = '';
      return;
    }

    // Handle dragging (cursor doesn't change during drag)
    if (this.draggingLine) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      const dx = x - this.dragOffset.x;
      const dy = y - this.dragOffset.y;

      if (this.selectedAnnotationType === 'line') {
        const line = this.lineAnnotations.find(l => l.id === this.selectedAnnotationId);
        if (line) {
          // Dragging entire line - move both endpoints
          line.x1 += dx;
          line.y1 += dy;
          line.x2 += dx;
          line.y2 += dy;
        }
      } else if (this.selectedAnnotationType === 'rectangle') {
        const rectangle = this.rectangleAnnotations.find(r => r.id === this.selectedAnnotationId);
        if (rectangle) {
          // Dragging entire rectangle
          rectangle.x += dx;
          rectangle.y += dy;
        }
      }

      this.dragOffset = { x, y };
      this.onRedraw();
      return;
    }

    // Handle dragging handles (line endpoints or rectangle corners)
    if (this.draggingHandle) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      let x = (event.clientX - rect.left) * scaleX;
      let y = (event.clientY - rect.top) * scaleY;

      // Subtract drag offset
      x = x - this.dragOffset.x;
      y = y - this.dragOffset.y;

      if (this.selectedAnnotationType === 'line') {
        const line = this.lineAnnotations.find(l => l.id === this.selectedAnnotationId);
        if (!line) return;

        if (this.draggingHandle === 'start') {
          line.x1 = x;
          line.y1 = y;
        } else if (this.draggingHandle === 'end') {
          line.x2 = x;
          line.y2 = y;
        }
      } else if (this.selectedAnnotationType === 'rectangle') {
        const rectangle = this.rectangleAnnotations.find(r => r.id === this.selectedAnnotationId);
        if (!rectangle) return;

        // Store original rectangle bounds
        const originalRight = rectangle.x + rectangle.width;
        const originalBottom = rectangle.y + rectangle.height;

        // Resize based on which corner is being dragged
        if (this.draggingHandle === 'top-left') {
          rectangle.width = originalRight - x;
          rectangle.height = originalBottom - y;
          rectangle.x = x;
          rectangle.y = y;
        } else if (this.draggingHandle === 'top-right') {
          rectangle.width = x - rectangle.x;
          rectangle.height = originalBottom - y;
          rectangle.y = y;
        } else if (this.draggingHandle === 'bottom-left') {
          rectangle.width = originalRight - x;
          rectangle.height = y - rectangle.y;
          rectangle.x = x;
        } else if (this.draggingHandle === 'bottom-right') {
          rectangle.width = x - rectangle.x;
          rectangle.height = y - rectangle.y;
        }
      }

      this.onRedraw();
    }
  }

  handleMouseUp(): void {
    this.draggingHandle = null;
    this.draggingLine = false;
    this.dragOffset = { x: 0, y: 0 };
    this.onRedraw();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const dpr = window.devicePixelRatio || 1;

    // Render yellow centerline for hovered annotation (if not selected)
    if (this.hoveredAnnotationId !== null && this.hoveredAnnotationId !== this.selectedAnnotationId) {
      if (this.hoveredAnnotationType === 'line') {
        const hoveredLine = this.lineAnnotations.find(l => l.id === this.hoveredAnnotationId);
        if (hoveredLine) {
          ctx.save();
          ctx.strokeStyle = '#FAC021';
          ctx.lineWidth = 1 * dpr;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(hoveredLine.x1, hoveredLine.y1);
          ctx.lineTo(hoveredLine.x2, hoveredLine.y2);
          ctx.stroke();
          ctx.restore();
        }
      } else if (this.hoveredAnnotationType === 'rectangle') {
        const hoveredRect = this.rectangleAnnotations.find(r => r.id === this.hoveredAnnotationId);
        if (hoveredRect) {
          ctx.save();
          ctx.strokeStyle = '#FAC021';
          ctx.lineWidth = 1 * dpr;
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.rect(hoveredRect.x, hoveredRect.y, hoveredRect.width, hoveredRect.height);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Render handles for selected annotation
    if (this.selectedAnnotationId === null) return;

    if (this.selectedAnnotationType === 'line') {
      const selectedLine = this.lineAnnotations.find(l => l.id === this.selectedAnnotationId);
      if (selectedLine) {
        renderHandle(ctx, selectedLine.x1, selectedLine.y1);
        renderHandle(ctx, selectedLine.x2, selectedLine.y2);
      }
    } else if (this.selectedAnnotationType === 'rectangle') {
      const selectedRect = this.rectangleAnnotations.find(r => r.id === this.selectedAnnotationId);
      if (selectedRect) {
        // Draw corner handles
        renderHandle(ctx, selectedRect.x, selectedRect.y); // top-left
        renderHandle(ctx, selectedRect.x + selectedRect.width, selectedRect.y); // top-right
        renderHandle(ctx, selectedRect.x, selectedRect.y + selectedRect.height); // bottom-left
        renderHandle(ctx, selectedRect.x + selectedRect.width, selectedRect.y + selectedRect.height); // bottom-right
      }
    }
  }

  private isPointOnLine(px: number, py: number, line: LineAnnotation): boolean {
    const { x1, y1, x2, y2, width } = line;
    const threshold = width + 2;

    // Calculate distance from point to line segment
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      // Line is actually a point
      return Math.abs(px - x1) <= threshold && Math.abs(py - y1) <= threshold;
    }

    // Find the projection of the point onto the line
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    // Calculate distance from point to projection
    const distance = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);

    // Check if point is on the line
    if (distance <= threshold) {
      return true;
    }

    // If this is an arrow, also check if point is near the arrowhead
    if (line.hasArrowhead) {
      return this.isPointOnArrowhead(px, py, line);
    }

    return false;
  }

  private isPointOnArrowhead(px: number, py: number, line: LineAnnotation): boolean {
    const { x1, y1, x2, y2, width } = line;
    const threshold = width + 2;

    // Calculate angle of the arrow
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Arrowhead dimensions (same as in ArrowTool)
    const headLength = 16;
    const arrowAngle = Math.PI / 4; // 45 degrees

    // Calculate arrowhead points
    const point1x = x2 - headLength * Math.cos(angle - arrowAngle);
    const point1y = y2 - headLength * Math.sin(angle - arrowAngle);
    const point2x = x2 - headLength * Math.cos(angle + arrowAngle);
    const point2y = y2 - headLength * Math.sin(angle + arrowAngle);

    // Check if point is near either arrowhead line
    return this.isPointNearLineSegment(px, py, x2, y2, point1x, point1y, threshold) ||
      this.isPointNearLineSegment(px, py, x2, y2, point2x, point2y, threshold);
  }

  private isPointNearLineSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    threshold: number
  ): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      return Math.abs(px - x1) <= threshold && Math.abs(py - y1) <= threshold;
    }

    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    const distance = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
    return distance <= threshold;
  }

  private isPointOnRectangle(px: number, py: number, rectangle: RectangleAnnotation): boolean {
    const { x, y, width, height, strokeWidth } = rectangle;
    const threshold = strokeWidth + 2;

    // Check if point is near any of the four edges
    const nearLeft = Math.abs(px - x) <= threshold && py >= y - threshold && py <= y + height + threshold;
    const nearRight = Math.abs(px - (x + width)) <= threshold && py >= y - threshold && py <= y + height + threshold;
    const nearTop = Math.abs(py - y) <= threshold && px >= x - threshold && px <= x + width + threshold;
    const nearBottom = Math.abs(py - (y + height)) <= threshold && px >= x - threshold && px <= x + width + threshold;

    return nearLeft || nearRight || nearTop || nearBottom;
  }
}
