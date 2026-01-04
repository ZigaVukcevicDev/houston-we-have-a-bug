// Background service worker - Simple in-memory storage with immediate transfer

// Use module-level variables that persist during service worker lifetime
let pendingScreenshotData: string | null = null;
let pendingSystemInfo: any = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message received:', message.type);

  if (message.type === 'STORE_SCREENSHOT') {
    console.log('[Background] Storing data in memory');
    pendingScreenshotData = message.dataUrl;
    pendingSystemInfo = message.systemInfo;

    console.log('[Background] Stored:', {
      hasData: !!pendingScreenshotData,
      hasInfo: !!pendingSystemInfo,
      info: pendingSystemInfo
    });

    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_SCREENSHOT') {
    console.log('[Background] Retrieving from memory:', {
      hasData: !!pendingScreenshotData,
      hasInfo: !!pendingSystemInfo,
      info: pendingSystemInfo
    });

    const response = {
      dataUrl: pendingScreenshotData,
      systemInfo: pendingSystemInfo,
    };

    // Don't clear immediately - wait a bit in case of retries
    setTimeout(() => {
      pendingScreenshotData = null;
      pendingSystemInfo = null;
    }, 5000);

    sendResponse(response);
    return true;
  }

  return false;
});

// Keep service worker alive longer
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] Service worker installed');
});

export { };
