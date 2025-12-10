import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import styles from './hb-annotation-canvas.scss';

interface TextAnnotation {
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

@customElement('hb-annotation-canvas')
export class HBAnnotationCanvas extends LitElement {
  static styles = unsafeCSS(styles);

  @property({ type: String })
  dataUrl: string = '';

  @property({ type: String })
  color: string = '#ff0000';

  @property({ type: Number })
  fontSize: number = 24;

  @query('canvas')
  private canvas!: HTMLCanvasElement;

  private ctx!: CanvasRenderingContext2D;
  private originalImage: HTMLImageElement | null = null;

  @state()
  private annotations: TextAnnotation[] = [];

  private textInput: HTMLInputElement | null = null;

  render() {
    return html`<canvas @click=${this._handleCanvasClick}></canvas>`;
  }

  protected firstUpdated() {
    this.ctx = this.canvas.getContext('2d')!;
    this._loadImage();
  }

  protected updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('dataUrl') && this.dataUrl) {
      this._loadImage();
    }
  }

  private async _loadImage() {
    if (!this.dataUrl) return;

    const img = new Image();
    img.onload = () => {
      this.originalImage = img;

      // Account for device pixel ratio (Retina displays)
      const dpr = window.devicePixelRatio || 1;

      // Set canvas internal resolution to full image size
      this.canvas.width = img.width;
      this.canvas.height = img.height;

      // Set canvas display size to account for DPR
      this.canvas.style.width = `${img.width / dpr}px`;
      this.canvas.style.height = `${img.height / dpr}px`;

      this._redraw();
    };
    img.src = this.dataUrl;
  }

  private _redraw() {
    if (!this.originalImage) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.originalImage, 0, 0);

    this.annotations.forEach((annotation) => {
      this.ctx.font = `bold ${annotation.fontSize}px Arial, sans-serif`;
      this.ctx.fillStyle = annotation.color;
      this.ctx.textBaseline = 'middle';

      this.ctx.fillText(annotation.text, annotation.x, annotation.y);
    });
  }

  private _handleCanvasClick(event: MouseEvent) {
    if (this.textInput) {
      this._finalizeTextInput();
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    this._createTextInput(x, y, rect, scaleX, scaleY);
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

      this._redraw();
    }

    this._removeTextInput();
  }

  private _removeTextInput() {
    if (this.textInput && this.textInput.parentNode) {
      this.textInput.removeEventListener(
        'keydown',
        this._handleTextInputKeydown
      );
      this.textInput.removeEventListener('blur', this._handleTextInputBlur);
      this.textInput.parentNode.removeChild(this.textInput);
    }
    this.textInput = null;
  }

  public clearAnnotations() {
    this.annotations = [];
    this._redraw();
  }

  public download(filename: string = 'screenshot.jpg', quality: number = 0.85) {
    // Use JPEG with quality compression for smaller file sizes
    // Quality 0.85 provides good balance between size and quality
    const dataUrl = this.canvas.toDataURL('image/jpeg', quality);
    const link = document.createElement('a');
    link.download = filename.replace(/\.png$/i, '.jpg');
    link.href = dataUrl;
    link.click();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-annotation-canvas': HBAnnotationCanvas;
  }
}
