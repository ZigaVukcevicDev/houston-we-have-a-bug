export const arrowheadLength = 16;
export const arrowheadAngle = Math.PI / 4; // 45 degrees

export function renderArrowhead(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  dpr: number = window.devicePixelRatio || 1
): void {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLength = arrowheadLength * dpr;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width * dpr;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw first line of arrowhead (upper line)
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - arrowheadAngle),
    y2 - headLength * Math.sin(angle - arrowheadAngle)
  );
  ctx.stroke();

  // Draw second line of arrowhead (lower line)
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + arrowheadAngle),
    y2 - headLength * Math.sin(angle + arrowheadAngle)
  );
  ctx.stroke();

  ctx.restore();
}

export function getArrowheadPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dpr: number = window.devicePixelRatio || 1
): { point1: { x: number; y: number }; point2: { x: number; y: number } } {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLength = arrowheadLength * dpr;

  return {
    point1: {
      x: x2 - headLength * Math.cos(angle - arrowheadAngle),
      y: y2 - headLength * Math.sin(angle - arrowheadAngle),
    },
    point2: {
      x: x2 - headLength * Math.cos(angle + arrowheadAngle),
      y: y2 - headLength * Math.sin(angle + arrowheadAngle),
    },
  };
}
