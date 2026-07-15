import { onClicked } from "./context-menus/onClicked.ts";
import { onInstalled } from "./context-menus/onInstalled.ts";

export function setupContextMenus() {
  chrome.runtime.onInstalled.addListener(onInstalled);
  chrome.contextMenus.onClicked.addListener(onClicked);
}
