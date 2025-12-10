interface TextAnnotation {
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

export class ScreenshotEditor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private originalImage: HTMLImageElement | null = null;
  private annotations: TextAnnotation[] = [];
  private currentColor: string = '#ff0000';
  private currentFontSize: number = 24;
  private textInput: HTMLInputElement | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
  }

  private handleCanvasClick(event: MouseEvent): void {
    if (this.textInput) {
      this.finalizeTextInput();
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    this.createTextInput(x, y, rect, scaleX, scaleY);
  }

  private createTextInput(
    canvasX: number,
    canvasY: number,
    rect: DOMRect,
    scaleX: number,
    scaleY: number
  ): void {
    this.textInput = document.createElement('input');
    this.textInput.type = 'text';
    this.textInput.className = 'annotation-input';
    this.textInput.style.position = 'absolute';
    this.textInput.style.left = `${canvasX / scaleX + rect.left}px`;
    this.textInput.style.top = `${canvasY / scaleY + rect.top - this.currentFontSize / 2}px`;
    this.textInput.style.fontSize = `${this.currentFontSize / scaleY}px`;
    this.textInput.style.color = this.currentColor;
    this.textInput.style.background = 'rgba(255, 255, 255, 0.8)';
    this.textInput.style.border = '1px dashed #333';
    this.textInput.style.outline = 'none';
    this.textInput.style.padding = '2px 4px';
    this.textInput.style.minWidth = '100px';
    this.textInput.style.zIndex = '1000';

    this.textInput.dataset.canvasX = canvasX.toString();
    this.textInput.dataset.canvasY = canvasY.toString();

    document.body.appendChild(this.textInput);
    this.textInput.focus();

    this.textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.finalizeTextInput();
      } else if (e.key === 'Escape') {
        this.cancelTextInput();
      }
    });

    this.textInput.addEventListener('blur', () => {
      setTimeout(() => this.finalizeTextInput(), 100);
    });
  }

  private finalizeTextInput(): void {
    if (!this.textInput) return;

    const text = this.textInput.value.trim();
    if (text) {
      const x = parseFloat(this.textInput.dataset.canvasX || '0');
      const y = parseFloat(this.textInput.dataset.canvasY || '0');

      this.annotations.push({
        x,
        y,
        text,
        color: this.currentColor,
        fontSize: this.currentFontSize,
      });

      this.redraw();
    }

    this.removeTextInput();
  }

  private cancelTextInput(): void {
    this.removeTextInput();
  }

  private removeTextInput(): void {
    if (this.textInput && this.textInput.parentNode) {
      this.textInput.parentNode.removeChild(this.textInput);
    }
    this.textInput = null;
  }

  loadImage(dataUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.originalImage = img;
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.redraw();
        resolve();
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  private redraw(): void {
    if (!this.originalImage) return;

    // Clear and draw original image
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.originalImage, 0, 0);

    // Draw all text annotations
    this.annotations.forEach((annotation) => {
      this.ctx.font = `bold ${annotation.fontSize}px Arial, sans-serif`;
      this.ctx.fillStyle = annotation.color;
      this.ctx.textBaseline = 'middle';

      // Draw text shadow for better visibility
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      this.ctx.shadowBlur = 3;
      this.ctx.shadowOffsetX = 1;
      this.ctx.shadowOffsetY = 1;

      this.ctx.fillText(annotation.text, annotation.x, annotation.y);

      // Reset shadow
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
    });
  }

  setColor(color: string): void {
    this.currentColor = color;
  }

  setFontSize(size: number): void {
    this.currentFontSize = size;
  }

  clearAnnotations(): void {
    this.annotations = [];
    this.redraw();
  }

  getDataUrl(format: 'png' | 'jpeg' = 'png', quality: number = 0.92): string {
    return this.canvas.toDataURL(`image/${format}`, quality);
  }

  download(filename: string = 'screenshot.png'): void {
    const dataUrl = this.getDataUrl();
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }

  destroy(): void {
    this.removeTextInput();
    this.canvas.removeEventListener('click', this.handleCanvasClick.bind(this));
  }
}
