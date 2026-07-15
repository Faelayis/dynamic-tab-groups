import { evaluateAllWindows } from "../tab-manager/evaluation.ts";

export function onStorageChanged(
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: string,
) {
  if (areaName !== "local") return;

  const settingsChange = changes.settings;
  if (!settingsChange) return;

  evaluateAllWindows();
}
