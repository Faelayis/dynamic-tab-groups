import { extractDomain } from "../../shared/domain/index.ts";
import { getSettings } from "../../shared/storage/index.ts";
import { getDisplayIdForWindow } from "./display.ts";
import {
  enforceGroupSortOrder,
  groupDomainTabs,
  maybeUngroupSingleTab,
} from "./grouping.ts";

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
        console.error(`[Dynamic Tab Groups] Error evaluating window ${windowId}:`, error);
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

export async function evaluateWindow(windowId: number): Promise<void> {
  const settings = await getSettings();
  if (!settings.enabled) return;

  const displayId = await getDisplayIdForWindow(windowId);
  console.log("Window is on display:", displayId);

  if (!displayId) {
    console.log(
      `[Dynamic Tab Groups] Window ${windowId} is off-screen. Skipping evaluation.`,
    );
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
      console.warn(`[Dynamic Tab Groups] Failed to process domain "${domain}":`, error);
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
    console.warn("[Dynamic Tab Groups] Ignored collapse during tab drag:", error);
  }
}
