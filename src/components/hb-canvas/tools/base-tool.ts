export interface ITool {
  handleClick?(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;

  handleMouseDown?(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;

  handleMouseMove?(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;

  handleMouseUp?(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;

  render(ctx: CanvasRenderingContext2D): void;
}
