import { LitElement, html, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import { getChromeVersion } from '../../utils/get-chrome-version';
import { getDateAndTime } from '../../utils/get-date-and-time';
import { getDevicePixelRatio } from '../../utils/get-device-pixel-ratio';
import { getDisplayResolution } from '../../utils/get-display-resolution';
import { getOS } from '../../utils/get-os';
import { getVisibleArea } from '../../utils/get-visible-area';
import type { SystemInfo } from '../../interfaces/system-info.interface';
import styles from './hb-popup.scss';

@customElement('hb-popup')
export class HBPopup extends LitElement {
  static styles = unsafeCSS(styles);

  render() {
    return html`
      <div class="popup">
        <div class="logo-with-heading">
          <img src="../images/rocket.svg" alt="rocket" />
          <h1>Houston, we have a bug</h1>
        </div>

        <div class="ml-lg">
        <button
            class="action-button primary"
            @click=${this.annotateScreenshot}
          >
            <img src="../images/pencil-white.svg" alt="pencil" />
            Annotate screenshot
          </button>
        </div>
      </div>
    `;
  }

  private async annotateScreenshot() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id || !tab.windowId || !tab.url) return;

      // Gather system info from the actual website tab (not extension page)
      const systemInfo: SystemInfo = {
        dateAndTime: getDateAndTime(),
        url: tab.url,
        visibleArea: await getVisibleArea(tab.id),
        displayResolution: await getDisplayResolution(tab.id),
        devicePixelRatio: await getDevicePixelRatio(tab.id),
        browser: getChromeVersion(navigator.userAgent),
        os: getOS(navigator.userAgent),
      };

      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: 'png',
      });

      // Store both screenshot AND system info in background
      await chrome.runtime.sendMessage({
        type: 'STORE_SCREENSHOT',
        dataUrl,
        systemInfo,
      });

      chrome.tabs.create({ url: chrome.runtime.getURL('tab.html') });
      window.close(); // Close the popup
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-popup': HBPopup;
  }
}
