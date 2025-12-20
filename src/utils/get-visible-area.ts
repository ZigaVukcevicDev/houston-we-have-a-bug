export async function getVisibleArea(tabId: number): Promise<string> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => `${window.innerWidth} x ${window.innerHeight} px`,
    });
    return results[0]?.result || 'Unknown';
  } catch {
    return 'N/A';
  }
}
