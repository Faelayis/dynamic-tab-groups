import { getSettings } from "../shared/storage/index.ts";

export function setupCommands() {
  chrome.commands.onCommand.addListener(async (command) => {
    if (command === "move-tab-right" || command === "move-tab-left") {
      try {
        const [activeTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!activeTab || activeTab.id === undefined) return;

        const settings = await getSettings();
        if (settings.ignorePinnedTabs && activeTab.pinned) return;

        const windows = await chrome.windows.getAll({ windowTypes: ["normal"] });
        const currentWindowIndex = windows.findIndex((w) => w.id === activeTab.windowId);

        let targetWindowIndex = -1;
        if (command === "move-tab-right") {
          if (currentWindowIndex < windows.length - 1) {
            targetWindowIndex = currentWindowIndex + 1;
          }
        } else if (command === "move-tab-left") {
          if (currentWindowIndex > 0) {
            targetWindowIndex = currentWindowIndex - 1;
          }
        }

        if (targetWindowIndex !== -1) {
          const targetWindow = windows[targetWindowIndex];
          if (targetWindow && targetWindow.id !== undefined) {
            await chrome.tabs.move(activeTab.id, {
              index: -1,
              windowId: targetWindow.id,
            });
            await chrome.tabs.update(activeTab.id, { active: true });
            await chrome.windows.update(targetWindow.id, { focused: true });
          }
        }
      } catch (error) {
        console.error("[Dynamic Tab Groups] Error moving tab:", error);
      }
    }
  });
}
