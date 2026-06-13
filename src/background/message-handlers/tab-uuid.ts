import { getDisplayIdForWindow } from "../tab-manager/display.ts";
import { moveNewTabToRight } from "../tab-manager/movement.ts";
import { tabIdToUuid } from "../uuid-tracker/tabIdToUuid.ts";

export async function handleTabUuidReport(message: any, sender: chrome.runtime.MessageSender, settings: any) {
  if (!settings.useUuidTracker) return;

  const uuid = message.uuid;
  const tabId = sender.tab?.id;
  if (tabId === undefined) return;

  tabIdToUuid.set(tabId, uuid);

  chrome.storage.local.get(uuid, async (result) => {
    if (result[uuid]) {
      console.log(`[Dynamic Tab Groups] UUID Tracker - Tab ${tabId} is restored (UUID: ${uuid}). Skipping move.`);
    } else {
      if (!sender.tab) return;
      const displayId = (await getDisplayIdForWindow(sender.tab.windowId!)) || "unknown";
      await chrome.storage.local.set({ [uuid]: displayId });
      
      try {
        const currentTab = await chrome.tabs.get(tabId);
        
        if (!currentTab.active && currentTab.openerTabId === undefined) {
          console.log(`[Dynamic Tab Groups] UUID Tracker - Tab ${tabId} is a background tab (First-run restore). Skipping move.`);
          return;
        }

        console.log(`[Dynamic Tab Groups] UUID Tracker - Brand new tab detected (UUID: ${uuid}). Moving to right.`);
        if (currentTab) await moveNewTabToRight(currentTab);
      } catch {}
    }
  });
}
