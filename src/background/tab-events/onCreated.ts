import { getSettings } from "../../shared/storage/index.ts";
import { scheduleEvaluation } from "../tab-manager/evaluation.ts";
import { moveNewTabToRight } from "../tab-manager/movement.ts";

export async function onCreated(tab: chrome.tabs.Tab) {
  const settings = await getSettings();

  if (!settings.useUuidTracker) {
    const isFromLink = tab.openerTabId !== undefined;
    const isNewTabPage =
      tab.pendingUrl === "chrome://newtab/" || tab.url === "chrome://newtab/";

    if (isFromLink || isNewTabPage) {
      setTimeout(async () => {
        try {
          const currentTab = await chrome.tabs.get(tab.id!);
          if (currentTab) await moveNewTabToRight(currentTab);
        } catch {}
      }, 200);
    } else {
      console.log(
        `[Dynamic Tab Groups] onCreated - Ignored non-human tab creation: ${tab.id}`,
      );
    }
  }

  if (tab.windowId !== undefined) {
    scheduleEvaluation(tab.windowId);
  }
}
