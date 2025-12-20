export interface ITool {
  handleClick?(event: MouseEvent, canvas: HTMLCanvasElement): void;

  handleMouseDown?(event: MouseEvent, canvas: HTMLCanvasElement): void;

  handleMouseMove?(event: MouseEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;

  handleMouseUp?(event: MouseEvent, canvas: HTMLCanvasElement): void;

  render(ctx: CanvasRenderingContext2D): void;
}
