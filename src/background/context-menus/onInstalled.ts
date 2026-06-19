import { getSettings } from "../../shared/storage/index.ts";
import { evaluateAllWindows } from "../tab-manager/evaluation.ts";

export async function onInstalled() {
  const settings = await getSettings();

  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    checked: settings.closeSingleTabGroups,
    contexts: ["action"],
    id: "toggle-closeSingleTabGroups",
    title: "Close Single-Tab Groups",
    type: "checkbox",
  });

  chrome.contextMenus.create({
    checked: settings.collapseGroupsWhenNotInUse,
    contexts: ["action"],
    id: "toggle-collapseGroupsWhenNotInUse",
    title: "Collapse Groups When Not in Use",
    type: "checkbox",
  });

  chrome.contextMenus.create({
    contexts: ["action"],
    id: "sort-menu",
    title: "Sort",
  });

  chrome.contextMenus.create({
    checked: settings.ignorePinnedTabs,
    contexts: ["action"],
    id: "toggle-ignorePinnedTabs",
    parentId: "sort-menu",
    title: "Ignore Pinned Tabs",
    type: "checkbox",
  });

  chrome.contextMenus.create({
    checked: settings.sortOnActiveTab,
    contexts: ["action"],
    id: "toggle-sortOnActiveTab",
    parentId: "sort-menu",
    title: "Mode Active Tab or Exit Tab",
    type: "checkbox",
  });

  chrome.contextMenus.create({
    checked: settings.moveRecentlyTabToRight,
    contexts: ["action"],
    id: "toggle-moveRecentlyTabToRight",
    parentId: "sort-menu",
    title: "Move Recently Tab to Right",
    type: "checkbox",
  });

  chrome.contextMenus.create({
    checked: settings.moveRecentlySplitViewToRight,
    contexts: ["action"],
    id: "toggle-moveRecentlySplitViewToRight",
    parentId: "sort-menu",
    title: "Move Recently Split View to Right",
    type: "checkbox",
  });

  chrome.contextMenus.create({
    checked: settings.moveRecentlyTabToRightGroup,
    contexts: ["action"],
    id: "toggle-moveRecentlyTabToRightGroup",
    parentId: "sort-menu",
    title: "Move Recently Tab to Right (In Group)",
    type: "checkbox",
  });

  chrome.contextMenus.create({
    checked: settings.moveRecentlyTabToRightBeforeNewTab,
    contexts: ["action"],
    id: "toggle-moveRecentlyTabToRightBeforeNewTab",
    parentId: "sort-menu",
    title: "Recently Tab to Right (Before New Tab)",
    type: "checkbox",
  });

  chrome.contextMenus.create({
    checked: settings.sortGroupsAlphabetically,
    contexts: ["action"],
    id: "toggle-sortGroupsAlphabetically",
    parentId: "sort-menu",
    title: "Tab Group Alphabetically",
    type: "checkbox",
  });

  chrome.contextMenus.create({
    contexts: ["action"],
    id: "advanced-menu",
    title: "Advanced",
  });

  chrome.contextMenus.create({
    checked: settings.groupChromePages,
    contexts: ["action"],
    id: "toggle-groupChromePages",
    parentId: "advanced-menu",
    title: "Auto Group Chrome or Internal Pages",
    type: "checkbox",
  });

  chrome.contextMenus.create({
    checked: settings.renameGroupToSiteName,
    contexts: ["action"],
    id: "toggle-renameGroupToSiteName",
    parentId: "advanced-menu",
    title: "Rename Groups using Site Name",
    type: "checkbox",
  });

  chrome.contextMenus.create({
    checked: settings.respectSplitView,
    contexts: ["action"],
    id: "toggle-respectSplitView",
    parentId: "advanced-menu",
    title: "Respect Split View (Don't Touch Split Tabs)",
    type: "checkbox",
  });

  chrome.contextMenus.create({
    contexts: ["action"],
    id: "uuid-menu",
    title: "UUID Tracker",
  });

  chrome.contextMenus.create({
    checked: settings.useUuidTracker,
    contexts: ["action"],
    id: "toggle-useUuidTracker",
    parentId: "uuid-menu",
    title: "Enable",
    type: "checkbox",
  });

  chrome.contextMenus.create({
    contexts: ["action"],
    id: "reload-all",
    parentId: "uuid-menu",
    title: "Reload All Tabs (Fix UUIDs)",
  });

  if (settings.enabled) {
    console.log("[Dynamic Tab Groups] Installed — evaluating all windows.");
    evaluateAllWindows();
  }
}
