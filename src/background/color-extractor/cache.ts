import type { TabGroupColor } from "../../types/index.ts";

const colorCache = new Map<string, TabGroupColor>();

export function getCachedColor(domain: string): TabGroupColor | undefined {
  return colorCache.get(domain);
}

export function setCachedColor(domain: string, color: TabGroupColor): void {
  colorCache.set(domain, color);
}
