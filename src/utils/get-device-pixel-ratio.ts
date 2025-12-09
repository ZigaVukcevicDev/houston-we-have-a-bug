export async function getDevicePixelRatio(tabId: number): Promise<string> {
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.devicePixelRatio.toString(),
    });
    return result[0].result ?? 'Unable to get device pixel ratio';
  } catch {
    return 'Unable to get device pixel ratio';
  }
}
