import type { RGB } from "../../types/index.ts";
import { extractFromPixels } from "./extractFromPixels.ts";

export function computeDominantColor(data: Uint8ClampedArray): RGB {
  return (
    extractFromPixels(data, {
      maxBrightness: 236,
      minBrightness: 20,
      minSaturation: 0.12,
    }) ??
    extractFromPixels(data, {
      maxBrightness: 248,
      minBrightness: 8,
      minSaturation: 0.04,
    }) ??
    extractFromPixels(data, {
      maxBrightness: 255,
      minBrightness: 0,
      minSaturation: 0,
    }) ?? { b: 166, g: 160, r: 154 }
  );
}
