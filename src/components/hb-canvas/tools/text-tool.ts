import type { Tool } from '../../../interfaces/tool.interface';
import type { TextAnnotation } from '../../../interfaces/annotation.interface';
import { toolStyles } from './tool-styles';
import { getCanvasCoordinates } from '../../../utils/get-canvas-coordinates';

export class TextTool implements Tool {
  private annotations: TextAnnotation[];
  private textDiv: HTMLDivElement | null = null;
  private readonly color: string = toolStyles.color;
  private readonly fontSize: number = toolStyles.fontSize;
  private onRedraw: () => void;
  private onToolChange: (tool: string, annotationId?: string) => void;

  // Drawing state
  private isDrawing: boolean = false;
  private startPoint: { x: number; y: number } | null = null;
  private currentBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;
  private keepTextDivActive: boolean = false;
  private hasExceededMinimum: boolean = false; // Track if drag exceeded minimum dimensions

  constructor(
    annotations: TextAnnotation[],
    onRedraw: () => void,
    onToolChange: (tool: string, annotationId?: string) => void
  ) {
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

    // If there's an active text div, finalize it before starting a new box
    if (this.textDiv) {
      const annotationId = this.textDiv.dataset.annotationId;
      this.finalizeTextDiv();

      // Remove the previous annotation if it was empty (when creating new box)
      if (annotationId) {
        const annotation = this.annotations.find((a) => a.id === annotationId);
        if (annotation && !annotation.text) {
          const index = this.annotations.findIndex(
            (a) => a.id === annotationId
          );
          if (index !== -1) {
            this.annotations.splice(index, 1);
          }
        }
      }
    }

    // Start drawing new text box
    this.isDrawing = true;
    this.hasExceededMinimum = false;
    this.startPoint = { x, y };
    this.currentBox = { x, y, width: 0, height: 0 };
  }

  handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const { x, y } = getCanvasCoordinates(event, canvas);

    // Handle drawing new text box
    if (!this.isDrawing || !this.startPoint) return;

    const MIN_WIDTH = 40;
    const MIN_HEIGHT = 60;

    const rawWidth = Math.max(0, x - this.startPoint.x);
    const rawHeight = Math.max(0, y - this.startPoint.y);

    // Once drag exceeds minimum dimensions, start enforcing them
    if (rawWidth >= MIN_WIDTH && rawHeight >= MIN_HEIGHT) {
      this.hasExceededMinimum = true;
    }

    // If minimum was exceeded, enforce it; otherwise show actual drag size
    const width = this.hasExceededMinimum
      ? Math.max(MIN_WIDTH, rawWidth)
      : rawWidth;
    const height = this.hasExceededMinimum
      ? Math.max(MIN_HEIGHT, rawHeight)
      : rawHeight;

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

    // Only create text box if minimum dimensions were exceeded during drawing
    if (!this.hasExceededMinimum) {
      this.currentBox = null;
      this.startPoint = null;
      this.onRedraw();
      return;
    }

    // Create the annotation (minimum is already enforced in currentBox)
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

    // Create text div for editing
    this.createTextDiv(canvas, this.currentBox);

    // Store the annotation ID in the text div for later updates
    this.textDiv!.dataset.annotationId = newAnnotation.id;

    // Keep text div active when switching to select tool
    this.keepTextDivActive = true;

    // Switch to select tool and select the annotation (shows handles)
    this.onToolChange('select', newAnnotation.id);
    this.onRedraw();

    this.currentBox = null;
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

    // Render saved annotations (skip the one being edited to avoid double rendering)
    const editingId = this.getEditingAnnotationId();
    this.annotations.forEach((annotation) => {
      // Skip rendering text for the annotation being edited (textDiv shows it instead)
      if (annotation.id === editingId) return;
      this.renderTextBox(ctx, annotation, scaleX, scaleY);
    });

    // Render current drawing box border (also when textarea is active, since textarea has no border)
    if (
      this.currentBox &&
      this.currentBox.width > 0 &&
      this.currentBox.height > 0
    ) {
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

  private renderTextBox(
    ctx: CanvasRenderingContext2D,
    annotation: TextAnnotation,
    scaleX: number,
    scaleY: number
  ): void {
    // Border rendering is handled by SelectTool based on selection/hover state
    // Text tool only renders the text content

    // Render text with wrapping
    if (annotation.text) {
      ctx.save();
      // Scale font size to match canvas coordinate system
      ctx.font = `500 ${annotation.fontSize * scaleX}px Inter`;
      // Use a slightly darker color for text to compensate for anti-aliasing making it appear lighter
      ctx.fillStyle = this.darkenColor(annotation.color, 0.02);
      ctx.textBaseline = 'alphabetic';
      ctx.letterSpacing = '0.01em';

      // Scale measurements to match canvas coordinate system
      // IMPORTANT: Use scaleX for horizontal, scaleY for vertical
      const borderWidthX = 2 * scaleX;
      const borderWidthY = 2 * scaleY;
      const borderOffsetX = borderWidthX / 2;
      const borderOffsetY = borderWidthY / 2;
      const textPaddingX = 5 * scaleX;
      const textPaddingY = 5 * scaleY;

      // Text starts at: box edge + border inner offset + padding
      const textStartOffsetX = borderOffsetX + textPaddingX;
      const textStartOffsetY = borderOffsetY + textPaddingY;

      const maxWidth = annotation.width - textStartOffsetX * 2;
      const lines = this.wrapText(ctx, annotation.text, maxWidth);

      // With alphabetic baseline, we need to position at the baseline
      // CSS line-height creates a line box and centers text within it
      // For alphabetic baseline: start Y + (lineHeight - fontSize)/2 + ascent
      const cssLineHeight = annotation.fontSize * 1.2;
      const lineHeightCanvas = cssLineHeight * scaleY;
      const fontSizeCanvas = annotation.fontSize * scaleY;
      const halfLeadingCanvas = (lineHeightCanvas - fontSizeCanvas) / 2;

      // Ascent is approximately 0.75-0.8 of fontSize for most fonts
      // For Inter, it's closer to 0.9
      const ascentRatio = 0.9;
      const ascentCanvas = fontSizeCanvas * ascentRatio;

      let yOffset =
        annotation.y + textStartOffsetY + halfLeadingCanvas + ascentCanvas;

      lines.forEach((line) => {
        ctx.fillText(line, annotation.x + textStartOffsetX, yOffset);
        yOffset += lineHeightCanvas;
      });

      ctx.restore();
    }
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    // Split by newlines first to preserve multi-line text
    const paragraphs = text.split('\n');
    const allLines: string[] = [];

    paragraphs.forEach((paragraph) => {
      // For each paragraph, wrap by word if needed
      const words = paragraph.split(' ');
      let currentLine = '';

      words.forEach((word) => {
        // Check if the word itself is too long
        const wordMetrics = ctx.measureText(word);

        if (wordMetrics.width > maxWidth) {
          // Push current line if it has content
          if (currentLine) {
            allLines.push(currentLine);
            currentLine = '';
          }

          // Break the long word character by character
          let remainingWord = word;
          while (remainingWord) {
            let charLine = '';
            for (let i = 0; i < remainingWord.length; i++) {
              const testChar = charLine + remainingWord[i];
              const charMetrics = ctx.measureText(testChar);

              if (charMetrics.width > maxWidth && charLine) {
                break;
              }
              charLine = testChar;
            }

            // charLine always has at least the first character because the
            // break condition above requires charLine to be non-empty
            allLines.push(charLine);
            remainingWord = remainingWord.slice(charLine.length);
          }
        } else {
          // Word fits, try to add it to current line
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const metrics = ctx.measureText(testLine);

          if (metrics.width > maxWidth && currentLine) {
            allLines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
      });

      if (currentLine || paragraph === '') {
        // Push even empty lines to preserve blank lines
        allLines.push(currentLine);
      }
    });

    return allLines.length > 0 ? allLines : [''];
  }

  private createTextDiv(
    canvas: HTMLCanvasElement,
    box: { x: number; y: number; width: number; height: number }
  ): void {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Calculate border offset in canvas coordinates to match canvas rendering
    // IMPORTANT: Use separate offsets for X and Y to match their respective scales
    const borderWidth = 2;
    const borderOffsetCanvasX = (borderWidth / 2) * scaleX;
    const borderOffsetCanvasY = (borderWidth / 2) * scaleY;

    this.textDiv = document.createElement('div');
    this.textDiv.contentEditable = 'true';
    this.textDiv.className = 'hb-text-annotation-input';

    // Add selection styling if not already present
    if (!document.getElementById('hb-text-selection-style')) {
      const style = document.createElement('style');
      style.id = 'hb-text-selection-style';
      style.textContent = `
        .hb-text-annotation-input::selection,
        .hb-text-annotation-input *::selection {
          background-color: #FFD257 !important;
          color: #000000 !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Apply darkened color for better visibility
    const darkenedColor = this.darkenColor(this.color, 0.02);

    this.textDiv.style.cssText = `
      position: fixed;
      box-sizing: border-box;
      left: ${(box.x - borderOffsetCanvasX) / scaleX + rect.left}px;
      top: ${(box.y - borderOffsetCanvasY) / scaleY + rect.top}px;
      width: ${(box.width + borderOffsetCanvasX * 2) / scaleX}px;
      max-width: ${(box.width + borderOffsetCanvasX * 2) / scaleX}px;
      height: ${(box.height + borderOffsetCanvasY * 2) / scaleY}px;
      margin: 0;
      font-size: ${this.fontSize}px;
      font-family: Inter;
      font-weight: 500;
      letter-spacing: 0.01em;
      line-height: 1.2;
      color: ${darkenedColor};
      caret-color: ${darkenedColor};
      background: transparent;
      border: ${borderWidth}px solid transparent;
      border-radius: 4px;
      outline: none;
      padding: 5px;
      white-space: pre-wrap;
      overflow-wrap: break-word;
      word-break: break-word;
      z-index: 10000;
      pointer-events: none;
    `;

    this.textDiv.dataset.canvasX = box.x.toString();
    this.textDiv.dataset.canvasY = box.y.toString();
    this.textDiv.dataset.canvasWidth = box.width.toString();
    this.textDiv.dataset.canvasHeight = box.height.toString();
    this.textDiv.dataset.color = this.color;
    this.textDiv.dataset.fontSize = this.fontSize.toString();

    document.body.appendChild(this.textDiv);

    // Focus the div to allow immediate typing
    this.textDiv.focus();

    // Start with pointer-events none to allow handle clicks
    // Will be enabled when user clicks in the content area
    this.textDiv.style.pointerEvents = 'none';

    this.textDiv.addEventListener('keydown', this.handleTextDivKeydown);
    this.textDiv.addEventListener('blur', this.handleTextDivBlur);
  }

  private handleTextDivKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();

      // Remove the annotation on Escape
      const annotationId = this.textDiv?.dataset.annotationId;
      if (annotationId) {
        const index = this.annotations.findIndex((a) => a.id === annotationId);
        if (index !== -1) {
          this.annotations.splice(index, 1);
        }
      }

      this.removeTextDiv();
      this.currentBox = null;
      this.onRedraw();
      return;
    }

    // Enable pointer-events after user starts typing (allows clicking inside to position cursor)
    if (this.textDiv && this.textDiv.style.pointerEvents === 'none') {
      this.textDiv.style.pointerEvents = 'auto';
    }
  };

  private handleTextDivBlur = () => {
    setTimeout(() => this.finalizeTextDiv(), 100);
  };

  private finalizeTextDiv() {
    if (!this.textDiv) return;

    const annotationId = this.textDiv.dataset.annotationId;
    // Use innerText to preserve newlines from Enter key presses
    const text = this.textDiv.innerText?.trim() || '';

    if (annotationId) {
      // Find and update the existing annotation
      const annotation = this.annotations.find((a) => a.id === annotationId);
      if (annotation) {
        // Update the annotation text (even if empty - user can delete with Escape/Delete)
        // Don't remove empty annotations here as it interferes with resize operations
        annotation.text = text;
      }
    }

    this.removeTextDiv();
    this.currentBox = null; // Clear drawing box state
    this.onRedraw();
  }

  private removeTextDiv() {
    if (this.textDiv) {
      this.textDiv.removeEventListener('keydown', this.handleTextDivKeydown);
      this.textDiv.removeEventListener('blur', this.handleTextDivBlur);
      // Use remove() instead of parentNode.removeChild for compatibility
      if (this.textDiv.parentNode) {
        this.textDiv.parentNode.removeChild(this.textDiv);
      }
      this.textDiv = null;
    }
  }

  private darkenColor(hex: string, amount: number): string {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse RGB values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Darken by reducing each channel
    const darkenedR = Math.max(0, Math.floor(r * (1 - amount)));
    const darkenedG = Math.max(0, Math.floor(g * (1 - amount)));
    const darkenedB = Math.max(0, Math.floor(b * (1 - amount)));

    // Convert back to hex
    return `#${darkenedR.toString(16).padStart(2, '0')}${darkenedG.toString(16).padStart(2, '0')}${darkenedB.toString(16).padStart(2, '0')}`;
  }

  // Called when switching away from text tool
  deactivate(): void {
    // Don't finalize if we want to keep the text div active (e.g., when switching to select tool)
    if (this.keepTextDivActive) {
      this.keepTextDivActive = false;
      return;
    }

    if (this.textDiv) {
      this.finalizeTextDiv();
    }
  }

  // Public method to check if text editing is currently active
  isTextEditingActive(): boolean {
    return this.textDiv !== null && document.activeElement === this.textDiv;
  }

  // Public method to get the annotation ID being edited
  getEditingAnnotationId(): string | null {
    return this.textDiv?.dataset.annotationId || null;
  }

  // Public method to start editing an existing annotation
  startEditingAnnotation(
    annotationId: string,
    canvas: HTMLCanvasElement
  ): void {
    const annotation = this.annotations.find((a) => a.id === annotationId);
    if (!annotation) return;

    // If there's already an active text div, finalize it first
    if (this.textDiv) {
      this.finalizeTextDiv();
    }

    // Create the text div for this annotation
    const box = {
      x: annotation.x,
      y: annotation.y,
      width: annotation.width,
      height: annotation.height,
    };

    this.createTextDiv(canvas, box);

    if (this.textDiv) {
      // Set the annotation ID so changes are saved back to the annotation
      this.textDiv.dataset.annotationId = annotationId;

      // Set the existing text content
      this.textDiv.innerText = annotation.text || '';

      // Enable pointer events for editing
      this.textDiv.style.pointerEvents = 'auto';

      // Move cursor to end of text
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(this.textDiv);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    this.onRedraw();
  }
}
