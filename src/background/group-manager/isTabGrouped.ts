export function isTabGrouped(tab: chrome.tabs.Tab): boolean {
  return (
    tab.groupId !== undefined &&
    tab.groupId !== -1 &&
    tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
  );
}
