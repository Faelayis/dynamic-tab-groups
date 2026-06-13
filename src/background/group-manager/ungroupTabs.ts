export async function ungroupTabs(tabIds: number[]): Promise<void> {
  if (tabIds.length === 0) return;

  const tabIdsTuple = tabIds as [number, ...number[]];
  await chrome.tabs.ungroup(tabIdsTuple);
}
