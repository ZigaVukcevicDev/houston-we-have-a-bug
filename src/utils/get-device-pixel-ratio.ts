export async function getDevicePixelRatio(tabId: number): Promise<string> {
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.devicePixelRatio.toString(),
    });
    return result[0].result ?? 'N/A';
  } catch {
    return 'N/A';
  }
}
