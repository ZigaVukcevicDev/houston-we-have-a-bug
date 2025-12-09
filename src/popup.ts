import { getChromeVersion } from './utils/get-chrome-version';
import { getDateAndTime } from './utils/get-date-and-time';
import { getDisplayResolution } from './utils/get-display-resolution';
import { getOS } from './utils/get-os';
import { getVisibleArea } from './utils/get-visible-area';

document
  .querySelector('[data-js="action-button"]')
  ?.addEventListener('click', async () => {
    const elements = {
      dateAndTime: document.querySelector('[data-js="date-and-time"]')!,
      url: document.querySelector('[data-js="url"]')!,
      browser: document.querySelector('[data-js="browser"]')!,
      os: document.querySelector('[data-js="os"]')!,
      visibleArea: document.querySelector('[data-js="visible-area"]')!,
      displayResolution: document.querySelector(
        '[data-js="display-resolution"]'
      )!,
    };

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab?.url && tab.id) {
      elements.dateAndTime.textContent = `Date and time: ${getDateAndTime()}`;
      elements.url.textContent = `URL: ${tab.url}`;
      elements.visibleArea.textContent = `Visible area: ${await getVisibleArea(tab.id)}`;
      elements.displayResolution.textContent = `Display resolution: ${await getDisplayResolution(tab.id)}`;
      elements.browser.textContent = `Browser: ${getChromeVersion(navigator.userAgent)}`;
      elements.os.textContent = `Operating system: ${getOS(navigator.userAgent)}`;
    }
  });
