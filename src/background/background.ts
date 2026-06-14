import { setupStartup } from "./startup/setupStartup.ts";
import { setupContextMenus } from "./context-menus.ts";
import { setupCommands } from "./commands.ts";
import { setupMessageHandlers } from "./message-handlers.ts";
import { setupTabEvents } from "./tab-events.ts";

setupStartup();
setupContextMenus();
setupCommands();
setupMessageHandlers();
setupTabEvents();

console.log("[Dynamic Tab Groups] Background service worker initialized.");
