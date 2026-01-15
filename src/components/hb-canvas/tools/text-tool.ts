import type { Tool } from '../../../interfaces/tool.interface';
import type { TextAnnotation } from '../../../interfaces/annotation.interface';
import { toolStyles } from './tool-styles';
import { getCanvasCoordinates } from '../../../utils/get-canvas-coordinates';
import { renderHandle, isPointOnHandle } from '../../../utils/render-handle';

export class TextTool implements Tool {
  private annotations: TextAnnotation[];
  private textArea: HTMLTextAreaElement | null = null;
  private readonly color: string = toolStyles.color;
  private readonly fontSize: number = toolStyles.fontSize;
  private onRedraw: () => void;
  private onToolChange: (tool: string) => void;

  // Drawing state
  private isDrawing: boolean = false;
  private startPoint: { x: number; y: number } | null = null;
  private currentBox: { x: number; y: number; width: number; height: number } | null = null;

  // Resize state for active textarea
  private resizingHandle: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null = null;
  private resizeStartBox: { x: number; y: number; width: number; height: number } | null = null;

  constructor(annotations: TextAnnotation[], onRedraw: () => void, onToolChange: (tool: string) => void) {
    this.annotations = annotations;
    this.onRedraw = onRedraw;
    this.onToolChange = onToolChange;
  }

  handleClick(_event: MouseEvent, _canvas: HTMLCanvasElement): void {
    // Text tool now uses mousedown/mousemove/mouseup pattern
    // Click is no longer used
  }

  handleMouseDown(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const { x, y } = getCanvasCoordinates(event, canvas);

    // If there's an active textarea, check if clicking on resize handles
    if (this.textArea) {
      // If currentBox exists, check for handle clicks (resize mode)
      if (this.currentBox) {
        const topLeft = { x: this.currentBox.x, y: this.currentBox.y };
        const topRight = { x: this.currentBox.x + this.currentBox.width, y: this.currentBox.y };
        const bottomLeft = { x: this.currentBox.x, y: this.currentBox.y + this.currentBox.height };
        const bottomRight = { x: this.currentBox.x + this.currentBox.width, y: this.currentBox.y + this.currentBox.height };

        // Check each corner handle
        if (isPointOnHandle(x, y, topLeft.x, topLeft.y)) {
          this.resizingHandle = 'top-left';
          this.resizeStartBox = { ...this.currentBox };
          return;
        }
        if (isPointOnHandle(x, y, topRight.x, topRight.y)) {
          this.resizingHandle = 'top-right';
          this.resizeStartBox = { ...this.currentBox };
          return;
        }
        if (isPointOnHandle(x, y, bottomLeft.x, bottomLeft.y)) {
          this.resizingHandle = 'bottom-left';
          this.resizeStartBox = { ...this.currentBox };
          return;
        }
        if (isPointOnHandle(x, y, bottomRight.x, bottomRight.y)) {
          this.resizingHandle = 'bottom-right';
          this.resizeStartBox = { ...this.currentBox };
          return;
        }
      }

      // Click outside handles (or no currentBox) - finalize the textarea
      this.finalizeTextArea();
      return;
    }

    // No active textarea - start drawing new text box
    this.isDrawing = true;
    this.startPoint = { x, y };
    this.currentBox = { x, y, width: 0, height: 0 };
  }

  handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const { x, y } = getCanvasCoordinates(event, canvas);

    // Handle resizing active textarea
    if (this.resizingHandle && this.currentBox && this.textArea) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      // Store original bounds for calculation
      const originalRight = this.currentBox.x + this.currentBox.width;
      const originalBottom = this.currentBox.y + this.currentBox.height;

      // Minimum size constraints
      const MIN_SIZE = 50;

      // Resize based on which corner is being dragged
      if (this.resizingHandle === 'top-left') {
        this.currentBox.width = Math.max(MIN_SIZE, originalRight - x);
        this.currentBox.height = Math.max(MIN_SIZE, originalBottom - y);
        this.currentBox.x = originalRight - this.currentBox.width;
        this.currentBox.y = originalBottom - this.currentBox.height;
      } else if (this.resizingHandle === 'top-right') {
        this.currentBox.width = Math.max(MIN_SIZE, x - this.currentBox.x);
        this.currentBox.height = Math.max(MIN_SIZE, originalBottom - y);
        this.currentBox.y = originalBottom - this.currentBox.height;
      } else if (this.resizingHandle === 'bottom-left') {
        this.currentBox.width = Math.max(MIN_SIZE, originalRight - x);
        this.currentBox.height = Math.max(MIN_SIZE, y - this.currentBox.y);
        this.currentBox.x = originalRight - this.currentBox.width;
      } else if (this.resizingHandle === 'bottom-right') {
        this.currentBox.width = Math.max(MIN_SIZE, x - this.currentBox.x);
        this.currentBox.height = Math.max(MIN_SIZE, y - this.currentBox.y);
      }

      // Update textarea dimensions in real-time
      this.updateTextAreaDimensions(canvas, this.currentBox, scaleX, scaleY);
      this.onRedraw();
      return;
    }

    // Provide cursor feedback when textarea is active
    if (this.textArea && this.currentBox && !this.resizingHandle) {
      const topLeft = { x: this.currentBox.x, y: this.currentBox.y };
      const topRight = { x: this.currentBox.x + this.currentBox.width, y: this.currentBox.y };
      const bottomLeft = { x: this.currentBox.x, y: this.currentBox.y + this.currentBox.height };
      const bottomRight = { x: this.currentBox.x + this.currentBox.width, y: this.currentBox.y + this.currentBox.height };

      // Check each corner and set appropriate resize cursor
      if (isPointOnHandle(x, y, topLeft.x, topLeft.y)) {
        canvas.style.cursor = 'nwse-resize';
        return;
      }
      if (isPointOnHandle(x, y, bottomRight.x, bottomRight.y)) {
        canvas.style.cursor = 'nwse-resize';
        return;
      }
      if (isPointOnHandle(x, y, topRight.x, topRight.y)) {
        canvas.style.cursor = 'nesw-resize';
        return;
      }
      if (isPointOnHandle(x, y, bottomLeft.x, bottomLeft.y)) {
        canvas.style.cursor = 'nesw-resize';
        return;
      }

      // Over textarea content area - show text cursor
      if (x >= this.currentBox.x && x <= this.currentBox.x + this.currentBox.width &&
        y >= this.currentBox.y && y <= this.currentBox.y + this.currentBox.height) {
        canvas.style.cursor = 'text';
        return;
      }

      // Default cursor
      canvas.style.cursor = '';
      return;
    }

    // Handle drawing new text box
    if (!this.isDrawing || !this.startPoint) return;

    // Constrain to only right and down
    // Use minimum size (2px) to show user can't go left/up
    const MIN_SIZE = 2;
    const width = Math.max(MIN_SIZE, x - this.startPoint.x);
    const height = Math.max(MIN_SIZE, y - this.startPoint.y);

    this.currentBox = {
      x: this.startPoint.x,
      y: this.startPoint.y,
      width,
      height,
    };

    this.onRedraw();
  }

  handleMouseUp(event: MouseEvent, canvas: HTMLCanvasElement): void {
    // End resizing
    if (this.resizingHandle) {
      this.resizingHandle = null;
      this.resizeStartBox = null;
      this.onRedraw();
      return;
    }

    // End drawing
    if (!this.isDrawing || !this.currentBox) return;

    this.isDrawing = false;

    // Only create textarea if box has minimum size
    if (this.currentBox.width > 10 && this.currentBox.height > 10) {
      this.createTextArea(canvas, this.currentBox);
      // Don't switch tools yet - allow resizing via handles
      // Tool will switch to select when textarea is finalized
    } else {
      // Box too small, clear state
      this.currentBox = null;
      this.startPoint = null;
    }

    this.startPoint = null;
    this.onRedraw();
  }

  // Helper method to update textarea dimensions during resize
  private updateTextAreaDimensions(canvas: HTMLCanvasElement, box: { x: number; y: number; width: number; height: number }, scaleX: number, scaleY: number): void {
    if (!this.textArea) return;

    const rect = canvas.getBoundingClientRect();
    const borderWidth = 2;
    const borderOffsetCanvas = (borderWidth / 2) * scaleX;

    // Update textarea position and size (with borderOffset for text alignment)
    this.textArea.style.left = `${(box.x - borderOffsetCanvas) / scaleX + rect.left}px`;
    this.textArea.style.top = `${(box.y - borderOffsetCanvas) / scaleY + rect.top}px`;
    this.textArea.style.width = `${(box.width + borderOffsetCanvas * 2) / scaleX}px`;
    this.textArea.style.height = `${(box.height + borderOffsetCanvas * 2) / scaleY}px`;

    // Update dataset to reflect new dimensions
    this.textArea.dataset.canvasX = box.x.toString();
    this.textArea.dataset.canvasY = box.y.toString();
    this.textArea.dataset.canvasWidth = box.width.toString();
    this.textArea.dataset.canvasHeight = box.height.toString();
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Get the scale factor from canvas dimensions
    // This matches how coordinates are calculated in getCanvasCoordinates
    // and ensures alignment with textarea positioning
    const canvas = ctx.canvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Render saved annotations
    this.annotations.forEach((annotation) => {
      this.renderTextBox(ctx, annotation, scaleX, scaleY);
    });

    // Render current drawing box border (also when textarea is active, since textarea has no border)
    if (this.currentBox && this.currentBox.width > 0 && this.currentBox.height > 0) {
      ctx.save();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2 * scaleX;
      ctx.strokeRect(
        this.currentBox.x,
        this.currentBox.y,
        this.currentBox.width,
        this.currentBox.height
      );
      ctx.restore();
    }

    // Render handles when textarea is active (for resizing)
    if (this.textArea && this.currentBox) {
      // Render 4 corner handles
      renderHandle(ctx, this.currentBox.x, this.currentBox.y); // top-left
      renderHandle(ctx, this.currentBox.x + this.currentBox.width, this.currentBox.y); // top-right
      renderHandle(ctx, this.currentBox.x, this.currentBox.y + this.currentBox.height); // bottom-left
      renderHandle(ctx, this.currentBox.x + this.currentBox.width, this.currentBox.y + this.currentBox.height); // bottom-right
    }
  }

  private renderTextBox(ctx: CanvasRenderingContext2D, annotation: TextAnnotation, scaleX: number, scaleY: number): void {
    // Draw rectangle border
    ctx.save();
    ctx.strokeStyle = annotation.color;
    ctx.lineWidth = 2 * scaleX;
    ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
    ctx.restore();

    // Render text with wrapping
    if (annotation.text) {
      ctx.save();
      // Use scaleX for font size to match coordinate system
      ctx.font = `500 ${annotation.fontSize * scaleX}px Inter`;
      ctx.fillStyle = annotation.color;
      ctx.textBaseline = 'top';
      ctx.letterSpacing = '0.01em';

      const borderWidth = 2 * scaleX;
      const borderOffset = borderWidth / 2; // strokeRect centers the stroke
      const textareaPadding = 10 * scaleX;  // Use scaleX instead of dpr

      // Text starts at: box edge + border inner offset + textarea padding
      // strokeRect border extends borderOffset inward from the path
      const textStartOffset = borderOffset + textareaPadding;

      const maxWidth = annotation.width - textStartOffset * 2;
      const lines = this.wrapText(ctx, annotation.text, maxWidth);

      // Add 1px vertical adjustment to compensate for font metrics difference
      // between textarea rendering and canvas textBaseline: 'top'
      let yOffset = annotation.y + textStartOffset + scaleX;

      // Round line-height to prevent sub-pixel accumulation differences
      // between textarea and canvas rendering in multi-line text
      const lineHeight = Math.round(annotation.fontSize * scaleX * 1.2);

      lines.forEach((line) => {
        ctx.fillText(line, annotation.x + textStartOffset, yOffset);
        yOffset += lineHeight;
      });

      ctx.restore();
    }
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    // Split by newlines first to preserve multi-line text
    const paragraphs = text.split('\n');
    const allLines: string[] = [];

    paragraphs.forEach((paragraph) => {
      // For each paragraph, wrap by word if needed
      const words = paragraph.split(' ');
      let currentLine = '';

      words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
          allLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine || paragraph === '') {
        // Push even empty lines to preserve blank lines
        allLines.push(currentLine);
      }
    });

    return allLines.length > 0 ? allLines : [''];
  }

  private createTextArea(canvas: HTMLCanvasElement, box: { x: number; y: number; width: number; height: number }): void {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Textarea has no border, but we need to offset its position by borderWidth/2
    // to align the text with the canvas rendering which accounts for strokeRect borderOffset
    const borderWidth = 2;
    const borderOffsetCanvas = (borderWidth / 2) * scaleX; // borderOffset in canvas pixels

    this.textArea = document.createElement('textarea');
    this.textArea.style.cssText = `
      position: fixed;
      box-sizing: border-box;
      left: ${(box.x - borderOffsetCanvas) / scaleX + rect.left}px;
      top: ${(box.y - borderOffsetCanvas) / scaleY + rect.top}px;
      width: ${(box.width + borderOffsetCanvas * 2) / scaleX}px;
      height: ${(box.height + borderOffsetCanvas * 2) / scaleY}px;
      margin: 0;
      font-size: ${this.fontSize}px;
      font-family: Inter;
      font-weight: 500;
      letter-spacing: 0.01em;
      line-height: 1.2;
      color: ${this.color};
      background: transparent;
      border: none;
      border-radius: 4px;
      outline: none;
      padding: 10px;
      resize: none;
      overflow: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
      z-index: 10000;
    `;

    this.textArea.dataset.canvasX = box.x.toString();
    this.textArea.dataset.canvasY = box.y.toString();
    this.textArea.dataset.canvasWidth = box.width.toString();
    this.textArea.dataset.canvasHeight = box.height.toString();
    this.textArea.dataset.color = this.color;
    this.textArea.dataset.fontSize = this.fontSize.toString();

    document.body.appendChild(this.textArea);
    this.textArea.focus();

    this.textArea.addEventListener('keydown', this.handleTextAreaKeydown);
    this.textArea.addEventListener('blur', this.handleTextAreaBlur);
  }

  private handleTextAreaKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.removeTextArea();
    }
    // Don't finalize on Enter - allow multiline text
  };

  private handleTextAreaBlur = () => {
    setTimeout(() => this.finalizeTextArea(), 100);
  };

  private finalizeTextArea() {
    if (!this.textArea) return;

    const text = this.textArea.value.trim();
    if (text) {
      const x = parseFloat(this.textArea.dataset.canvasX || '0');
      const y = parseFloat(this.textArea.dataset.canvasY || '0');
      const width = parseFloat(this.textArea.dataset.canvasWidth || '200');
      const height = parseFloat(this.textArea.dataset.canvasHeight || '100');
      const annotationColor = this.textArea.dataset.color || this.color;
      const annotationFontSize = parseInt(
        this.textArea.dataset.fontSize || this.fontSize.toString(),
        10
      );

      this.annotations = [
        ...this.annotations,
        {
          id: crypto.randomUUID(),
          x,
          y,
          width,
          height,
          text,
          color: annotationColor,
          fontSize: annotationFontSize,
        },
      ];

      this.onRedraw();
    }

    this.removeTextArea();
    this.currentBox = null;  // Clear drawing box state

    // Switch to select tool after finalizing
    this.onToolChange('select');
  }

  private removeTextArea() {
    if (this.textArea) {
      this.textArea.removeEventListener('keydown', this.handleTextAreaKeydown);
      this.textArea.removeEventListener('blur', this.handleTextAreaBlur);
      // Use remove() instead of parentNode.removeChild for compatibility
      if (this.textArea.parentNode) {
        this.textArea.parentNode.removeChild(this.textArea);
      }
      this.textArea = null;
    }
  }
}
