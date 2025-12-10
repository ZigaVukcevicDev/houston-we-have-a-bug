import { getChromeVersion } from './utils/get-chrome-version';
import { getDateAndTime } from './utils/get-date-and-time';
import { getDevicePixelRatio } from './utils/get-device-pixel-ratio';
import { getDisplayResolution } from './utils/get-display-resolution';
import { getOS } from './utils/get-os';
import { getVisibleArea } from './utils/get-visible-area';
import { ScreenshotEditor } from './utils/screenshot-editor';

const elements = {
  dateAndTime: document.querySelector('[data-js="date-and-time"]')!,
  url: document.querySelector('[data-js="url"]')!,
  browser: document.querySelector('[data-js="browser"]')!,
  os: document.querySelector('[data-js="os"]')!,
  visibleArea: document.querySelector('[data-js="visible-area"]')!,
  displayResolution: document.querySelector('[data-js="display-resolution"]')!,
  devicePixelRatio: document.querySelector('[data-js="device-pixel-ratio"]')!,
  systemInfoHeading: document.querySelector('[data-js="system-info-heading"]')!,
  copyButton: document.querySelector('[data-js="copy-button"]')!,
  // Screenshot editor elements
  mainView: document.querySelector('[data-js="main-view"]') as HTMLElement,
  screenshotEditor: document.querySelector(
    '[data-js="screenshot-editor"]'
  ) as HTMLElement,
  screenshotCanvas: document.querySelector(
    '[data-js="screenshot-canvas"]'
  ) as HTMLCanvasElement,
  captureButton: document.querySelector(
    '[data-js="capture-screenshot-button"]'
  )!,
  closeEditorButton: document.querySelector('[data-js="close-editor"]')!,
  textColorInput: document.querySelector(
    '[data-js="text-color"]'
  ) as HTMLInputElement,
  fontSizeSelect: document.querySelector(
    '[data-js="font-size"]'
  ) as HTMLSelectElement,
  clearAnnotationsButton: document.querySelector(
    '[data-js="clear-annotations"]'
  )!,
  downloadButton: document.querySelector('[data-js="download-screenshot"]')!,
};

let screenshotEditor: ScreenshotEditor | null = null;

document
  .querySelector('[data-js="gather-system-info-button"]')
  ?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab?.url && tab.id) {
      elements.dateAndTime.textContent = `Date and time: ${getDateAndTime()}`;
      elements.url.textContent = `URL: ${tab.url}`;
      elements.visibleArea.textContent = `Visible area: ${await getVisibleArea(tab.id)}`;
      elements.displayResolution.textContent = `Display resolution: ${await getDisplayResolution(tab.id)}`;
      elements.devicePixelRatio.textContent = `Device pixel ratio: ${await getDevicePixelRatio(tab.id)}`;
      elements.browser.textContent = `Browser: ${getChromeVersion(navigator.userAgent)}`;
      elements.os.textContent = `Operating system: ${getOS(navigator.userAgent)}`;

      elements.systemInfoHeading.removeAttribute('hidden');
      elements.copyButton.removeAttribute('hidden');
    }
  });

document
  .querySelector('[data-js="copy-button"]')
  ?.addEventListener('click', async () => {
    const systemInfo = [
      elements.dateAndTime.textContent,
      elements.url.textContent,
      elements.visibleArea.textContent,
      elements.displayResolution.textContent,
      elements.devicePixelRatio.textContent,
      elements.browser.textContent,
      elements.os.textContent,
    ]
      .filter(Boolean)
      .join('\n');

    if (systemInfo) {
      await navigator.clipboard.writeText(systemInfo);
    }
  });

// Screenshot capture functionality
elements.captureButton?.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id || !tab.windowId) return;

    // Capture the visible tab
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
    });

    // Initialize the editor
    screenshotEditor = new ScreenshotEditor(elements.screenshotCanvas);
    await screenshotEditor.loadImage(dataUrl);

    // Show the editor view
    elements.mainView.setAttribute('hidden', '');
    elements.screenshotEditor.removeAttribute('hidden');

    // Resize popup to accommodate the editor
    document.body.style.width = '500px';
  } catch (error) {
    console.error('Failed to capture screenshot:', error);
  }
});

// Close editor
elements.closeEditorButton?.addEventListener('click', () => {
  closeEditor();
});

// Update text color
elements.textColorInput?.addEventListener('input', (e) => {
  const color = (e.target as HTMLInputElement).value;
  screenshotEditor?.setColor(color);
});

// Update font size
elements.fontSizeSelect?.addEventListener('change', (e) => {
  const size = parseInt((e.target as HTMLSelectElement).value, 10);
  screenshotEditor?.setFontSize(size);
});

// Clear annotations
elements.clearAnnotationsButton?.addEventListener('click', () => {
  screenshotEditor?.clearAnnotations();
});

// Download screenshot
elements.downloadButton?.addEventListener('click', () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  screenshotEditor?.download(`bug-screenshot-${timestamp}.png`);
});

function closeEditor(): void {
  elements.screenshotEditor.setAttribute('hidden', '');
  elements.mainView.removeAttribute('hidden');
  document.body.style.width = '300px';
  screenshotEditor?.destroy();
  screenshotEditor = null;
}
