import { isNewTabPage } from "../../shared/newtab.ts";
import { getSettings } from "../../shared/storage/index.ts";
import type { ExtensionSettings } from "../../types/index.ts";
import { isChromeStartup } from "../startup/isChromeStartup.ts";
import {
  getSplitViewBlockForTab,
  getSplitViewBlocks,
  isInSplitView,
} from "../tab-manager/splitView.ts";

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
            if (settings.respectSplitView && isInSplitView(tabToSort)) {
              if (settings.moveRecentlySplitViewToRight) {
                if (!(await isChromeStartup())) {
                  await moveSplitViewBlockToRight(tabToSort, settings);
                }
              }
            } else if (
              tabToSortGroupId !== undefined &&
              tabToSortGroupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
            ) {
              if (settings.moveRecentlyTabToRightGroup) {
                if (!(await isChromeStartup())) {
                  const groupTabs = await chrome.tabs.query({
                    groupId: tabToSortGroupId,
                  });
                  const groupTabsFiltered = settings.respectSplitView
                    ? groupTabs.filter((t) => !isInSplitView(t))
                    : groupTabs;
                  if (groupTabsFiltered.length > 1) {
                    const maxIndex = Math.max(...groupTabsFiltered.map((t) => t.index));
                    if (tabToSort.index < maxIndex && tabToSort.id !== undefined) {
                      await chrome.tabs.move(tabToSort.id, {
                        index: maxIndex,
                        windowId: tabToSort.windowId,
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
                  await moveUngroupedTabToRight(tabToSort, settings);
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

async function moveSplitViewBlockToRight(
  tabToSort: chrome.tabs.Tab,
  settings: ExtensionSettings,
): Promise<void> {
  if (tabToSort.id === undefined || tabToSort.windowId === undefined) return;

  const allTabs = await chrome.tabs.query({ windowId: tabToSort.windowId });
  const block = getSplitViewBlockForTab(allTabs, tabToSort.id);
  if (!block || block.length === 0) return;

  const blockMinIndex = block[0]!.index;

  let tabsToMove = allTabs.filter(
    (t) =>
      t.id !== undefined &&
      t.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE &&
      !(settings.ignorePinnedTabs && t.pinned) &&
      !isInSplitView(t) &&
      t.index > blockMinIndex,
  );

  if (tabsToMove.length === 0) return;

  tabsToMove = [...tabsToMove].sort((a, b) => a.index - b.index);

  if (settings.moveRecentlyTabToRightBeforeNewTab) {
    while (tabsToMove.length > 0) {
      const lastTab = tabsToMove[tabsToMove.length - 1];
      if (!lastTab) break;
      if (isNewTabPage(lastTab)) {
        tabsToMove = tabsToMove.slice(0, -1);
      } else {
        break;
      }
    }
  }

  if (tabsToMove.length === 0) return;

  const tabIds = tabsToMove
    .map((t) => t.id)
    .filter((id): id is number => id !== undefined);

  try {
    await chrome.tabs.move(tabIds, {
      index: blockMinIndex,
      windowId: tabToSort.windowId,
    });
  } catch (error) {
    console.warn("[Dynamic Tab Groups] Failed to move split view block:", error);
  }
}

async function moveUngroupedTabToRight(
  tabToSort: chrome.tabs.Tab,
  settings: ExtensionSettings,
): Promise<void> {
  if (tabToSort.id === undefined || tabToSort.windowId === undefined) return;

  const allTabs = await chrome.tabs.query({ windowId: tabToSort.windowId });

  const ungroupedTabs = allTabs.filter(
    (t) =>
      t.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE &&
      !(settings.ignorePinnedTabs && t.pinned) &&
      !(settings.respectSplitView && isInSplitView(t)),
  );

  const splitViewBlocks = settings.respectSplitView ? getSplitViewBlocks(allTabs) : [];

  if (ungroupedTabs.length <= 1 && splitViewBlocks.length === 0) return;

  const candidateIndexes: number[] = [];
  for (const t of ungroupedTabs) candidateIndexes.push(t.index);
  for (const b of splitViewBlocks) candidateIndexes.push(b[b.length - 1]!.index + 1);

  let targetIndex =
    candidateIndexes.length > 0 ? Math.max(...candidateIndexes) : tabToSort.index;

  console.log("[Dynamic Tab Groups] [BeforeNewTab][diag] settings:", {
    moveRecentlyTabToRight: settings.moveRecentlyTabToRight,
    moveRecentlyTabToRightBeforeNewTab: settings.moveRecentlyTabToRightBeforeNewTab,
  });
  console.log("[Dynamic Tab Groups] [BeforeNewTab][diag] tabToSort:", {
    id: tabToSort.id,
    index: tabToSort.index,
  });
  console.log(
    "[Dynamic Tab Groups] [BeforeNewTab][diag] ungrouped tabs:",
    ungroupedTabs.map((t) => ({
      index: t.index,
      url: t.url,
      pendingUrl: t.pendingUrl,
      isNewTab: isNewTabPage(t),
    })),
  );

  if (settings.moveRecentlyTabToRightBeforeNewTab) {
    const sortedUngrouped = [...ungroupedTabs].sort((a, b) => a.index - b.index);
    while (sortedUngrouped.length > 0) {
      const lastTab = sortedUngrouped[sortedUngrouped.length - 1];
      if (!lastTab) break;
      if (isNewTabPage(lastTab) && lastTab.id !== tabToSort.id) {
        sortedUngrouped.pop();
        targetIndex = Math.min(targetIndex, lastTab.index - 1);
      } else {
        break;
      }
    }
  }

  console.log(
    "[Dynamic Tab Groups] [BeforeNewTab][diag] final targetIndex:",
    targetIndex,
  );

  if (tabToSort.index < targetIndex && tabToSort.id !== undefined) {
    await chrome.tabs.move(tabToSort.id, {
      index: targetIndex,
      windowId: tabToSort.windowId,
    });
    console.log(
      "[Dynamic Tab Groups] [BeforeNewTab][diag] moved tab",
      tabToSort.id,
      "to index",
      targetIndex,
    );
  } else {
    console.log(
      "[Dynamic Tab Groups] [BeforeNewTab][diag] no move — tabToSort.index",
      tabToSort.index,
      "not < targetIndex",
      targetIndex,
    );
  }
}
