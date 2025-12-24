import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import styles from './hb-canvas.scss';
import type { DrawingMode } from '../../types/drawing-mode.type';
import type { Tool } from '../../interfaces/tool.interface';
import type { LineAnnotation, TextAnnotation, RectangleAnnotation } from '../../interfaces/annotation.interface';
import { TextTool } from './tools/text-tool';
import { LineTool } from './tools/line-tool';
import { RectangleTool } from './tools/rectangle-tool';
import { SelectTool } from './tools/select-tool';

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
  private tools: Map<DrawingMode, Tool> = new Map();

  // Centralized annotation storage
  private lineAnnotations: LineAnnotation[] = [];
  private rectangleAnnotations: RectangleAnnotation[] = [];
  private textAnnotations: TextAnnotation[] = [];

  constructor() {
    super();
    this.initializeTools();
  }

  private get activeTool(): Tool | undefined {
    return this.tools.get(this.drawingMode);
  }

  render() {
    const modeClass = this.drawingMode ? `mode-${this.drawingMode}` : 'mode-default';

    return html`<canvas 
      class="${modeClass}"
      @click=${this.handleCanvasClick}
      @mousedown=${this.handleMouseDown}
      @mousemove=${this.handleMouseMove}
      @mouseup=${this.handleMouseUp}
    ></canvas>`;
  }

  protected firstUpdated() {
    this.ctx = this.canvas.getContext('2d')!;
    this.loadImage();
  }

  protected updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('dataUrl') && this.dataUrl) {
      this.loadImage();
    }
  }

  private initializeTools() {
    // Initialize tools with shared annotations and callbacks
    this.tools.set('text', new TextTool(
      this.textAnnotations,
      () => this.redraw()
    ));
    this.tools.set('line', new LineTool(
      this.lineAnnotations,
      () => this.redraw(),
      (tool: string, annotationId?: string) => this.handleToolChange(tool, annotationId)
    ));
    this.tools.set('rectangle', new RectangleTool(
      this.rectangleAnnotations,
      () => this.redraw(),
      (tool: string, annotationId?: string) => this.handleToolChange(tool, annotationId)
    ));
    this.tools.set('select', new SelectTool(
      this.lineAnnotations,
      this.rectangleAnnotations,
      () => this.redraw()
    ));
  }

  private handleToolChange(tool: string, annotationId?: string) {
    // Dispatch event to notify toolbar of tool change
    this.dispatchEvent(new CustomEvent('tool-change', {
      detail: { tool },
      bubbles: true,
      composed: true
    }));

    // If an annotation ID is provided, select it after tool change
    if (annotationId && tool === 'select') {
      const selectTool = this.tools.get('select') as SelectTool;
      if (selectTool) {
        selectTool.selectAnnotation(annotationId);
      }
    }
  }

  private async loadImage() {
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

      this.redraw();
    };
    img.src = this.dataUrl;
  }

  private redraw() {
    if (!this.originalImage) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.originalImage, 0, 0);

    // Render all tools' annotations
    this.tools.forEach((tool) => {
      tool.render(this.ctx);
    });
  }

  private handleCanvasClick(event: MouseEvent) {
    this.activeTool?.handleClick?.(event, this.canvas);
  }

  private handleMouseDown(event: MouseEvent) {
    this.activeTool?.handleMouseDown?.(event, this.canvas);
  }

  private handleMouseMove(event: MouseEvent) {
    this.activeTool?.handleMouseMove?.(event, this.canvas, this.ctx);
  }

  private handleMouseUp(event: MouseEvent) {
    this.activeTool?.handleMouseUp?.(event, this.canvas);
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
