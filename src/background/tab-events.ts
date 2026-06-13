import { onActivated } from "./tab-events/onActivated.ts";
import { onCreated } from "./tab-events/onCreated.ts";
import { onUpdated } from "./tab-events/onUpdated.ts";
import { onRemoved } from "./tab-events/onRemoved.ts";
import { onAttached } from "./tab-events/onAttached.ts";
import { onDetached } from "./tab-events/onDetached.ts";
import { onBoundsChanged } from "./tab-events/onBoundsChanged.ts";
import { onStorageChanged } from "./tab-events/onStorageChanged.ts";

export function setupTabEvents() {
  chrome.tabs.onActivated.addListener(onActivated);
  chrome.tabs.onCreated.addListener(onCreated);
  chrome.tabs.onUpdated.addListener(onUpdated);
  chrome.tabs.onRemoved.addListener(onRemoved);
  chrome.tabs.onAttached.addListener(onAttached);
  chrome.tabs.onDetached.addListener(onDetached);
  
  chrome.windows.onBoundsChanged.addListener(onBoundsChanged);
  chrome.storage.onChanged.addListener(onStorageChanged);
}
