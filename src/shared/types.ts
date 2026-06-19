export type TabGroupColor =
  | "grey"
  | "blue"
  | "red"
  | "yellow"
  | "green"
  | "pink"
  | "purple"
  | "cyan"
  | "orange";

export interface RGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export interface ExtensionSettings {
  enabled: boolean;
  closeSingleTabGroups: boolean;
  sortGroupsAlphabetically: boolean;
  moveRecentlyTabToRight: boolean;
  moveRecentlyTabToRightGroup: boolean;
  moveRecentlyTabToRightBeforeNewTab: boolean;
  ignorePinnedTabs: boolean;
  groupChromePages: boolean;
  collapseGroupsWhenNotInUse: boolean;
  useUuidTracker: boolean;
  renameGroupToSiteName: boolean;
  respectSplitView: boolean;
}
