import type { TabGroupColor } from "../shared/types.ts";


export async function createOrUpdateGroup(
  windowId: number,
  tabIds: number[],
  title: string,
  color: TabGroupColor,
  existingGroupId?: number,
): Promise<number> {
  if (tabIds.length === 0) return -1;

  const tabIdsTuple = tabIds as [number, ...number[]];

  let groupId: number;
  if (existingGroupId !== undefined) {
    groupId = await chrome.tabs.group({
      tabIds: tabIdsTuple,
      groupId: existingGroupId,
    });
  } else {
    groupId = await chrome.tabs.group({
      tabIds: tabIdsTuple,
      createProperties: { windowId },
    });
  }

  let groupTitle = title;
  if (existingGroupId !== undefined) {
    try {
      const existingGroup = await chrome.tabGroups.get(existingGroupId);
      if (existingGroup.title && existingGroup.title.toLowerCase() === title.toLowerCase()) {
        groupTitle = existingGroup.title;
      }
    } catch {
      // 
    }
  }

  await chrome.tabGroups.update(groupId, { title: groupTitle, color });

  return groupId;
}


export async function ungroupTabs(tabIds: number[]): Promise<void> {
  if (tabIds.length === 0) return;

  const tabIdsTuple = tabIds as [number, ...number[]];
  await chrome.tabs.ungroup(tabIdsTuple);
}


export function isTabGrouped(tab: chrome.tabs.Tab): boolean {
  return tab.groupId !== undefined && tab.groupId !== -1;
}


export async function findGroupByTitle(
  windowId: number,
  title: string,
): Promise<number | undefined> {
  try {
    const groups = await chrome.tabGroups.query({ windowId });
    const groupInWindow = groups.find((g) => 
      g.windowId === windowId && 
      g.title?.toLowerCase() === title.toLowerCase()
    );
    return groupInWindow?.id;
  } catch {
    return undefined;
  }
}
