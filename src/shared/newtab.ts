const NEWTAB_URL_PATTERN =
  /^(chrome|edge|brave|opera|vivaldi|yandex|whale):\/\/newtab\/?$/i;

export function isNewTabPage(tab: { pendingUrl?: string; url?: string }): boolean {
  const url = (tab.pendingUrl || tab.url || "").toLowerCase();
  return NEWTAB_URL_PATTERN.test(url);
}
