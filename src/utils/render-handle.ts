export const handleSize = 8; // Base size in CSS pixels (will be scaled by DPR)
export const handleHitThreshold = 2; // Extra pixels for easier clicking

export function renderHandle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): void {
  ctx.save();

  // Scale handle size by device pixel ratio for Retina displays
  const dpr = window.devicePixelRatio || 1;
  const scaledSize = handleSize * dpr;
  const halfSize = scaledSize / 2;
  const rectX = x - halfSize;
  const rectY = y - halfSize;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(rectX, rectY, scaledSize, scaledSize);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1 * dpr;
  ctx.strokeRect(rectX, rectY, scaledSize, scaledSize);

  ctx.restore();
}

export function isPointOnHandle(
  px: number,
  py: number,
  hx: number,
  hy: number
): boolean {
  // Scale handle size by device pixel ratio for Retina displays
  const dpr = window.devicePixelRatio || 1;
  const scaledSize = handleSize * dpr;
  const halfSize = scaledSize / 2;
  return (
    px >= hx - halfSize &&
    px <= hx + halfSize &&
    py >= hy - halfSize &&
    py <= hy + halfSize
  );
}
