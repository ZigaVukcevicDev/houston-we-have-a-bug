import { getChromeVersion } from './utils/get-chrome-version';
import { getOS } from './utils/get-os';

document.getElementById('actionButton')?.addEventListener('click', async () => {
  const urlElement = document.getElementById('url')!;
  const browserElement = document.getElementById('browser')!;
  const osElement = document.getElementById('os')!;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.url) {
    urlElement.textContent = `URL: ${tab.url}`;
    browserElement.textContent = `Browser: ${getChromeVersion(navigator.userAgent)}`;
    osElement.textContent = `OS: ${getOS(navigator.userAgent)}`;
  } else {
    urlElement.textContent = 'Could not get URL';
    browserElement.textContent = '';
    osElement.textContent = '';
  }
});
