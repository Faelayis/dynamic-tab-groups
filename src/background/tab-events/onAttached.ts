import { scheduleEvaluation } from "../tab-manager/evaluation.ts";
import { getDisplayIdForWindow } from "../tab-manager/display.ts";
import { tabIdToUuid } from "../uuid-tracker/tabIdToUuid.ts";

export async function onAttached(
  tabId: number,
  attachInfo: { newWindowId: number; newPosition: number },
) {
  const uuid = tabIdToUuid.get(tabId);
  if (uuid) {
    const displayId = (await getDisplayIdForWindow(attachInfo.newWindowId)) || "unknown";
    await chrome.storage.local.set({ [uuid]: displayId });
    console.log(
      `[Dynamic Tab Groups] Tab ${tabId} attached to new window. Updated UUID ${uuid} to display: ${displayId}`,
    );
  }
  scheduleEvaluation(attachInfo.newWindowId);
}
