import { getSettings } from "../../shared/storage/index.ts";
import { isChromeStartup } from "../startup/isChromeStartup.ts";

const previousActiveTabIds: Record<number, number> = {};

export async function onActivated(activeInfo: { tabId: number; windowId: number }) {
  const currentTabId = activeInfo.tabId;
  const windowId = activeInfo.windowId;
  const previousTabId = previousActiveTabIds[windowId];
  previousActiveTabIds[windowId] = currentTabId;

  const settings = await getSettings();
  if (!settings.enabled) return;

  setTimeout(async () => {
    try {
      const activeTab = await chrome.tabs.get(currentTabId);
      const activeGroupId = activeTab.groupId;
      const tabToSortId =
        settings.sortOnActiveTab !== false ? currentTabId : previousTabId;

      if (tabToSortId !== undefined) {
        try {
          const tabToSort = await chrome.tabs.get(tabToSortId);
          const tabToSortGroupId = tabToSort.groupId;

          if (!(settings.ignorePinnedTabs && tabToSort.pinned)) {
            if (
              tabToSortGroupId !== undefined &&
              tabToSortGroupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
            ) {
              if (settings.moveRecentlyTabToRightGroup) {
                if (!(await isChromeStartup())) {
                  const groupTabs = await chrome.tabs.query({
                    groupId: tabToSortGroupId,
                  });
                  if (groupTabs.length > 1) {
                    const maxIndex = Math.max(...groupTabs.map((t) => t.index));
                    if (tabToSort.index < maxIndex && tabToSort.id !== undefined) {
                      await chrome.tabs.move(tabToSort.id, {
                        windowId: tabToSort.windowId,
                        index: maxIndex,
                      });
                    }
                  }
                }
              }
            } else if (tabToSortGroupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
              if (
                settings.moveRecentlyTabToRight ||
                settings.moveRecentlyTabToRightBeforeNewTab
              ) {
                if (!(await isChromeStartup())) {
                  const allTabs = await chrome.tabs.query({
                    windowId: tabToSort.windowId,
                  });
                  const ungroupedTabs = allTabs.filter(
                    (t) =>
                      t.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE &&
                      !(settings.ignorePinnedTabs && t.pinned),
                  );
                  if (ungroupedTabs.length > 1) {
                    let targetIndex = Math.max(...ungroupedTabs.map((t) => t.index));

                    if (settings.moveRecentlyTabToRightBeforeNewTab) {
                      const sortedUngrouped = [...ungroupedTabs].sort(
                        (a, b) => a.index - b.index,
                      );
                      while (sortedUngrouped.length > 0) {
                        const lastTab = sortedUngrouped[sortedUngrouped.length - 1];
                        if (!lastTab) break;
                        const url = lastTab.pendingUrl || lastTab.url || "";
                        const isNewTab =
                          url === "chrome://newtab/" || url === "edge://newtab/";

                        if (isNewTab && lastTab.id !== tabToSort.id) {
                          sortedUngrouped.pop();
                          targetIndex = lastTab.index - 1;
                        } else {
                          break;
                        }
                      }
                    }

                    if (tabToSort.index < targetIndex && tabToSort.id !== undefined) {
                      await chrome.tabs.move(tabToSort.id, {
                        windowId: tabToSort.windowId,
                        index: targetIndex,
                      });
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          //
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
