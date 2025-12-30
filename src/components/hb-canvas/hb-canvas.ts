import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import styles from './hb-canvas.scss';
import type { ActiveTool } from '../../types/active-tool.type';
import type { Tool } from '../../interfaces/tool.interface';
import type { LineAnnotation, TextAnnotation, RectangleAnnotation } from '../../interfaces/annotation.interface';
import { TextTool } from './tools/text-tool';
import { LineTool } from './tools/line-tool';
import { ArrowTool } from './tools/arrow-tool';
import { RectangleTool } from './tools/rectangle-tool';
import { SelectTool } from './tools/select-tool';
import { CropTool } from './tools/crop-tool';

@customElement('hb-canvas')
export class HBCanvas extends LitElement {
  static styles = unsafeCSS(styles);

  @property({ type: String })
  dataUrl: string = '';

  @property({ type: String })
  activeTool: ActiveTool = 'text';

  @query('canvas')
  private canvas!: HTMLCanvasElement;

  private ctx!: CanvasRenderingContext2D;
  private originalImage: HTMLImageElement | null = null;
  private tools: Map<ActiveTool, Tool> = new Map();

  // Centralized annotation storage
  private lineAnnotations: LineAnnotation[] = [];
  private rectangleAnnotations: RectangleAnnotation[] = [];
  private textAnnotations: TextAnnotation[] = [];

  constructor() {
    super();
    this.initializeTools();
  }

  private get currentTool(): Tool | undefined {
    return this.tools.get(this.activeTool);
  }

  render() {
    const modeClass = this.activeTool ? `mode-${this.activeTool}` : 'mode-default';
    const showCropButtons = this.activeTool === 'crop' && this.getCropButtonsPosition();
    return html`<canvas 
      class="${modeClass}"
      @click=${this.handleCanvasClick}
      @mousedown=${this.handleMouseDown}
      @mousemove=${this.handleMouseMove}
      @mouseup=${this.handleMouseUp}
    ></canvas>
    ${showCropButtons ? html`
      <div class="crop-buttons" style="${this.getCropButtonsStyle()}">
        <button
          @click=${this.handleCropConfirm}
          title="Confirm crop"
        >
          <img src="../images/check-1-white.svg" alt="check" />
        </button>
        <button
          @click=${this.handleCropCancel}
          title="Cancel crop"
        >
          <img src="../images/cancel-white.svg" alt="cancel" />
        </button>
      </div>
    ` : ''}`;
  }

  protected firstUpdated() {
    this.ctx = this.canvas.getContext('2d')!;
    this.loadImage();

    // Activate the initial tool
    this.currentTool?.activate?.();
  }

  protected updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('dataUrl') && this.dataUrl) {
      this.loadImage();
    }

    // Handle tool switching
    if (changedProperties.has('activeTool')) {
      // Deactivate previous tool
      const previousMode = changedProperties.get('activeTool') as ActiveTool | undefined;
      if (previousMode) {
        const prevTool = this.tools.get(previousMode);
        prevTool?.deactivate?.();
      }

      // Deselect all annotations when switching to crop tool
      if (this.activeTool === 'crop') {
        const selectTool = this.tools.get('select') as SelectTool;
        if (selectTool) {
          selectTool.deselectAll();
        }
      }

      // Activate new tool
      this.currentTool?.activate?.();
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
    this.tools.set('arrow', new ArrowTool(
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
    this.tools.set('crop', new CropTool(
      () => this.redraw(),
      (tool: string) => this.handleToolChange(tool)
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
    this.requestUpdate();
  }

  private handleCanvasClick(event: MouseEvent) {
    this.currentTool?.handleClick?.(event, this.canvas);
  }

  private handleMouseDown(event: MouseEvent) {
    this.currentTool?.handleMouseDown?.(event, this.canvas);
  }

  private handleMouseMove(event: MouseEvent) {
    this.currentTool?.handleMouseMove?.(event, this.canvas, this.ctx);
  }

  private handleMouseUp(event: MouseEvent) {
    this.currentTool?.handleMouseUp?.(event, this.canvas);
  }

  public download(filename: string = 'screenshot.jpg', quality: number = 0.85) {
    // Deselect all annotations before downloading
    const selectTool = this.tools.get('select') as SelectTool;
    if (selectTool) {
      selectTool.deselectAll();
    }

    // Use JPEG with quality compression for smaller file sizes
    // Quality 0.85 provides good balance between size and quality
    const dataUrl = this.canvas.toDataURL('image/jpeg', quality);
    const link = document.createElement('a');
    link.download = filename.replace(/\.png$/i, '.jpg');
    link.href = dataUrl;
    link.click();
  }

  public deselectAll() {
    const selectTool = this.tools.get('select') as SelectTool;
    if (selectTool) {
      selectTool.deselectAll();
      this.redraw();
    }
  }
  private getCropButtonsPosition(): { x: number; y: number } | null {
    const cropTool = this.tools.get('crop') as CropTool;
    if (!cropTool) return null;
    const cropRect = cropTool.getCropRect();
    if (!cropRect) return null;
    const dpr = window.devicePixelRatio || 1;
    const buttonWidth = 51;
    const buttonHeight = 24;
    const padding = 5;
    return {
      x: cropRect.x + cropRect.width - (buttonWidth + padding) * dpr,
      y: cropRect.y + cropRect.height - (buttonHeight + padding) * dpr
    };
  }
  private getCropButtonsStyle(): string {
    const pos = this.getCropButtonsPosition();
    if (!pos) return '';
    const dpr = window.devicePixelRatio || 1;
    const x = pos.x / dpr;
    const y = pos.y / dpr;
    return `left: ${x}px; top: ${y}px;`;
  }
  private handleCropCancel(): void {
    const cropTool = this.tools.get('crop') as CropTool;
    if (cropTool) {
      cropTool.cancelCrop();
    }
  }
  private handleCropConfirm(): void {
    const cropTool = this.tools.get('crop') as CropTool;
    if (!cropTool || !this.originalImage) return;
    const croppedImage = cropTool.confirmCrop(this.canvas, this.originalImage);
    if (croppedImage) {
      croppedImage.onload = () => {
        this.originalImage = croppedImage;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = croppedImage.width;
        this.canvas.height = croppedImage.height;
        this.canvas.style.width = `${croppedImage.width / dpr}px`;
        this.canvas.style.height = `${croppedImage.height / dpr}px`;
        cropTool.cancelCrop();
        this.redraw();
      };
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-canvas': HBCanvas;
  }
}
