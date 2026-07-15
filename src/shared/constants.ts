import type { ExtensionSettings, RGB, TabGroupColor } from "./types.ts";

export const CHROME_GROUP_COLORS: Record<TabGroupColor, RGB> = {
  blue: { b: 244, g: 133, r: 66 },
  cyan: { b: 193, g: 172, r: 0 },
  green: { b: 83, g: 168, r: 52 },
  grey: { b: 166, g: 160, r: 154 },
  orange: { b: 67, g: 112, r: 255 },
  pink: { b: 99, g: 30, r: 233 },
  purple: { b: 176, g: 39, r: 156 },
  red: { b: 53, g: 67, r: 234 },
  yellow: { b: 4, g: 188, r: 251 },
} as const;

export const DEFAULT_SETTINGS: ExtensionSettings = {
  closeSingleTabGroups: true,
  collapseGroupsWhenNotInUse: false,
  enabled: true,
  groupChromePages: false,
  ignorePinnedTabs: true,
  moveRecentlyTabToRight: false,
  moveRecentlyTabToRightBeforeNewTab: false,
  moveRecentlyTabToRightGroup: false,
  renameGroupToSiteName: true,
  respectSplitView: true,
  sortGroupsAlphabetically: false,
  useUuidTracker: false,
} as const;

export const IGNORED_PROTOCOLS = new Set([
  "chrome:",
  "chrome-extension:",
  "about:",
  "edge:",
  "brave:",
  "devtools:",
  "chrome-devtools:",
]);
