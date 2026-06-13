export function extractAndReportSiteName() {
  try {
    const metaTag = document.querySelector('meta[property="og:site_name"]');
    if (metaTag) {
      const siteName = metaTag.getAttribute("content");
      if (siteName && siteName.trim() !== "") {
        chrome.runtime.sendMessage({
          type: "OG_SITE_NAME_REPORT",
          siteName: siteName.trim()
        });
      }
    }
  } catch (error) {
    //
  }
}
