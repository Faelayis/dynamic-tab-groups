import type { RGB } from "../../types/index.ts";

export interface FilterOptions {
  minSaturation: number;
  minBrightness: number;
  maxBrightness: number;
}

export function extractFromPixels(
  data: Uint8ClampedArray,
  filters: FilterOptions,
): RGB | null {
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
