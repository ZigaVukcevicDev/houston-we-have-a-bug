import { getChromeVersion } from './utils/get-chrome-version';
import { getDateAndTime } from './utils/get-date-and-time';
import { getOS } from './utils/get-os';
import { getTabViewport } from './utils/get-tab-viewport';

document
  .querySelector('[data-js="action-button"]')
  ?.addEventListener('click', async () => {
    const elements = {
      dateAndTime: document.querySelector('[data-js="date-and-time"]')!,
      url: document.querySelector('[data-js="url"]')!,
      browser: document.querySelector('[data-js="browser"]')!,
      os: document.querySelector('[data-js="os"]')!,
      viewport: document.querySelector('[data-js="viewport"]')!,
    };

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab?.url && tab.id) {
      elements.dateAndTime.textContent = `Date and time: ${getDateAndTime()}`;
      elements.url.textContent = `URL: ${tab.url}`;
      elements.viewport.textContent = `Viewport: ${await getTabViewport(tab.id)}`;
      elements.browser.textContent = `Browser: ${getChromeVersion(navigator.userAgent)}`;
      elements.os.textContent = `OS: ${getOS(navigator.userAgent)}`;
    } else {
      elements.dateAndTime.textContent = '';
      elements.url.textContent = 'Could not get URL';
      elements.browser.textContent = '';
      elements.os.textContent = '';
      elements.viewport.textContent = '';
    }
  });
