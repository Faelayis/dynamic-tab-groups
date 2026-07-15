import type { RGB, TabGroupColor } from "../shared/types.ts";

const colorCache = new Map<string, TabGroupColor>();

export function getCachedColor(domain: string): TabGroupColor | undefined {
  return colorCache.get(domain);
}

export async function extractDominantColor(
  pageUrl: string,
  domain: string,
): Promise<TabGroupColor> {
  const cached = colorCache.get(domain);
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

    colorCache.set(domain, chromeColor);
    return chromeColor;
  } catch {
    return "grey";
  }
}

interface FilterOptions {
  minSaturation: number;
  minBrightness: number;
  maxBrightness: number;
}

function computeDominantColor(data: Uint8ClampedArray): RGB {
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

function extractFromPixels(data: Uint8ClampedArray, filters: FilterOptions): RGB | null {
  const BUCKET_SIZE = 32;
  const buckets = new Map<
    string,
    {
      totalR: number;
      totalG: number;
      totalB: number;
      count: number;
      satSum: number;
    }
  >();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const a = data[i + 3]!;

    if (a < 128) continue;

    const brightness = (r + g + b) / 3;
    if (brightness > filters.maxBrightness || brightness < filters.minBrightness)
      continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    if (saturation < filters.minSaturation) continue;

    const br = Math.floor(r / BUCKET_SIZE);
    const bg = Math.floor(g / BUCKET_SIZE);
    const bb = Math.floor(b / BUCKET_SIZE);
    const key = `${br},${bg},${bb}`;

    const bucket = buckets.get(key) ?? {
      count: 0,
      satSum: 0,
      totalB: 0,
      totalG: 0,
      totalR: 0,
    };
    bucket.totalR += r;
    bucket.totalG += g;
    bucket.totalB += b;
    bucket.count += 1;
    bucket.satSum += saturation;
    buckets.set(key, bucket);
  }

  if (buckets.size === 0) return null;

  let best: (typeof buckets extends Map<string, infer V> ? V : never) | null = null;
  let bestScore = -1;

  for (const bucket of buckets.values()) {
    const avgSat = bucket.satSum / bucket.count;
    const score = bucket.count * (avgSat + 0.05);
    if (score > bestScore) {
      bestScore = score;
      best = bucket;
    }
  }

  if (!best) return null;

  return {
    b: Math.round(best.totalB / best.count),
    g: Math.round(best.totalG / best.count),
    r: Math.round(best.totalR / best.count),
  };
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  } else if (max === g) {
    h = ((b - r) / d + 2) * 60;
  } else {
    h = ((r - g) / d + 4) * 60;
  }

  return { h, s, l };
}

function mapToClosestChromeColor(color: RGB): TabGroupColor {
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
