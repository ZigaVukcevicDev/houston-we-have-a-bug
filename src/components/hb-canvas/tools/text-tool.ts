import type { Tool } from '../../../interfaces/tool.interface';
import type { TextAnnotation } from '../../../interfaces/annotation.interface';
import { toolStyles } from './tool-styles';
import { getCanvasCoordinates } from '../../../utils/get-canvas-coordinates';

export class TextTool implements Tool {
  private annotations: TextAnnotation[];
  private textArea: HTMLTextAreaElement | null = null;
  private readonly color: string = toolStyles.color;
  private readonly fontSize: number = toolStyles.fontSize;
  private onRedraw: () => void;
  private onToolChange: (tool: string, annotationId?: string) => void;

  // Drawing state
  private isDrawing: boolean = false;
  private startPoint: { x: number; y: number } | null = null;
  private currentBox: { x: number; y: number; width: number; height: number } | null = null;

  constructor(annotations: TextAnnotation[], onRedraw: () => void, onToolChange: (tool: string, annotationId?: string) => void) {
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

    // If there's an active textarea, finalize it before starting a new box
    if (this.textArea) {
      this.finalizeTextArea();
    }

    // Start drawing new text box
    this.isDrawing = true;
    this.startPoint = { x, y };
    this.currentBox = { x, y, width: 0, height: 0 };
  }

  handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const { x, y } = getCanvasCoordinates(event, canvas);

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
    // End drawing
    if (!this.isDrawing || !this.currentBox) return;

    this.isDrawing = false;

    // Only create textarea if box has minimum size
    if (this.currentBox.width > 10 && this.currentBox.height > 10) {
      // Create the annotation immediately
      const newAnnotation = {
        id: crypto.randomUUID(),
        x: this.currentBox.x,
        y: this.currentBox.y,
        width: this.currentBox.width,
        height: this.currentBox.height,
        text: '', // Start with empty text
        color: this.color,
        fontSize: this.fontSize,
      };

      // IMPORTANT: Use push() to modify the shared array reference
      this.annotations.push(newAnnotation);

      // Create textarea for editing
      this.createTextArea(canvas, this.currentBox);

      // Store the annotation ID in the textarea for later updates
      this.textArea!.dataset.annotationId = newAnnotation.id;

      // Switch to select tool and select the annotation (shows handles)
      this.onToolChange('select', newAnnotation.id);
      this.onRedraw();
    } else {
      // Box too small, clear state
      this.currentBox = null;
      this.startPoint = null;
    }

    this.startPoint = null;
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
      border: ${borderWidth}px solid transparent;
      border-radius: 4px;
      outline: none;
      padding: 10px;
      resize: none;
      overflow: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
      z-index: 10000;
      pointer-events: none;
    `;

    this.textArea.dataset.canvasX = box.x.toString();
    this.textArea.dataset.canvasY = box.y.toString();
    this.textArea.dataset.canvasWidth = box.width.toString();
    this.textArea.dataset.canvasHeight = box.height.toString();
    this.textArea.dataset.color = this.color;
    this.textArea.dataset.fontSize = this.fontSize.toString();

    document.body.appendChild(this.textArea);

    // Focus the textarea to allow immediate typing
    this.textArea.focus();

    // Start with pointer-events none to allow handle clicks
    // Will be enabled temporarily when user hovers content area
    this.textArea.style.pointerEvents = 'none';

    // Add focus event to ensure textarea can receive keyboard input even with pointer-events: none
    this.textArea.addEventListener('focus', () => {
      // When focused, briefly enable pointer events to allow text selection
      // but cursor position is already set by focus()
    });

    this.textArea.addEventListener('keydown', this.handleTextAreaKeydown);
    this.textArea.addEventListener('blur', this.handleTextAreaBlur);
  }

  private handleTextAreaKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();

      // Remove the annotation on Escape
      const annotationId = this.textArea?.dataset.annotationId;
      if (annotationId) {
        const index = this.annotations.findIndex(a => a.id === annotationId);
        if (index !== -1) {
          this.annotations.splice(index, 1);
        }
      }

      this.removeTextArea();
      this.currentBox = null;
      this.onRedraw();
    }
    // Don't finalize on Enter - allow multiline text
  };

  private handleTextAreaBlur = () => {
    setTimeout(() => this.finalizeTextArea(), 100);
  };

  private finalizeTextArea() {
    if (!this.textArea) return;

    const annotationId = this.textArea.dataset.annotationId;
    const text = this.textArea.value.trim();

    if (annotationId) {
      // Find and update the existing annotation
      const annotation = this.annotations.find(a => a.id === annotationId);
      if (annotation) {
        if (text) {
          // Update the annotation with the entered text
          annotation.text = text;
        } else {
          // Remove annotation if no text was entered
          const index = this.annotations.findIndex(a => a.id === annotationId);
          if (index !== -1) {
            this.annotations.splice(index, 1);
          }
        }
      }
    }

    this.removeTextArea();
    this.currentBox = null;  // Clear drawing box state
    this.onRedraw();
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

  // Called when switching away from text tool
  deactivate(): void {
    if (this.textArea) {
      this.finalizeTextArea();
    }
  }
}
