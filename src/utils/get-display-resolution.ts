export async function getDisplayResolution(tabId: number): Promise<string> {
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => `${window.screen.width} x ${window.screen.height} px`,
    });
    return result[0].result ?? 'Unable to get display resolution';
  } catch {
    return 'Unable to get display resolution';
  }
}
