import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import styles from './hb-canvas.scss';
import type { DrawingMode } from './types';
import type { ITool } from './tools/base-tool';
import { TextTool } from './tools/text-tool';
import { LineTool } from './tools/line-tool';

@customElement('hb-canvas')
export class HBCanvas extends LitElement {
  static styles = unsafeCSS(styles);

  @property({ type: String })
  dataUrl: string = '';

  @property({ type: String })
  drawingMode: DrawingMode = 'text';

  @query('canvas')
  private canvas!: HTMLCanvasElement;

  private ctx!: CanvasRenderingContext2D;
  private originalImage: HTMLImageElement | null = null;
  private tools: Map<DrawingMode, ITool> = new Map();

  constructor() {
    super();
    this._initializeTools();
  }

  private _initializeTools() {
    // Initialize tools with a redraw callback
    this.tools.set('text', new TextTool(() => this._redraw()));
    this.tools.set('line', new LineTool(() => this._redraw()));
  }

  private get _activeTool(): ITool | undefined {
    return this.tools.get(this.drawingMode);
  }

  render() {
    return html`<canvas 
      @click=${this._handleCanvasClick}
      @mousedown=${this._handleMouseDown}
      @mousemove=${this._handleMouseMove}
      @mouseup=${this._handleMouseUp}
    ></canvas>`;
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

    // Render all tools' annotations
    this.tools.forEach((tool) => {
      tool.render(this.ctx);
    });
  }

  private _handleCanvasClick(event: MouseEvent) {
    this._activeTool?.handleClick(event, this.canvas, this.ctx);
  }

  private _handleMouseDown(event: MouseEvent) {
    this._activeTool?.handleMouseDown(event, this.canvas, this.ctx);
  }

  private _handleMouseMove(event: MouseEvent) {
    this._activeTool?.handleMouseMove(event, this.canvas, this.ctx);
  }

  private _handleMouseUp(event: MouseEvent) {
    this._activeTool?.handleMouseUp(event, this.canvas, this.ctx);
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
    'hb-canvas': HBCanvas;
  }
}
