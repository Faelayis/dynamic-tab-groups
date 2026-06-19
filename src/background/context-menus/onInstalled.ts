import { getSettings } from "../../shared/storage/index.ts";
import { evaluateAllWindows } from "../tab-manager/evaluation.ts";

export async function onInstalled() {
  const settings = await getSettings();

  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: "toggle-closeSingleTabGroups",
    title: "Close Single-Tab Groups",
    type: "checkbox",
    checked: settings.closeSingleTabGroups,
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "toggle-collapseGroupsWhenNotInUse",
    title: "Collapse Groups When Not in Use",
    type: "checkbox",
    checked: settings.collapseGroupsWhenNotInUse,
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "sort-menu",
    title: "Sort",
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "toggle-ignorePinnedTabs",
    parentId: "sort-menu",
    title: "Ignore Pinned Tabs",
    type: "checkbox",
    checked: settings.ignorePinnedTabs,
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "toggle-sortOnActiveTab",
    parentId: "sort-menu",
    title: "Mode Active Tab or Exit Tab",
    type: "checkbox",
    checked: settings.sortOnActiveTab,
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "toggle-moveRecentlyTabToRight",
    parentId: "sort-menu",
    title: "Move Recently Tab to Right",
    type: "checkbox",
    checked: settings.moveRecentlyTabToRight,
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "toggle-moveRecentlyTabToRightBeforeNewTab",
    parentId: "sort-menu",
    title: "Recently Tab to Right (Before New Tab)",
    type: "checkbox",
    checked: settings.moveRecentlyTabToRightBeforeNewTab,
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "toggle-moveRecentlyTabToRightGroup",
    parentId: "sort-menu",
    title: "Move Recently Tab to Right (In Group)",
    type: "checkbox",
    checked: settings.moveRecentlyTabToRightGroup,
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "toggle-sortGroupsAlphabetically",
    parentId: "sort-menu",
    title: "Tab Group Alphabetically",
    type: "checkbox",
    checked: settings.sortGroupsAlphabetically,
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "advanced-menu",
    title: "Advanced",
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "toggle-groupChromePages",
    parentId: "advanced-menu",
    title: "Auto Group Chrome or Internal Pages",
    type: "checkbox",
    checked: settings.groupChromePages,
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "toggle-renameGroupToSiteName",
    parentId: "advanced-menu",
    title: "Rename Groups using Site Name",
    type: "checkbox",
    checked: settings.renameGroupToSiteName,
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "toggle-respectSplitView",
    parentId: "advanced-menu",
    title: "Respect Split View (Don't Touch Split Tabs)",
    type: "checkbox",
    checked: settings.respectSplitView,
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "uuid-menu",
    title: "UUID Tracker",
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "toggle-useUuidTracker",
    parentId: "uuid-menu",
    title: "Enable",
    type: "checkbox",
    checked: settings.useUuidTracker,
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "reload-all",
    parentId: "uuid-menu",
    title: "Reload All Tabs (Fix UUIDs)",
    contexts: ["action"],
  });

  if (settings.enabled) {
    console.log("[Dynamic Tab Groups] Installed — evaluating all windows.");
    evaluateAllWindows();
  }
}
