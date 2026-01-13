import type { Tool } from '../../../interfaces/tool.interface';
import type { TextAnnotation } from '../../../interfaces/annotation.interface';
import { toolStyles } from './tool-styles';
import { getCanvasCoordinates } from '../../../utils/get-canvas-coordinates';
import { renderHandle } from '../../../utils/render-handle';

export class TextTool implements Tool {
  private annotations: TextAnnotation[];
  private textArea: HTMLTextAreaElement | null = null;
  private readonly color: string = toolStyles.color;
  private readonly fontSize: number = toolStyles.fontSize;
  private onRedraw: () => void;

  // Drawing state
  private isDrawing: boolean = false;
  private startPoint: { x: number; y: number } | null = null;
  private currentBox: { x: number; y: number; width: number; height: number } | null = null;

  constructor(annotations: TextAnnotation[], onRedraw: () => void) {
    this.annotations = annotations;
    this.onRedraw = onRedraw;
  }

  handleClick(_event: MouseEvent, _canvas: HTMLCanvasElement): void {
    // Text tool now uses mousedown/mousemove/mouseup pattern
    // Click is no longer used
  }

  handleMouseDown(event: MouseEvent, canvas: HTMLCanvasElement): void {
    // If there's an active textarea, finalize it first
    if (this.textArea) {
      this.finalizeTextArea();
      return;
    }

    const { x, y } = getCanvasCoordinates(event, canvas);
    this.isDrawing = true;
    this.startPoint = { x, y };
    this.currentBox = { x, y, width: 0, height: 0 };
  }

  handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement): void {
    if (!this.isDrawing || !this.startPoint) return;

    const { x, y } = getCanvasCoordinates(event, canvas);

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
    if (!this.isDrawing || !this.currentBox) return;

    this.isDrawing = false;

    // Only create textarea if box has minimum size
    if (this.currentBox.width > 10 && this.currentBox.height > 10) {
      this.createTextArea(canvas, this.currentBox);
    }

    this.currentBox = null;
    this.startPoint = null;
    this.onRedraw();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const dpr = window.devicePixelRatio || 1;

    // Render saved annotations
    this.annotations.forEach((annotation) => {
      this.renderTextBox(ctx, annotation, dpr);
    });

    // Render current drawing box
    if (this.currentBox && this.currentBox.width > 0 && this.currentBox.height > 0) {
      ctx.save();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2 * dpr;
      ctx.strokeRect(
        this.currentBox.x,
        this.currentBox.y,
        this.currentBox.width,
        this.currentBox.height
      );
      ctx.restore();
    }
  }

  private renderTextBox(ctx: CanvasRenderingContext2D, annotation: TextAnnotation, dpr: number): void {
    // Draw rectangle border
    ctx.save();
    ctx.strokeStyle = annotation.color;
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
    ctx.restore();

    // Draw corner handles
    const topLeft = { x: annotation.x, y: annotation.y };
    const topRight = { x: annotation.x + annotation.width, y: annotation.y };
    const bottomLeft = { x: annotation.x, y: annotation.y + annotation.height };
    const bottomRight = { x: annotation.x + annotation.width, y: annotation.y + annotation.height };

    renderHandle(ctx, topLeft.x, topLeft.y);
    renderHandle(ctx, topRight.x, topRight.y);
    renderHandle(ctx, bottomLeft.x, bottomLeft.y);
    renderHandle(ctx, bottomRight.x, bottomRight.y);

    // Render text with wrapping
    if (annotation.text) {
      ctx.save();
      ctx.font = `500 ${annotation.fontSize * dpr}px Inter`;
      ctx.fillStyle = annotation.color;
      ctx.textBaseline = 'top';
      ctx.letterSpacing = '0.01em';

      const padding = 5 * dpr;
      const maxWidth = annotation.width - padding * 2;
      const lines = this.wrapText(ctx, annotation.text, maxWidth);

      let yOffset = annotation.y + padding;
      const lineHeight = annotation.fontSize * dpr * 1.2;

      lines.forEach((line) => {
        ctx.fillText(line, annotation.x + padding, yOffset);
        yOffset += lineHeight;
      });

      ctx.restore();
    }
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
  }

  private createTextArea(canvas: HTMLCanvasElement, box: { x: number; y: number; width: number; height: number }): void {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Border width adjustment: CSS border is applied outside the box,
    // but strokeRect centers the stroke on the path. We need to adjust
    // position and size to match the visual appearance exactly.
    const borderWidth = 2;

    this.textArea = document.createElement('textarea');
    this.textArea.style.cssText = `
      position: fixed;
      left: ${(box.x - borderWidth) / scaleX + rect.left}px;
      top: ${(box.y - borderWidth) / scaleY + rect.top}px;
      width: ${(box.width + borderWidth * 2) / scaleX}px;
      height: ${(box.height + borderWidth * 2) / scaleY}px;
      font-size: ${this.fontSize}px;
      font-family: Inter;
      font-weight: 500;
      letter-spacing: 0.01em;
      color: ${this.color};
      background: rgba(255, 255, 255, 0.9);
      border: ${borderWidth}px solid ${this.color};
      outline: none;
      padding: 5px;
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
  }

  private removeTextArea() {
    if (this.textArea && this.textArea.parentNode) {
      this.textArea.removeEventListener('keydown', this.handleTextAreaKeydown);
      this.textArea.removeEventListener('blur', this.handleTextAreaBlur);
      this.textArea.parentNode.removeChild(this.textArea);
    }
    this.textArea = null;
  }
}
