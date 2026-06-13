import { extractDomain } from "../shared/domain.ts";
import { getSettings } from "../shared/storage.ts";
import type { TabGroupColor } from "../shared/types.ts";
import { extractDominantColor } from "./color-extractor.ts";
import {
  createOrUpdateGroup,
  findGroupByTitle,
  isTabGrouped,
  ungroupTabs,
} from "./group-manager.ts";

const pendingEvaluations = new Map<number, ReturnType<typeof setTimeout>>();

export function scheduleEvaluation(windowId: number, delayMs = 500): void {
  const existing = pendingEvaluations.get(windowId);
  if (existing !== undefined) {
    clearTimeout(existing);
  }

  pendingEvaluations.set(
    windowId,
    setTimeout(() => {
      pendingEvaluations.delete(windowId);
      evaluateWindow(windowId).catch((error) => {
        console.error(`[Auto Tabs] Error evaluating window ${windowId}:`, error);
      });
    }, delayMs),
  );
}

export async function evaluateAllWindows(): Promise<void> {
  const windows = await chrome.windows.getAll({ windowTypes: ["normal"] });
  for (const win of windows) {
    if (win.id !== undefined) {
      scheduleEvaluation(win.id);
    }
  }
}

export async function getDisplayIdForWindow(
  windowId: number,
): Promise<string | undefined> {
  try {
    const displays = await chrome.system.display.getInfo();
    const win = await chrome.windows.get(windowId);

    if (
      win.left !== undefined &&
      win.top !== undefined &&
      win.width !== undefined &&
      win.height !== undefined
    ) {
      const centerX = win.left + win.width / 2;
      const centerY = win.top + win.height / 2;

      const display = displays.find(
        (d) =>
          centerX >= d.bounds.left &&
          centerX < d.bounds.left + d.bounds.width &&
          centerY >= d.bounds.top &&
          centerY < d.bounds.top + d.bounds.height,
      );
      return display?.id;
    }
  } catch (error) {
    console.warn("[Auto Tabs] Failed to check display bounds:", error);
  }
  return undefined;
}

async function evaluateWindow(windowId: number): Promise<void> {
  const settings = await getSettings();
  if (!settings.enabled) return;

  const displayId = await getDisplayIdForWindow(windowId);
  console.log("Window is on display:", displayId);

  if (!displayId) {
    console.log(`[Auto Tabs] Window ${windowId} is off-screen. Skipping evaluation.`);
    return;
  }

  const tabs = await chrome.tabs.query({ windowId });
  const domainTabs = new Map<string, number[]>();

  for (const tab of tabs) {
    if (tab.id === undefined || !tab.url) continue;
    if (settings.ignorePinnedTabs && tab.pinned) continue;

    const domain = extractDomain(tab.url, settings.groupChromePages);
    if (!domain) continue;

    const ids = domainTabs.get(domain) ?? [];
    ids.push(tab.id);
    domainTabs.set(domain, ids);
  }

  for (const [domain, tabIds] of domainTabs) {
    try {
      if (tabIds.length >= 2) {
        await groupDomainTabs(windowId, domain, tabIds, tabs, settings);
      } else if (tabIds.length === 1 && settings.closeSingleTabGroups) {
        await maybeUngroupSingleTab(tabIds[0]!, tabs);
      }
    } catch (error) {
      console.warn(`[Auto Tabs] Failed to process domain "${domain}":`, error);
    }
  }

  if (settings.sortGroupsAlphabetically) {
    await enforceGroupSortOrder(windowId, tabs);
  }

  try {
    if (settings.collapseGroupsWhenNotInUse) {
      const activeTabs = await chrome.tabs.query({ windowId, active: true });
      if (activeTabs.length > 0) {
        const activeGroupId = activeTabs[0]!.groupId;
        let groups = await chrome.tabGroups.query({ windowId });
        groups = groups.filter((g) => g.windowId === windowId);
        for (const group of groups) {
          const shouldBeCollapsed = group.id !== activeGroupId;
          if (group.collapsed !== shouldBeCollapsed) {
            await chrome.tabGroups.update(group.id, { collapsed: shouldBeCollapsed });
          }
        }
      }
    }
  } catch (error) {
    console.warn("[Auto Tabs] Ignored collapse during tab drag:", error);
  }
}

async function enforceGroupSortOrder(
  windowId: number,
  tabs: chrome.tabs.Tab[],
): Promise<void> {
  try {
    let groups = await chrome.tabGroups.query({ windowId });
    groups = groups.filter((g) => g.windowId === windowId);
    if (groups.length <= 1) return;

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
    console.warn("[Auto Tabs] Failed to sort groups:", error);
  }
}

async function groupDomainTabs(
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

async function maybeUngroupSingleTab(
  tabId: number,
  allTabs: chrome.tabs.Tab[],
): Promise<void> {
  const tab = allTabs.find((t) => t.id === tabId);
  if (tab && isTabGrouped(tab)) {
    await ungroupTabs([tabId]);
  }
}

async function resolveColor(
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

export async function moveNewTabToRight(tab: chrome.tabs.Tab): Promise<void> {
  const settings = await getSettings();
  if (!settings.enabled) return;
  if (tab.id === undefined || tab.windowId === undefined) return;
  if (settings.ignorePinnedTabs && tab.pinned) return;

  try {
    const displayId = await getDisplayIdForWindow(tab.windowId);
    console.log("Window is on display:", displayId);
    if (!displayId) return;
  } catch {
    //
  }

  try {
    if (tab.groupId !== undefined && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      const tabsInGroup = await chrome.tabs.query({ groupId: tab.groupId });
      if (tabsInGroup.length > 0) {
        const maxIndex = Math.max(...tabsInGroup.map((t) => t.index));
        if (tab.index < maxIndex) {
          await chrome.tabs.move(tab.id, { windowId: tab.windowId, index: maxIndex });
        }
      }
    } else {
      await chrome.tabs.move(tab.id, { windowId: tab.windowId, index: -1 });
    }
  } catch (error) {
    console.warn("[Auto Tabs] Failed to move tab to right:", error);
  }
}
