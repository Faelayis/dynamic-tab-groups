import { onInstalled } from "./context-menus/onInstalled.ts";
import { onClicked } from "./context-menus/onClicked.ts";

export function setupContextMenus() {
  chrome.runtime.onInstalled.addListener(onInstalled);
  chrome.contextMenus.onClicked.addListener(onClicked);
}
