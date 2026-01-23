import type { Tool } from '../../../interfaces/tool.interface';
import type {
  LineAnnotation,
  RectangleAnnotation,
  TextAnnotation,
} from '../../../interfaces/annotation.interface';
import type { TextTool } from './text-tool';
import { renderHandle, isPointOnHandle } from '../../../utils/render-handle';
import { getCanvasCoordinates } from '../../../utils/get-canvas-coordinates';
import {
  renderArrowhead,
  getArrowheadPoints,
} from '../../../utils/render-arrowhead';

export class SelectTool implements Tool {
  private lineAnnotations: LineAnnotation[] = [];
  private arrowAnnotations: LineAnnotation[] = [];
  private rectangleAnnotations: RectangleAnnotation[] = [];
  private textAnnotations: TextAnnotation[] = [];
  private textTool?: TextTool;
  private selectedAnnotationId: string | null = null;
  private selectedAnnotationType: 'line' | 'rectangle' | 'text' | null = null;
  private hoveredAnnotationId: string | null = null;
  private hoveredAnnotationType: 'line' | 'rectangle' | 'text' | null = null;
  private draggingHandle:
    | 'start'
    | 'end'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | null = null;
  private draggingLine: boolean = false;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  private onRedraw: () => void;

  constructor(
    lineAnnotations: LineAnnotation[],
    arrowAnnotations: LineAnnotation[],
    rectangleAnnotations: RectangleAnnotation[],
    textAnnotations: TextAnnotation[],
    onRedraw: () => void,
    textTool?: TextTool
  ) {
    this.lineAnnotations = lineAnnotations;
    this.arrowAnnotations = arrowAnnotations;
    this.rectangleAnnotations = rectangleAnnotations;
    this.textAnnotations = textAnnotations;
    this.onRedraw = onRedraw;
    this.textTool = textTool;
  }

  // Helper to get all lines (including arrows) for iteration
  private getAllLines(): LineAnnotation[] {
    return [...this.lineAnnotations, ...this.arrowAnnotations];
  }

  // Helper to find line/arrow by ID in either array
  private findLineById(id: string): LineAnnotation | undefined {
    return (
      this.lineAnnotations.find((l) => l.id === id) ||
      this.arrowAnnotations.find((a) => a.id === id)
    );
  }

  // Helper to remove line/arrow by ID from the correct array
  private removeLineById(id: string): boolean {
    let index = this.lineAnnotations.findIndex((l) => l.id === id);
    if (index !== -1) {
      this.lineAnnotations.splice(index, 1);
      return true;
    }
    index = this.arrowAnnotations.findIndex((a) => a.id === id);
    if (index !== -1) {
      this.arrowAnnotations.splice(index, 1);
      return true;
    }
    return false;
  }

  // Helper to check if a line ID belongs to an arrow
  private isArrow(id: string): boolean {
    return this.arrowAnnotations.some((a) => a.id === id);
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
      this.removeLineById(this.selectedAnnotationId);
    } else if (this.selectedAnnotationType === 'rectangle') {
      const index = this.rectangleAnnotations.findIndex(
        (r) => r.id === this.selectedAnnotationId
      );
      if (index !== -1) {
        this.rectangleAnnotations.splice(index, 1);
      }
    } else if (this.selectedAnnotationType === 'text') {
      const index = this.textAnnotations.findIndex(
        (t) => t.id === this.selectedAnnotationId
      );
      if (index !== -1) {
        this.textAnnotations.splice(index, 1);
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
    if (this.findLineById(id)) {
      this.selectedAnnotationType = 'line';
    } else if (this.rectangleAnnotations.find((r) => r.id === id)) {
      this.selectedAnnotationType = 'rectangle';
    } else if (this.textAnnotations.find((t) => t.id === id)) {
      this.selectedAnnotationType = 'text';
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
    const { x, y } = getCanvasCoordinates(event, canvas);

    // Check text annotations first (iterate backwards for most recent)
    for (let i = this.textAnnotations.length - 1; i >= 0; i--) {
      if (this.isPointOnTextBox(x, y, this.textAnnotations[i])) {
        this.selectedAnnotationId = this.textAnnotations[i].id;
        this.selectedAnnotationType = 'text';
        this.onRedraw();
        return;
      }
    }

    // Check rectangles (iterate backwards for most recent)
    for (let i = this.rectangleAnnotations.length - 1; i >= 0; i--) {
      if (this.isPointOnRectangle(x, y, this.rectangleAnnotations[i])) {
        this.selectedAnnotationId = this.rectangleAnnotations[i].id;
        this.selectedAnnotationType = 'rectangle';
        this.onRedraw();
        return;
      }
    }

    // Check lines (iterate backwards for most recent)
    const allLines = this.getAllLines();
    for (let i = allLines.length - 1; i >= 0; i--) {
      if (this.isPointOnLine(x, y, allLines[i])) {
        this.selectedAnnotationId = allLines[i].id;
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
    const { x, y } = getCanvasCoordinates(event, canvas);

    // Check if clicking on a handle or body of selected annotation
    if (this.selectedAnnotationId !== null) {
      // Handle line annotations
      if (this.selectedAnnotationType === 'line') {
        const line = this.findLineById(this.selectedAnnotationId);
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
        const rectangle = this.rectangleAnnotations.find(
          (r) => r.id === this.selectedAnnotationId
        );
        if (!rectangle) return;

        // Check corner handles first (top-left, top-right, bottom-left, bottom-right)
        const topLeft = { x: rectangle.x, y: rectangle.y };
        const topRight = { x: rectangle.x + rectangle.width, y: rectangle.y };
        const bottomLeft = {
          x: rectangle.x,
          y: rectangle.y + rectangle.height,
        };
        const bottomRight = {
          x: rectangle.x + rectangle.width,
          y: rectangle.y + rectangle.height,
        };

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
      // Handle text annotations
      else if (this.selectedAnnotationType === 'text') {
        const textBox = this.textAnnotations.find(
          (t) => t.id === this.selectedAnnotationId
        );
        if (!textBox) return;

        // Check corner handles first (top-left, top-right, bottom-left, bottom-right)
        const topLeft = { x: textBox.x, y: textBox.y };
        const topRight = { x: textBox.x + textBox.width, y: textBox.y };
        const bottomLeft = { x: textBox.x, y: textBox.y + textBox.height };
        const bottomRight = {
          x: textBox.x + textBox.width,
          y: textBox.y + textBox.height,
        };

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

        // Check if clicking on the text box border (to drag entire text box)
        if (this.isPointOnTextBox(x, y, textBox)) {
          this.draggingLine = true; // Reusing draggingLine flag for text box dragging
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
    const allLines = this.getAllLines();
    for (let i = allLines.length - 1; i >= 0; i--) {
      if (this.isPointOnLine(x, y, allLines[i])) {
        this.selectedAnnotationId = allLines[i].id;
        this.selectedAnnotationType = 'line';
        this.draggingLine = true;
        this.dragOffset = { x, y };
        this.onRedraw();
        return;
      }
    }
  }

  handleMouseMove(
    event: MouseEvent,
    canvas: HTMLCanvasElement,
    _ctx: CanvasRenderingContext2D
  ): void {
    // Provide cursor feedback when hovering (but not while dragging)
    if (!this.draggingHandle && !this.draggingLine) {
      // Provide cursor feedback when hovering over handles or lines
      const { x, y } = getCanvasCoordinates(event, canvas);

      // Check if hovering over a handle of selected line
      const selectedLine = this.selectedAnnotationId
        ? this.findLineById(this.selectedAnnotationId)
        : null;
      if (selectedLine) {
        if (
          isPointOnHandle(x, y, selectedLine.x1, selectedLine.y1) ||
          isPointOnHandle(x, y, selectedLine.x2, selectedLine.y2)
        ) {
          canvas.style.cursor = 'move';
          this.hoveredAnnotationId = null;
          this.onRedraw();
          return;
        }

        // If hovering over selected line body (not handle)
        if (this.isPointOnLine(x, y, selectedLine)) {
          canvas.style.cursor = 'move';
          this.hoveredAnnotationId = null;
          this.onRedraw();
          return;
        }
      }

      // Check if hovering over a handle of selected rectangle
      const selectedRect = this.rectangleAnnotations.find(
        (r) => r.id === this.selectedAnnotationId
      );
      if (selectedRect) {
        const topLeft = { x: selectedRect.x, y: selectedRect.y };
        const topRight = {
          x: selectedRect.x + selectedRect.width,
          y: selectedRect.y,
        };
        const bottomLeft = {
          x: selectedRect.x,
          y: selectedRect.y + selectedRect.height,
        };
        const bottomRight = {
          x: selectedRect.x + selectedRect.width,
          y: selectedRect.y + selectedRect.height,
        };

        // Check each corner and set appropriate resize cursor
        if (isPointOnHandle(x, y, topLeft.x, topLeft.y)) {
          canvas.style.cursor = 'nwse-resize';
          this.hoveredAnnotationId = null;
          this.onRedraw();
          return;
        }
        if (isPointOnHandle(x, y, bottomRight.x, bottomRight.y)) {
          canvas.style.cursor = 'nwse-resize';
          this.hoveredAnnotationId = null;
          this.onRedraw();
          return;
        }
        if (isPointOnHandle(x, y, topRight.x, topRight.y)) {
          canvas.style.cursor = 'nesw-resize';
          this.hoveredAnnotationId = null;
          this.onRedraw();
          return;
        }
        if (isPointOnHandle(x, y, bottomLeft.x, bottomLeft.y)) {
          canvas.style.cursor = 'nesw-resize';
          this.hoveredAnnotationId = null;
          this.onRedraw();
          return;
        }

        // If hovering over selected rectangle body (not handle)
        if (this.isPointOnRectangle(x, y, selectedRect)) {
          canvas.style.cursor = 'move';
          this.hoveredAnnotationId = null;
          this.onRedraw();
          return;
        }
      }

      // Check if hovering over a handle of selected text box
      const selectedText = this.textAnnotations.find(
        (t) => t.id === this.selectedAnnotationId
      );
      if (selectedText) {
        const topLeft = { x: selectedText.x, y: selectedText.y };
        const topRight = {
          x: selectedText.x + selectedText.width,
          y: selectedText.y,
        };
        const bottomLeft = {
          x: selectedText.x,
          y: selectedText.y + selectedText.height,
        };
        const bottomRight = {
          x: selectedText.x + selectedText.width,
          y: selectedText.y + selectedText.height,
        };

        // Check each corner and set appropriate resize cursor
        if (isPointOnHandle(x, y, topLeft.x, topLeft.y)) {
          canvas.style.cursor = 'nwse-resize';
          this.hoveredAnnotationId = null;
          this.onRedraw();
          return;
        }
        if (isPointOnHandle(x, y, bottomRight.x, bottomRight.y)) {
          canvas.style.cursor = 'nwse-resize';
          this.hoveredAnnotationId = null;
          this.onRedraw();
          return;
        }
        if (isPointOnHandle(x, y, topRight.x, topRight.y)) {
          canvas.style.cursor = 'nesw-resize';
          this.hoveredAnnotationId = null;
          this.onRedraw();
          return;
        }
        if (isPointOnHandle(x, y, bottomLeft.x, bottomLeft.y)) {
          canvas.style.cursor = 'nesw-resize';
          this.hoveredAnnotationId = null;
          this.onRedraw();
          return;
        }

        // If hovering over selected text box body (not handle)
        if (this.isPointOnTextBox(x, y, selectedText)) {
          // Check if text is being actively edited
          if (
            this.textTool?.isTextEditingActive() &&
            this.textTool?.getEditingAnnotationId() === selectedText.id
          ) {
            // When editing text, show text cursor instead of move cursor
            canvas.style.cursor = 'text';
          } else {
            canvas.style.cursor = 'move';
          }
          this.hoveredAnnotationId = null;
          this.onRedraw();
          return;
        }
      }

      // Check if hovering over any line (iterate backwards for most recent)
      const allLines = this.getAllLines();
      for (let i = allLines.length - 1; i >= 0; i--) {
        if (this.isPointOnLine(x, y, allLines[i])) {
          canvas.style.cursor = 'pointer';
          if (this.hoveredAnnotationId !== allLines[i].id) {
            this.hoveredAnnotationId = allLines[i].id;
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

      // Check if hovering over any text box (iterate backwards for most recent)
      for (let i = this.textAnnotations.length - 1; i >= 0; i--) {
        if (this.isPointOnTextBox(x, y, this.textAnnotations[i])) {
          canvas.style.cursor = 'pointer';
          if (this.hoveredAnnotationId !== this.textAnnotations[i].id) {
            this.hoveredAnnotationId = this.textAnnotations[i].id;
            this.hoveredAnnotationType = 'text';
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
      const { x, y } = getCanvasCoordinates(event, canvas);

      const dx = x - this.dragOffset.x;
      const dy = y - this.dragOffset.y;

      if (this.selectedAnnotationType === 'line') {
        const line = this.selectedAnnotationId
          ? this.findLineById(this.selectedAnnotationId)
          : null;
        if (line) {
          // Dragging entire line - move both endpoints
          line.x1 += dx;
          line.y1 += dy;
          line.x2 += dx;
          line.y2 += dy;
        }
      } else if (this.selectedAnnotationType === 'rectangle') {
        const rectangle = this.rectangleAnnotations.find(
          (r) => r.id === this.selectedAnnotationId
        );
        if (rectangle) {
          // Dragging entire rectangle
          rectangle.x += dx;
          rectangle.y += dy;
        }
      } else if (this.selectedAnnotationType === 'text') {
        const textBox = this.textAnnotations.find(
          (t) => t.id === this.selectedAnnotationId
        );
        if (textBox) {
          // Dragging entire text box
          textBox.x += dx;
          textBox.y += dy;
        }
      }

      this.dragOffset = { x, y };
      this.onRedraw();
      return;
    }

    // Handle dragging handles (line endpoints or rectangle corners)
    if (this.draggingHandle) {
      let { x, y } = getCanvasCoordinates(event, canvas);

      // Subtract drag offset
      x = x - this.dragOffset.x;
      y = y - this.dragOffset.y;

      if (this.selectedAnnotationType === 'line') {
        const line = this.selectedAnnotationId
          ? this.findLineById(this.selectedAnnotationId)
          : null;
        if (!line) return;

        if (this.draggingHandle === 'start') {
          line.x1 = x;
          line.y1 = y;
        } else if (this.draggingHandle === 'end') {
          line.x2 = x;
          line.y2 = y;
        }
      } else if (this.selectedAnnotationType === 'rectangle') {
        const rectangle = this.rectangleAnnotations.find(
          (r) => r.id === this.selectedAnnotationId
        );
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
      } else if (this.selectedAnnotationType === 'text') {
        const textBox = this.textAnnotations.find(
          (t) => t.id === this.selectedAnnotationId
        );
        if (!textBox) return;

        // Store original text box bounds
        const originalRight = textBox.x + textBox.width;
        const originalBottom = textBox.y + textBox.height;

        const MIN_SIZE = 40;
        let newX = textBox.x;
        let newY = textBox.y;
        let newWidth = textBox.width;
        let newHeight = textBox.height;

        // Resize based on which corner is being dragged
        if (this.draggingHandle === 'top-left') {
          newWidth = originalRight - x;
          newHeight = originalBottom - y;
          newX = x;
          newY = y;
        } else if (this.draggingHandle === 'top-right') {
          newWidth = x - textBox.x;
          newHeight = originalBottom - y;
          newY = y;
        } else if (this.draggingHandle === 'bottom-left') {
          newWidth = originalRight - x;
          newHeight = y - textBox.y;
          newX = x;
        } else if (this.draggingHandle === 'bottom-right') {
          newWidth = x - textBox.x;
          newHeight = y - textBox.y;
        }

        // Enforce minimum size
        if (newWidth < MIN_SIZE) newWidth = MIN_SIZE;
        if (newHeight < MIN_SIZE) newHeight = MIN_SIZE;

        // Adjust position if width/height was constrained
        if (newWidth === MIN_SIZE && this.draggingHandle?.includes('left')) {
          newX = originalRight - MIN_SIZE;
        }
        if (newHeight === MIN_SIZE && this.draggingHandle?.includes('top')) {
          newY = originalBottom - MIN_SIZE;
        }

        textBox.x = newX;
        textBox.y = newY;
        textBox.width = newWidth;
        textBox.height = newHeight;
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
    if (
      this.hoveredAnnotationId !== null &&
      this.hoveredAnnotationId !== this.selectedAnnotationId
    ) {
      if (this.hoveredAnnotationType === 'line') {
        const hoveredLine = this.findLineById(this.hoveredAnnotationId!);
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

          // Also render arrowhead if this is an arrow
          if (
            this.hoveredAnnotationId &&
            this.isArrow(this.hoveredAnnotationId)
          ) {
            renderArrowhead(
              ctx,
              hoveredLine.x1,
              hoveredLine.y1,
              hoveredLine.x2,
              hoveredLine.y2,
              '#FAC021',
              1,
              dpr
            );
          }
        }
      } else if (this.hoveredAnnotationType === 'rectangle') {
        const hoveredRect = this.rectangleAnnotations.find(
          (r) => r.id === this.hoveredAnnotationId
        );
        if (hoveredRect) {
          ctx.save();
          ctx.strokeStyle = '#FAC021';
          ctx.lineWidth = 1 * dpr;
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.rect(
            hoveredRect.x,
            hoveredRect.y,
            hoveredRect.width,
            hoveredRect.height
          );
          ctx.stroke();
          ctx.restore();
        }
      } else if (this.hoveredAnnotationType === 'text') {
        const hoveredText = this.textAnnotations.find(
          (t) => t.id === this.hoveredAnnotationId
        );
        if (hoveredText) {
          ctx.save();
          ctx.globalAlpha = 0.4;
          ctx.strokeStyle = hoveredText.color;
          ctx.lineWidth = 2 * dpr;
          ctx.strokeRect(
            hoveredText.x,
            hoveredText.y,
            hoveredText.width,
            hoveredText.height
          );
          ctx.restore();
        }
      }
    }

    // Render handles for selected annotation
    if (this.selectedAnnotationId === null) return;

    if (this.selectedAnnotationType === 'line') {
      const selectedLine = this.findLineById(this.selectedAnnotationId);
      if (selectedLine) {
        renderHandle(ctx, selectedLine.x1, selectedLine.y1);
        renderHandle(ctx, selectedLine.x2, selectedLine.y2);
      }
    } else if (this.selectedAnnotationType === 'rectangle') {
      const selectedRect = this.rectangleAnnotations.find(
        (r) => r.id === this.selectedAnnotationId
      );
      if (selectedRect) {
        // Draw corner handles
        renderHandle(ctx, selectedRect.x, selectedRect.y); // top-left
        renderHandle(ctx, selectedRect.x + selectedRect.width, selectedRect.y); // top-right
        renderHandle(ctx, selectedRect.x, selectedRect.y + selectedRect.height); // bottom-left
        renderHandle(
          ctx,
          selectedRect.x + selectedRect.width,
          selectedRect.y + selectedRect.height
        ); // bottom-right
      }
    } else if (this.selectedAnnotationType === 'text') {
      const selectedText = this.textAnnotations.find(
        (t) => t.id === this.selectedAnnotationId
      );
      if (selectedText) {
        // Draw border at full opacity
        ctx.save();
        ctx.strokeStyle = selectedText.color;
        ctx.lineWidth = 2 * dpr;
        ctx.strokeRect(
          selectedText.x,
          selectedText.y,
          selectedText.width,
          selectedText.height
        );
        ctx.restore();

        // Draw corner handles
        renderHandle(ctx, selectedText.x, selectedText.y); // top-left
        renderHandle(ctx, selectedText.x + selectedText.width, selectedText.y); // top-right
        renderHandle(ctx, selectedText.x, selectedText.y + selectedText.height); // bottom-left
        renderHandle(
          ctx,
          selectedText.x + selectedText.width,
          selectedText.y + selectedText.height
        ); // bottom-right
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
    const t = Math.max(
      0,
      Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared)
    );
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    // Calculate distance from point to projection
    const distance = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);

    // Check if point is on the line
    if (distance <= threshold) {
      return true;
    }

    // If this is an arrow, also check if point is near the arrowhead
    if (this.isArrow(line.id)) {
      return this.isPointOnArrowhead(px, py, line);
    }

    return false;
  }

  private isPointOnArrowhead(
    px: number,
    py: number,
    line: LineAnnotation
  ): boolean {
    const { x1, y1, x2, y2, width } = line;
    const threshold = width + 2;
    const dpr = window.devicePixelRatio || 1;

    // Get arrowhead points using utility
    const { point1, point2 } = getArrowheadPoints(x1, y1, x2, y2, dpr);

    // Check if point is near either arrowhead line
    return (
      this.isPointNearLineSegment(
        px,
        py,
        x2,
        y2,
        point1.x,
        point1.y,
        threshold
      ) ||
      this.isPointNearLineSegment(px, py, x2, y2, point2.x, point2.y, threshold)
    );
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

    const t = Math.max(
      0,
      Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared)
    );
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    const distance = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
    return distance <= threshold;
  }

  private isPointOnRectangle(
    px: number,
    py: number,
    rectangle: RectangleAnnotation
  ): boolean {
    const { x, y, width, height, strokeWidth } = rectangle;
    const threshold = strokeWidth + 2;

    // Check if point is near any of the four edges
    const nearLeft =
      Math.abs(px - x) <= threshold &&
      py >= y - threshold &&
      py <= y + height + threshold;
    const nearRight =
      Math.abs(px - (x + width)) <= threshold &&
      py >= y - threshold &&
      py <= y + height + threshold;
    const nearTop =
      Math.abs(py - y) <= threshold &&
      px >= x - threshold &&
      px <= x + width + threshold;
    const nearBottom =
      Math.abs(py - (y + height)) <= threshold &&
      px >= x - threshold &&
      px <= x + width + threshold;

    return nearLeft || nearRight || nearTop || nearBottom;
  }

  private isPointOnTextBox(
    px: number,
    py: number,
    textBox: TextAnnotation
  ): boolean {
    const { x, y, width, height } = textBox;

    // For text boxes, detect hover anywhere inside the box (not just on the border)
    // This allows the border to appear when hovering over text content
    return px >= x && px <= x + width && py >= y && py <= y + height;
  }
}
