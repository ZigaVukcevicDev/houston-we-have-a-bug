import { LineTool } from './line-tool';
import type { LineAnnotation } from '../../../interfaces/annotation.interface';

export class ArrowTool extends LineTool {
  private currentPreviewX: number = 0;
  private currentPreviewY: number = 0;

  handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    this.currentPreviewX = (event.clientX - rect.left) * scaleX;
    this.currentPreviewY = (event.clientY - rect.top) * scaleY;

    // Call parent implementation
    super.handleMouseMove(event, canvas, ctx);
  }

  render(ctx: CanvasRenderingContext2D): void {
    // First render all lines normally (inherited behavior)
    super.render(ctx);

    const dpr = window.devicePixelRatio || 1;

    // Access lineAnnotations through array passed to constructor
    const annotations = (this as any).lineAnnotations as LineAnnotation[];

    // Add arrowheads to all existing arrows
    annotations.forEach(arrow => {
      this.drawArrowhead(ctx, arrow, dpr);
    });

    // Also draw arrowhead on preview during drawing
    const isDrawing = (this as any).isDrawing as boolean;
    const startPoint = (this as any).startPoint as { x: number; y: number } | null;

    if (isDrawing && startPoint) {
      const preview: LineAnnotation = {
        id: 'preview',
        x1: startPoint.x,
        y1: startPoint.y,
        x2: this.currentPreviewX,
        y2: this.currentPreviewY,
        color: (this as any).color,
        width: (this as any).lineWidth,
      };
      this.drawArrowhead(ctx, preview, dpr);
    }
  }

  private drawArrowhead(ctx: CanvasRenderingContext2D, arrow: LineAnnotation, dpr: number): void {
    const { x1, y1, x2, y2, color, width } = arrow;

    // Calculate angle of the arrow
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Arrowhead dimensions
    const headLength = 16 * dpr;
    const arrowAngle = Math.PI / 4; // 45 degrees

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width * dpr;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw first line of arrowhead (upper line)
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLength * Math.cos(angle - arrowAngle),
      y2 - headLength * Math.sin(angle - arrowAngle)
    );
    ctx.stroke();

    // Draw second line of arrowhead (lower line)
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLength * Math.cos(angle + arrowAngle),
      y2 - headLength * Math.sin(angle + arrowAngle)
    );
    ctx.stroke();

    ctx.restore();
  }
}
