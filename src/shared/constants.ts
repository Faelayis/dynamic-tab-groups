import type { ExtensionSettings, RGB, TabGroupColor } from "./types.ts";

export const CHROME_GROUP_COLORS: Record<TabGroupColor, RGB> = {
  grey: { r: 154, g: 160, b: 166 },
  blue: { r: 66, g: 133, b: 244 },
  red: { r: 234, g: 67, b: 53 },
  yellow: { r: 251, g: 188, b: 4 },
  green: { r: 52, g: 168, b: 83 },
  pink: { r: 233, g: 30, b: 99 },
  purple: { r: 156, g: 39, b: 176 },
  cyan: { r: 0, g: 172, b: 193 },
  orange: { r: 255, g: 112, b: 67 },
} as const;

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  closeSingleTabGroups: true,
  sortGroupsAlphabetically: false,
  moveRecentlyTabToRight: false,
  moveRecentlyTabToRightGroup: false,
  moveRecentlyTabToRightBeforeNewTab: false,
  ignorePinnedTabs: true,
  groupChromePages: false,
  collapseGroupsWhenNotInUse: false,
  useUuidTracker: false,
  renameGroupToSiteName: true,
  respectSplitView: true,
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
