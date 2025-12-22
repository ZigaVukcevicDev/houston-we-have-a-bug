export interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

export interface LineAnnotation {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
}
