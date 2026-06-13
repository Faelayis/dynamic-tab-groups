import { DEFAULT_SETTINGS } from "../constants/index.ts";
import type { ExtensionSettings } from "../../types/index.ts";

const STORAGE_KEY = "settings";

export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as ExtensionSettings | undefined;
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function setSettings(
  updates: Partial<ExtensionSettings>,
): Promise<ExtensionSettings> {
  const current = await getSettings();
  const updated: ExtensionSettings = { ...current, ...updates };
  await chrome.storage.local.set({ [STORAGE_KEY]: updated });
  return updated;
}
