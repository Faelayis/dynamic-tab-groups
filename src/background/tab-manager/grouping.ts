import { extractDomain } from "../../shared/domain/index.ts";
import type { TabGroupColor } from "../../types/index.ts";
import { extractDominantColor } from "../color-extractor/extractDominantColor.ts";
import { createOrUpdateGroup } from "../group-manager/createOrUpdateGroup.ts";
import { findGroupByTitle } from "../group-manager/findGroupByTitle.ts";
import { isTabGrouped } from "../group-manager/isTabGrouped.ts";
import { ungroupTabs } from "../group-manager/ungroupTabs.ts";
import { isInSplitView } from "./splitView.ts";

export async function groupDomainTabs(
  windowId: number,
  domain: string,
  tabIds: number[],
  allTabs: chrome.tabs.Tab[],
  settings: { groupChromePages: boolean },
): Promise<void> {
  const existingGroupId = await findGroupByTitle(windowId, domain);
  const color = await resolveColor(domain, allTabs, settings);

  let tabsToGroup = tabIds;
  if (existingGroupId !== undefined) {
    tabsToGroup = tabIds.filter((id) => {
      const t = allTabs.find((tab) => tab.id === id);
      return t && t.groupId !== existingGroupId;
    });

    if (tabsToGroup.length === 0) {
      try {
        const group = await chrome.tabGroups.get(existingGroupId);
        if (group.color !== color) {
          await chrome.tabGroups.update(existingGroupId, { color });
        }
      } catch {}
      return;
    }
  } else {
    tabsToGroup = tabIds.filter((id) => {
      const t = allTabs.find((tab) => tab.id === id);
      return t && t.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE;
    });

    if (tabsToGroup.length === 0) return;
  }

  await createOrUpdateGroup(windowId, tabsToGroup, domain, color, existingGroupId);
}

export async function maybeUngroupSingleTab(
  tabId: number,
  allTabs: chrome.tabs.Tab[],
): Promise<void> {
  const tab = allTabs.find((t) => t.id === tabId);
  if (tab && isTabGrouped(tab)) {
    await ungroupTabs([tabId]);
  }
}

export async function resolveColor(
  domain: string,
  tabs: chrome.tabs.Tab[],
  settings: { groupChromePages: boolean },
): Promise<TabGroupColor> {
  const tabWithUrl = tabs.find((t) => {
    if (!t.url) return false;
    return extractDomain(t.url, settings.groupChromePages) === domain;
  });

  if (!tabWithUrl?.url) return "grey";

  return extractDominantColor(tabWithUrl.url, domain);
}

export async function enforceGroupSortOrder(
  windowId: number,
  tabs: chrome.tabs.Tab[],
  settings: { respectSplitView: boolean },
): Promise<void> {
  try {
    let groups = await chrome.tabGroups.query({ windowId });
    groups = groups.filter((g) => g.windowId === windowId);
    if (groups.length <= 1) return;

    if (settings.respectSplitView && tabs.some(isInSplitView)) return;

    const currentOrder: number[] = [];
    let minGroupIndex = Infinity;

    for (const tab of tabs) {
      if (
        tab.groupId !== undefined &&
        tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
      ) {
        minGroupIndex = Math.min(minGroupIndex, tab.index);
        if (
          currentOrder.length === 0 ||
          currentOrder[currentOrder.length - 1] !== tab.groupId
        ) {
          currentOrder.push(tab.groupId);
        }
      }
    }

    const sortedGroups = [...groups].sort((a, b) =>
      (a.title || "").localeCompare(b.title || ""),
    );
    const sortedIds = sortedGroups.map((g) => g.id);

    let isSorted = true;
    for (let i = 0; i < sortedIds.length; i++) {
      if (currentOrder[i] !== sortedIds[i]) {
        isSorted = false;
        break;
      }
    }

    if (isSorted) return;

    let currentIndex = minGroupIndex;
    for (const group of sortedGroups) {
      await chrome.tabGroups.move(group.id, { windowId, index: currentIndex });
      const groupTabs = tabs.filter((t) => t.groupId === group.id);
      currentIndex += groupTabs.length;
    }
  } catch (error) {
    console.warn("[Dynamic Tab Groups] Failed to sort groups:", error);
  }
}
