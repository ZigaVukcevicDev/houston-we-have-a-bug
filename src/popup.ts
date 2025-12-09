interface ChromeTab extends chrome.tabs.Tab {
  id: number;
  url?: string;
}

document.addEventListener("DOMContentLoaded", () => {
  const actionButton = document.getElementById(
    "actionButton"
  ) as HTMLButtonElement;
  const statusElement = document.getElementById(
    "status"
  ) as HTMLParagraphElement;

  actionButton.addEventListener("click", async () => {
    // Get the current active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0] as ChromeTab;

    if (activeTab && activeTab.id) {
      // Send message to content script
      chrome.tabs.sendMessage(
        activeTab.id,
        { type: "ACTION" },
        (response: any) => {
          if (response && response.success) {
            statusElement.textContent = "Action completed!";
            statusElement.style.color = "#4caf50";
          } else {
            statusElement.textContent = "Action failed!";
            statusElement.style.color = "#f44336";
          }
        }
      );
    }
  });

  // Load saved data from storage
  chrome.storage.local.get(["count"], (result: any) => {
    const count = result.count || 0;
    statusElement.textContent = `Clicks: ${count}`;
  });
});
