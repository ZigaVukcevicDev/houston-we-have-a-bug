export interface TextAnnotation {
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

export interface LineAnnotation {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
}

export type Annotation = TextAnnotation | LineAnnotation;

export type DrawingMode = 'text' | 'line' | 'arrow' | 'rectangle' | 'crop';
