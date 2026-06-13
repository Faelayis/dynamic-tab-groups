import { getDisplayIdForWindow } from "../tab-manager/display.ts";
import { tabIdToUuid } from "../uuid-tracker/tabIdToUuid.ts";

export async function onBoundsChanged(window: chrome.windows.Window) {
  if (window.id !== undefined) {
    const displayId = (await getDisplayIdForWindow(window.id)) || "unknown";
    const tabs = await chrome.tabs.query({ windowId: window.id });

    for (const tab of tabs) {
      if (tab.id !== undefined) {
        const uuid = tabIdToUuid.get(tab.id);
        if (uuid) {
          await chrome.storage.local.set({ [uuid]: displayId });
        }
      }
    }
  }
}
