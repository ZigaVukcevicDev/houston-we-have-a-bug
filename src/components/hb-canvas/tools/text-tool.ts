import { ITool } from './base-tool';
import type { TextAnnotation } from '../types';
import { TOOL_DEFAULTS } from './constants';

export class TextTool implements ITool {
  private annotations: TextAnnotation[] = [];
  private textInput: HTMLInputElement | null = null;
  private readonly color: string = TOOL_DEFAULTS.COLOR;
  private readonly fontSize: number = TOOL_DEFAULTS.FONT_SIZE;
  private onRedraw: () => void;

  constructor(onRedraw: () => void) {
    this.onRedraw = onRedraw;
  }

  handleClick(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    if (this.textInput) {
      this._finalizeTextInput();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    this._createTextInput(x, y, rect, scaleX, scaleY);
  }

  handleMouseDown(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    // Text tool doesn't use mouse down
  }

  handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    // Text tool doesn't use mouse move
  }

  handleMouseUp(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    // Text tool doesn't use mouse up
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.annotations.forEach((annotation) => {
      ctx.font = `bold ${annotation.fontSize}px Arial, sans-serif`;
      ctx.fillStyle = annotation.color;
      ctx.textBaseline = 'middle';
      ctx.fillText(annotation.text, annotation.x, annotation.y);
    });
  }

  private _createTextInput(
    canvasX: number,
    canvasY: number,
    rect: DOMRect,
    scaleX: number,
    scaleY: number
  ) {
    this.textInput = document.createElement('input');
    this.textInput.type = 'text';
    this.textInput.style.cssText = `
      position: fixed;
      left: ${canvasX / scaleX + rect.left}px;
      top: ${canvasY / scaleY + rect.top - this.fontSize / 2}px;
      font-size: ${this.fontSize / scaleY}px;
      font-family: Arial, sans-serif;
      font-weight: bold;
      color: ${this.color};
      background: rgba(255, 255, 255, 0.9);
      border: 2px dashed #333;
      outline: none;
      padding: 2px 4px;
      min-width: 100px;
      z-index: 10000;
    `;

    this.textInput.dataset.canvasX = canvasX.toString();
    this.textInput.dataset.canvasY = canvasY.toString();
    this.textInput.dataset.color = this.color;
    this.textInput.dataset.fontSize = this.fontSize.toString();

    document.body.appendChild(this.textInput);
    this.textInput.focus();

    this.textInput.addEventListener('keydown', this._handleTextInputKeydown);
    this.textInput.addEventListener('blur', this._handleTextInputBlur);
  }

  private _handleTextInputKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      this._finalizeTextInput();
    } else if (e.key === 'Escape') {
      this._removeTextInput();
    }
  };

  private _handleTextInputBlur = () => {
    setTimeout(() => this._finalizeTextInput(), 100);
  };

  private _finalizeTextInput() {
    if (!this.textInput) return;

    const text = this.textInput.value.trim();
    if (text) {
      const x = parseFloat(this.textInput.dataset.canvasX || '0');
      const y = parseFloat(this.textInput.dataset.canvasY || '0');
      const annotationColor = this.textInput.dataset.color || this.color;
      const annotationFontSize = parseInt(
        this.textInput.dataset.fontSize || this.fontSize.toString(),
        10
      );

      this.annotations = [
        ...this.annotations,
        {
          x,
          y,
          text,
          color: annotationColor,
          fontSize: annotationFontSize,
        },
      ];

      this.onRedraw();
    }

    this._removeTextInput();
  }

  private _removeTextInput() {
    if (this.textInput && this.textInput.parentNode) {
      this.textInput.removeEventListener('keydown', this._handleTextInputKeydown);
      this.textInput.removeEventListener('blur', this._handleTextInputBlur);
      this.textInput.parentNode.removeChild(this.textInput);
    }
    this.textInput = null;
  }
}
