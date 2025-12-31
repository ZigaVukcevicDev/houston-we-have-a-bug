// Draw dashes aligned to rectangle position to prevent marching ants
export function drawManualDashes(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dashLength: number,
  gapLength: number,
  isHorizontal: boolean
) {
  if (isHorizontal) {
    const startX = Math.min(x1, x2);
    const endX = Math.max(x1, x2);
    const y = y1;

    // Start dashes from the rectangle edge (not canvas grid)
    let currentX = startX;
    let isDash = true;

    while (currentX < endX) {
      if (isDash) {
        const dashEnd = Math.min(currentX + dashLength, endX);
        ctx.beginPath();
        ctx.moveTo(currentX, y);
        ctx.lineTo(dashEnd, y);
        ctx.stroke();
        currentX = dashEnd;
      } else {
        currentX = Math.min(currentX + gapLength, endX);
      }
      isDash = !isDash;
    }
  } else {
    const startY = Math.min(y1, y2);
    const endY = Math.max(y1, y2);
    const x = x1;

    // Start dashes from the rectangle edge (not canvas grid)
    let currentY = startY;
    let isDash = true;

    while (currentY < endY) {
      if (isDash) {
        const dashEnd = Math.min(currentY + dashLength, endY);
        ctx.beginPath();
        ctx.moveTo(x, currentY);
        ctx.lineTo(x, dashEnd);
        ctx.stroke();
        currentY = dashEnd;
      } else {
        currentY = Math.min(currentY + gapLength, endY);
      }
      isDash = !isDash;
    }
  }
}
