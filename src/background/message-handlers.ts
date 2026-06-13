import { getSettings } from "../shared/storage/index.ts";
import { handleTabUuidReport } from "./message-handlers/tab-uuid.ts";
import { handleSiteNameReport } from "./message-handlers/site-name.ts";

export function setupMessageHandlers() {
  chrome.runtime.onMessage.addListener(async (message, sender) => {
    const settings = await getSettings();

    if (message.type === "TAB_UUID_REPORT" && sender.tab) {
      await handleTabUuidReport(message, sender, settings);
    }

    if (message.type === "OG_SITE_NAME_REPORT" && sender.tab) {
      await handleSiteNameReport(message, sender, settings);
    }
  });
}
