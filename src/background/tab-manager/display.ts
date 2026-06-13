export async function getDisplayIdForWindow(
  windowId: number,
): Promise<string | undefined> {
  try {
    const displays = await chrome.system.display.getInfo();
    const win = await chrome.windows.get(windowId);

    if (
      win.left !== undefined &&
      win.top !== undefined &&
      win.width !== undefined &&
      win.height !== undefined
    ) {
      const centerX = win.left + win.width / 2;
      const centerY = win.top + win.height / 2;

      const display = displays.find(
        (display) =>
          centerX >= display.bounds.left &&
          centerX < display.bounds.left + display.bounds.width &&
          centerY >= display.bounds.top &&
          centerY < display.bounds.top + display.bounds.height,
      );
      return display?.id;
    }
  } catch (error) {
    console.warn("[Dynamic Tab Groups] Failed to check display bounds:", error);
  }
  return undefined;
}
