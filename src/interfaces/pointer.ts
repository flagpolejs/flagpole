export type PointerButton = "default" | "left" | "right" | "middle";
export type PointerDisposition = "down" | "up";
export type PointerType = "default" | "mouse" | "pen" | "touch";
export type PointerPoint = [x: number, y: number];
export type PointerClick = {
  duration?: number;
  count?: number;
  delay?: number;
  type?: PointerType;
};
export interface PointerMove {
  start: PointerPoint;
  end?: PointerPoint;
  duration?: number;
  type?: PointerType;
  disposition?: {
    start: PointerDisposition;
    end: PointerDisposition;
  };
  button?: PointerButton;
}
