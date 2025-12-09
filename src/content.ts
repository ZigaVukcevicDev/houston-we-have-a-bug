// Content script
// This script runs in the context of the webpage

console.log('Content script loaded');

interface MessageRequest extends Record<string, any> {
  type: string;
}

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener(
  (
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ) => {
    if (request.type === 'ACTION') {
      // Perform action on the webpage
      console.log('Performing action on page:', window.location.href);

      // Example: highlight all paragraphs
      const paragraphs = document.querySelectorAll<HTMLParagraphElement>('p');
      paragraphs.forEach((p) => {
        p.style.backgroundColor = 'yellow';
        p.style.transition = 'background-color 0.3s';
      });

      sendResponse({ success: true });
    }
  }
);
