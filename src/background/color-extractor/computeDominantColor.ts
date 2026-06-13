import type { RGB } from "../../types/index.ts";
import { extractFromPixels } from "./extractFromPixels.ts";

export function computeDominantColor(data: Uint8ClampedArray): RGB {
  return (
    extractFromPixels(data, {
      minSaturation: 0.12,
      minBrightness: 20,
      maxBrightness: 236,
    }) ??
    extractFromPixels(data, {
      minSaturation: 0.04,
      minBrightness: 8,
      maxBrightness: 248,
    }) ??
    extractFromPixels(data, {
      minSaturation: 0,
      minBrightness: 0,
      maxBrightness: 255,
    }) ??
    { r: 154, g: 160, b: 166 } 
  );
}
