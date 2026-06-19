export function isInSplitView(tab: chrome.tabs.Tab): boolean {
  return tab.splitViewId !== undefined && tab.splitViewId >= 0;
}

export function getSplitViewBlocks(tabs: chrome.tabs.Tab[]): chrome.tabs.Tab[][] {
  const byId = new Map<number, chrome.tabs.Tab[]>();

  for (const tab of tabs) {
    if (tab.splitViewId === undefined || tab.splitViewId < 0) continue;
    const bucket = byId.get(tab.splitViewId);
    if (bucket) {
      bucket.push(tab);
    } else {
      byId.set(tab.splitViewId, [tab]);
    }
  }

  const blocks: chrome.tabs.Tab[][] = [];
  for (const bucket of byId.values()) {
    bucket.sort((a, b) => a.index - b.index);
    blocks.push(bucket);
  }
  blocks.sort((a, b) => a[0]!.index - b[0]!.index);
  return blocks;
}

export function getSplitViewBlockForTab(
  tabs: chrome.tabs.Tab[],
  tabId: number,
): chrome.tabs.Tab[] | undefined {
  const target = tabs.find((t) => t.id === tabId);
  if (!target || target.splitViewId === undefined || target.splitViewId < 0) {
    return undefined;
  }
  const block = tabs.filter((t) => t.splitViewId === target.splitViewId);
  block.sort((a, b) => a.index - b.index);
  return block;
}
