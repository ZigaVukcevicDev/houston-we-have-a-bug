export async function getTabViewport(tabId: number): Promise<string> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => `${window.innerWidth} x ${window.innerHeight}`,
    });
    return results[0]?.result || 'Unknown';
  } catch (error) {
    return 'Unable to get viewport';
  }
}
