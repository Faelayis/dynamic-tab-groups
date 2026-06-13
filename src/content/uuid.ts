export function initAutoTabsUUID() {
  const STORAGE_KEY = "__auto_tabs_uuid";

  try {
    let uuid = sessionStorage.getItem(STORAGE_KEY);

    if (!uuid) {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        uuid = crypto.randomUUID();
      } else {
        uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c == "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
      sessionStorage.setItem(STORAGE_KEY, uuid);
    }

    chrome.runtime.sendMessage({
      type: "TAB_UUID_REPORT",
      uuid: uuid,
    });
  } catch (error) {
    console.warn("[Dynamic Tab Groups] Failed to initialize UUID:", error);
  }
}
