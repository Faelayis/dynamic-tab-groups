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
