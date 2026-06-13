import { setSettings } from "../../shared/storage/index.ts";
import { evaluateAllWindows } from "../tab-manager/evaluation.ts";

export async function onClicked(info: chrome.contextMenus.OnClickData) {
  const key = info.menuItemId as string;
  
  if (key === "reload-all") {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id !== undefined && tab.url && !tab.url.startsWith("chrome://")) {
          chrome.tabs.reload(tab.id).catch(() => {});
        }
      }
    });
    return;
  }

  if (!key.startsWith("toggle-")) return;

  const settingKey = key.replace("toggle-", "");
  const checked = info.checked ?? false;
  await setSettings({ [settingKey]: checked });

  if (settingKey === "enabled" || checked) {
    evaluateAllWindows();
  }
}
