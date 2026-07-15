import { extractAndReportSiteName } from "./site-name.ts";
import { initAutoTabsUUID } from "./uuid.ts";

initAutoTabsUUID();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", extractAndReportSiteName);
} else {
  extractAndReportSiteName();
}
