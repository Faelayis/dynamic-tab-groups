import { initAutoTabsUUID } from "./uuid.ts";
import { extractAndReportSiteName } from "./site-name.ts";

initAutoTabsUUID();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", extractAndReportSiteName);
} else {
  extractAndReportSiteName();
}
