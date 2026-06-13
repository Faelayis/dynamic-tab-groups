import { scheduleEvaluation } from "../tab-manager/evaluation.ts";
import { tabIdToUuid } from "../uuid-tracker/tabIdToUuid.ts";

export function onRemoved(
  tabId: number,
  removeInfo: { isWindowClosing: boolean; windowId: number },
) {
  if (removeInfo.isWindowClosing) return;

  const uuid = tabIdToUuid.get(tabId);
  if (uuid) {
    chrome.storage.local.remove(uuid);
    tabIdToUuid.delete(tabId);
    console.log(
      `[Dynamic Tab Groups] Cleaned up UUID from storage for closed tab: ${uuid}`,
    );
  }

  scheduleEvaluation(removeInfo.windowId);
}
