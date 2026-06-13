export async function isChromeStartup(): Promise<boolean> {
  const res = await chrome.storage.session.get(["chromeStarted", "startupTime"]);
  const now = Date.now();
  if (!res.chromeStarted) {
    await chrome.storage.session.set({ chromeStarted: true, startupTime: now });
    return true;
  }
  if (res.startupTime && now - (res.startupTime as number) < 1500) {
    return true;
  }
  return false;
}
