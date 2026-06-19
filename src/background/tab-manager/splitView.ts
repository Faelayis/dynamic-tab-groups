export function isInSplitView(tab: chrome.tabs.Tab): boolean {
  return tab.splitViewId !== undefined && tab.splitViewId >= 0;
}
