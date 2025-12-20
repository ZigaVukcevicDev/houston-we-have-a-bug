export interface ITool {
  /**
   * Handle canvas click events
   */
  handleClick(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;

  /**
   * Handle mouse down events
   */
  handleMouseDown(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;

  /**
   * Handle mouse move events
   */
  handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;

  /**
   * Handle mouse up events
   */
  handleMouseUp(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;

  /**
   * Render all annotations for this tool
   */
  render(ctx: CanvasRenderingContext2D): void;
}
