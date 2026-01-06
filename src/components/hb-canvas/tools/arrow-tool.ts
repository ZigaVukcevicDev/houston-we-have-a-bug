import { LineTool } from './line-tool';
import type { LineAnnotation } from '../../../interfaces/annotation.interface';
import { getCanvasCoordinates } from '../../../utils/get-canvas-coordinates';
import { renderArrowhead } from '../../../utils/render-arrowhead';

export class ArrowTool extends LineTool {
  private currentPreviewX: number = 0;
  private currentPreviewY: number = 0;

  handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    let { x, y } = getCanvasCoordinates(event, canvas);

    // Apply shift-key constraints (use parent method)
    const startPoint = (this as any).startPoint as { x: number; y: number } | null;
    if (event.shiftKey && startPoint) {
      ({ x, y } = this.applyLineConstraint(x, y, startPoint));
    }

    // Store constrained coordinates for preview
    this.currentPreviewX = x;
    this.currentPreviewY = y;

    // Call parent implementation
    super.handleMouseMove(event, canvas, ctx);
  }

  render(ctx: CanvasRenderingContext2D): void {
    // First render all lines normally (inherited behavior)
    super.render(ctx);

    const dpr = window.devicePixelRatio || 1;

    // Access lineAnnotations through array passed to constructor
    const annotations = (this as any).lineAnnotations as LineAnnotation[];

    // Add arrowheads to all annotations (they're all arrows in this array now)
    annotations.forEach(arrow => {
      renderArrowhead(ctx, arrow.x1, arrow.y1, arrow.x2, arrow.y2, arrow.color, arrow.width, dpr);
    });

    // Also draw arrowhead on preview during drawing
    const isDrawing = (this as any).isDrawing as boolean;
    const startPoint = (this as any).startPoint as { x: number; y: number } | null;

    if (isDrawing && startPoint) {
      const color = (this as any).color;
      const lineWidth = (this as any).lineWidth;
      renderArrowhead(
        ctx,
        startPoint.x,
        startPoint.y,
        this.currentPreviewX,
        this.currentPreviewY,
        color,
        lineWidth,
        dpr
      );
    }
  }
}
