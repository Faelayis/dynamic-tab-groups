import { getSettings } from "../../shared/storage/index.ts";
import { getDisplayIdForWindow } from "./display.ts";
import { isInSplitView } from "./splitView.ts";

export async function moveNewTabToRight(tab: chrome.tabs.Tab): Promise<void> {
  const settings = await getSettings();
  if (!settings.enabled) return;
  if (tab.id === undefined || tab.windowId === undefined) return;
  if (settings.ignorePinnedTabs && tab.pinned) return;
  if (settings.respectSplitView && isInSplitView(tab)) return;

  try {
    const displayId = await getDisplayIdForWindow(tab.windowId);
    console.log("[Dynamic Tab Groups] Window is on display:", displayId);
    if (!displayId) return;
  } catch {
    //
  }

  try {
    if (tab.groupId !== undefined && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      const tabsInGroup = await chrome.tabs.query({ groupId: tab.groupId });
      if (tabsInGroup.length > 0) {
        const maxIndex = Math.max(...tabsInGroup.map((t) => t.index));
        if (tab.index < maxIndex) {
          await chrome.tabs.move(tab.id, { windowId: tab.windowId, index: maxIndex });
        }
      }
    } else {
      await chrome.tabs.move(tab.id, { windowId: tab.windowId, index: -1 });
    }
  } catch (error) {
    console.warn("[Dynamic Tab Groups] Failed to move tab to right:", error);
  }
}
