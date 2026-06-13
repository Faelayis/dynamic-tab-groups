export function setupStartup() {
  chrome.runtime.onStartup.addListener(async () => {
    const { getSettings } = await import("../../shared/storage/index.ts");
    const settings = await getSettings();
    if (settings.enabled) {
      chrome.system.display.getInfo((displays) => {
        console.log("[Dynamic Tab Groups] Chrome started — System displays:", displays);
      });
    }
  });
}
