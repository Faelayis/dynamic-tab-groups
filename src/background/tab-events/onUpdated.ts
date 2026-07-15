import { scheduleEvaluation } from "../tab-manager/evaluation.ts";

export function onUpdated(
  _tabId: number,
  changeInfo: chrome.tabs.OnUpdatedInfo,
  tab: chrome.tabs.Tab,
) {
  if (changeInfo.url || changeInfo.favIconUrl) {
    if (tab.windowId !== undefined) {
      if (!tab.active && tab.openerTabId === undefined) {
        return;
      }
      scheduleEvaluation(tab.windowId, 500);
    }
  }
}
