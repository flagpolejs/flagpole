import { PointerPoint } from "./pointer";

export type GestureType = "pinch" | "stretch";
export interface GestureOpts {
  start?: PointerPoint;
  duration?: number;
  amount?: PointerPoint;
}
