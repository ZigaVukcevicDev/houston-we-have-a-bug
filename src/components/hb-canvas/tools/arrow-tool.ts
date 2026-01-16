import { LineTool } from './line-tool';
import { getCanvasCoordinates } from '../../../utils/get-canvas-coordinates';
import { renderArrowhead } from '../../../utils/render-arrowhead';

export class ArrowTool extends LineTool {
  private currentPreviewX: number = 0;
  private currentPreviewY: number = 0;

  handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    let { x, y } = getCanvasCoordinates(event, canvas);

    // Apply shift-key constraints (use parent method)
    if (event.shiftKey && this.startPoint) {
      ({ x, y } = this.applyLineConstraint(x, y, this.startPoint));
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

    // Add arrowheads to all annotations (they're all arrows in this array now)
    this.lineAnnotations.forEach(arrow => {
      renderArrowhead(ctx, arrow.x1, arrow.y1, arrow.x2, arrow.y2, arrow.color, arrow.width, dpr);
    });

    // Also draw arrowhead on preview during drawing
    if (this.isDrawing && this.startPoint) {
      renderArrowhead(
        ctx,
        this.startPoint.x,
        this.startPoint.y,
        this.currentPreviewX,
        this.currentPreviewY,
        this.color,
        this.lineWidth,
        dpr
      );
    }
  }
}
