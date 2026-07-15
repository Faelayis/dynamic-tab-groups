import type { TabGroupColor } from "../../types/index.ts";

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
      groupId: existingGroupId,
      tabIds: tabIdsTuple,
    });
  } else {
    groupId = await chrome.tabs.group({
      createProperties: { windowId },
      tabIds: tabIdsTuple,
    });
  }

  let groupTitle = title;
  if (existingGroupId !== undefined) {
    try {
      const existingGroup = await chrome.tabGroups.get(existingGroupId);
      if (
        existingGroup.title &&
        existingGroup.title.toLowerCase() === title.toLowerCase()
      ) {
        groupTitle = existingGroup.title;
      }
    } catch {
      //
    }
  }

  await chrome.tabGroups.update(groupId, { title: groupTitle, color });

  return groupId;
}
