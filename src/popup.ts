import { getChromeVersion } from './utils/get-chrome-version';
import { getOS } from './utils/get-os';
import { getTabViewport } from './utils/get-tab-viewport';

document.getElementById('actionButton')?.addEventListener('click', async () => {
  const urlElement = document.getElementById('url')!;
  const browserElement = document.getElementById('browser')!;
  const osElement = document.getElementById('os')!;
  const viewportElement = document.getElementById('viewport')!;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.url && tab.id) {
    const viewport = await getTabViewport(tab.id);
    urlElement.textContent = `URL: ${tab.url}`;
    viewportElement.textContent = `Viewport: ${viewport}`;
    browserElement.textContent = `Browser: ${getChromeVersion(navigator.userAgent)}`;
    osElement.textContent = `OS: ${getOS(navigator.userAgent)}`;
  } else {
    urlElement.textContent = 'Could not get URL';
    browserElement.textContent = '';
    osElement.textContent = '';
    viewportElement.textContent = '';
  }
});
