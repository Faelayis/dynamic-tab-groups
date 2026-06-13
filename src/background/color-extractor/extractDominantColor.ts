import type { TabGroupColor } from "../../types/index.ts";
import { getCachedColor, setCachedColor } from "./cache.ts";
import { computeDominantColor } from "./computeDominantColor.ts";
import { mapToClosestChromeColor } from "./mapToClosestChromeColor.ts";

export async function extractDominantColor(
  pageUrl: string,
  domain: string,
): Promise<TabGroupColor> {
  const cached = getCachedColor(domain);
  if (cached) return cached;

  try {
    const url = new URL(`chrome-extension://${chrome.runtime.id}/_favicon/`);
    url.searchParams.set("pageUrl", pageUrl);
    url.searchParams.set("size", "32");

    const response = await fetch(url.toString());
    if (!response.ok) return "grey";

    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);

    const SIZE = 32;
    const canvas = new OffscreenCanvas(SIZE, SIZE);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return "grey";
    }

    ctx.drawImage(bitmap, 0, 0, SIZE, SIZE);
    const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
    bitmap.close();

    const dominant = computeDominantColor(imageData.data);
    const chromeColor = mapToClosestChromeColor(dominant);

    setCachedColor(domain, chromeColor);
    return chromeColor;
  } catch {
    return "grey";
  }
}
