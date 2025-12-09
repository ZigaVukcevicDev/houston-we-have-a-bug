import { detectBrowser } from "./utils/detect-browser";
import { detectOS } from "./utils/detect-os";

interface ChromeTab extends chrome.tabs.Tab {
  id: number;
  url?: string;
}

document.addEventListener("DOMContentLoaded", () => {
  const actionButton = document.getElementById(
    "actionButton"
  ) as HTMLButtonElement;
  const urlElement = document.getElementById("url") as HTMLParagraphElement;
  const browserElement = document.getElementById(
    "browser"
  ) as HTMLParagraphElement;
  const osElement = document.getElementById("os") as HTMLParagraphElement;

  actionButton.addEventListener("click", async () => {
    // Get the current active tab - testing watcher
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0] as ChromeTab;

    if (activeTab && activeTab.url) {
      // Display the current tab URL and browser info
      const browser = detectBrowser(navigator.userAgent);
      const os = detectOS(navigator.userAgent);
      urlElement.textContent = `URL: ${activeTab.url}`;
      browserElement.textContent = `Browser: ${browser}`;
      osElement.textContent = `OS: ${os}`;
    } else {
      urlElement.textContent = "Could not get URL";
      browserElement.textContent = "";
      osElement.textContent = "";
    }
  });

  // Load saved data from storage
  chrome.storage.local.get(["count"], (result: any) => {
    const count = result.count || 0;
    urlElement.textContent = `Clicks: ${count}`;
  });
});
