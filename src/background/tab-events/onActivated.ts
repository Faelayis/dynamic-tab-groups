import { getSettings } from "../../shared/storage/index.ts";
import { isChromeStartup } from "../startup/isChromeStartup.ts";

export async function onActivated(activeInfo: { tabId: number; windowId: number }) {
  const settings = await getSettings();
  if (!settings.enabled) return;

  setTimeout(async () => {
    try {
      const activeTab = await chrome.tabs.get(activeInfo.tabId);
      const activeGroupId = activeTab.groupId;

      if (settings.ignorePinnedTabs && activeTab.pinned) {
        return;
      }

      if (
        activeGroupId !== undefined &&
        activeGroupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
      ) {
        if (settings.moveActiveTabToRightGroup) {
          if (!(await isChromeStartup())) {
            const groupTabs = await chrome.tabs.query({ groupId: activeGroupId });
            if (groupTabs.length > 1) {
              const maxIndex = Math.max(...groupTabs.map((t) => t.index));
              if (activeTab.index < maxIndex && activeTab.id !== undefined) {
                await chrome.tabs.move(activeTab.id, {
                  windowId: activeTab.windowId,
                  index: maxIndex,
                });
              }
            }
          }
        }
      } else if (activeGroupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
        if (settings.moveActiveTabToRight || settings.moveActiveTabToRightBeforeNewTab) {
          if (!(await isChromeStartup())) {
            const allTabs = await chrome.tabs.query({ windowId: activeTab.windowId });
            const ungroupedTabs = allTabs.filter(
              (t) =>
                t.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE &&
                !(settings.ignorePinnedTabs && t.pinned),
            );
            if (ungroupedTabs.length > 1) {
              let targetIndex = Math.max(...ungroupedTabs.map((t) => t.index));

              if (settings.moveActiveTabToRightBeforeNewTab) {
                const sortedUngrouped = [...ungroupedTabs].sort(
                  (a, b) => a.index - b.index,
                );
                while (sortedUngrouped.length > 0) {
                  const lastTab = sortedUngrouped[sortedUngrouped.length - 1];
                  const url = lastTab.pendingUrl || lastTab.url || "";
                  const isNewTab = url === "chrome://newtab/" || url === "edge://newtab/";

                  if (isNewTab && lastTab.id !== activeTab.id) {
                    sortedUngrouped.pop();
                    targetIndex = lastTab.index - 1;
                  } else {
                    break;
                  }
                }
              }

              if (activeTab.index < targetIndex && activeTab.id !== undefined) {
                await chrome.tabs.move(activeTab.id, {
                  windowId: activeTab.windowId,
                  index: targetIndex,
                });
              }
            }
          }
        }
      }

      if (settings.collapseGroupsWhenNotInUse) {
        let groups = await chrome.tabGroups.query({ windowId: activeInfo.windowId });
        groups = groups.filter((g) => g.windowId === activeInfo.windowId);
        for (const group of groups) {
          const shouldBeCollapsed = group.id !== activeGroupId;
          if (group.collapsed !== shouldBeCollapsed) {
            await chrome.tabGroups.update(group.id, { collapsed: shouldBeCollapsed });
          }
        }
      }
    } catch (error) {
      //
    }
  }, 250);
}
