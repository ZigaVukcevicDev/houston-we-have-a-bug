import type { ScreenshotSession } from './types/screenshot-session.type';
import type { SystemInfo } from './interfaces/system-info.interface';

async function storeScreenshotData(dataUrl: string, systemInfo: SystemInfo): Promise<string> {
  const sessionId = crypto.randomUUID();
  const data: ScreenshotSession = {
    dataUrl,
    systemInfo,
    timestamp: Date.now(),
  };

  await chrome.storage.session.set({ [`screenshot_${sessionId}`]: data });
  return sessionId;
}

async function getScreenshotData(sessionId: string): Promise<ScreenshotSession | null> {
  const key = `screenshot_${sessionId}`;
  const result = await chrome.storage.session.get(key);

  if (result[key]) {
    await chrome.storage.session.remove(key);
    return result[key];
  }

  return null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STORE_SCREENSHOT') {
    storeScreenshotData(message.dataUrl, message.systemInfo)
      .then(sessionId => {
        chrome.tabs.create({ url: `tab.html?session=${sessionId}` });
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Failed to store screenshot:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.type === 'GET_SCREENSHOT') {
    const sessionId = message.sessionId;
    if (!sessionId) {
      sendResponse({ dataUrl: null, systemInfo: null });
      return false;
    }

    getScreenshotData(sessionId)
      .then(data => {
        sendResponse({
          dataUrl: data?.dataUrl || null,
          systemInfo: data?.systemInfo || null,
        });
      })
      .catch(error => {
        console.error('Failed to get screenshot:', error);
        sendResponse({ dataUrl: null, systemInfo: null });
      });
    return true;
  }

  return false;
});

chrome.runtime.onInstalled.addListener(() => { });


export { };
