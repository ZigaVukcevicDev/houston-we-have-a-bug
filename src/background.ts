// Service Worker (Background Script)

interface MessageRequest extends Record<string, any> {
  type: string;
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  chrome.storage.local.set({ count: 0 });
});

chrome.runtime.onMessage.addListener(
  (
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ) => {
    if (request.type === 'ACTION') {
      // Update counter in storage
      chrome.storage.local.get(['count'], (result: any) => {
        const newCount = (result.count || 0) + 1;
        chrome.storage.local.set({ count: newCount });
        sendResponse({ success: true, count: newCount });
      });
      return true; // Keep the message channel open for async response
    }
  }
);

chrome.tabs.onUpdated.addListener(
  (
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
  ) => {
    if (changeInfo.status === 'complete') {
      console.log('Page loaded:', tab.url);
    }
  }
);
