import type { RGB, TabGroupColor } from "../../types/index.ts";
import { rgbToHsl } from "./rgbToHsl.ts";

export function mapToClosestChromeColor(color: RGB): TabGroupColor {
  const { h, s, l } = rgbToHsl(color);

  if (s < 0.15 || l < 0.08 || l > 0.92) return "grey";

  if (h < 12) return l > 0.55 ? "orange" : "red";
  if (h < 35) return "orange";
  if (h < 55) return "yellow";
  if (h < 160) return "green";
  if (h < 200) return "cyan";
  if (h < 265) return "blue";
  if (h < 310) return "purple";
  if (h < 345) return "pink";
  return "red";
}
