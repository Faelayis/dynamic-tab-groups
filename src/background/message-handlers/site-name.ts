export async function handleSiteNameReport(message: any, sender: chrome.runtime.MessageSender, settings: any) {
  if (!settings.renameGroupToSiteName) return;

  const tabId = sender.tab?.id;
  const siteName = message.siteName;
  if (tabId === undefined || !siteName) return;

  try {
    const currentTab = await chrome.tabs.get(tabId);
    const groupId = currentTab.groupId;
    if (groupId !== undefined && groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      if (siteName.length <= 25) {
        const group = await chrome.tabGroups.get(groupId);
        if (group.title !== siteName) {
           await chrome.tabGroups.update(groupId, { title: siteName });
           console.log(`[Dynamic Tab Groups] Renamed group ${groupId} to site name: ${siteName}`);
        }
      }
    }
  } catch (error) {
    // 
  }
}
