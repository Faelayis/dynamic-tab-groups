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
  moveActiveTabToRight: boolean;
  moveActiveTabToRightGroup: boolean;
  moveActiveTabToRightBeforeNewTab: boolean;
  ignorePinnedTabs: boolean;
  groupChromePages: boolean;
  collapseGroupsWhenNotInUse: boolean;
  useUuidTracker: boolean;
  renameGroupToSiteName: boolean;
}
