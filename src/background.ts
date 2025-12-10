// Background service worker for handling screenshot data transfer

let screenshotDataUrl: string | null = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'STORE_SCREENSHOT') {
    screenshotDataUrl = message.dataUrl;
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_SCREENSHOT') {
    const data = screenshotDataUrl;
    screenshotDataUrl = null; // Clear after retrieval
    sendResponse({ dataUrl: data });
    return true;
  }
});
