import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { getChromeVersion } from '../../utils/get-chrome-version';
import { getDateAndTime } from '../../utils/get-date-and-time';
import { getDevicePixelRatio } from '../../utils/get-device-pixel-ratio';
import { getDisplayResolution } from '../../utils/get-display-resolution';
import { getOS } from '../../utils/get-os';
import { getVisibleArea } from '../../utils/get-visible-area';
import styles from './hb-popup.scss';

interface SystemInfo {
  dateAndTime: string;
  url: string;
  visibleArea: string;
  displayResolution: string;
  devicePixelRatio: string;
  browser: string;
  os: string;
}

@customElement('hb-popup')
export class HBPopup extends LitElement {
  static styles = unsafeCSS(styles);

  @state()
  private systemInfo: SystemInfo | null = null;

  @state()
  private isLoading = false;

  render() {
    return html`
      <div class="popup-content">
        <div class="logo-with-heading">
          <img src="../images/rocket.svg" alt="Rocket" />
          <h1>Houston, we have a bug</h1>
        </div>

        <button
          class="action-button primary"
          @click=${this._annotateScreenshot}
        >
          <img src="../images/pencil.svg" alt="pencil" />
          Annotate screenshot
        </button>

        <button @click=${this._gatherSystemInfo}>Gather system info</button>

        ${this.systemInfo
          ? html`
              <h2>System info</h2>
              <p class="info-item">
                Date and time: ${this.systemInfo.dateAndTime}
              </p>
              <p class="info-item">URL: ${this.systemInfo.url}</p>
              <p class="info-item">
                Visible area: ${this.systemInfo.visibleArea}
              </p>
              <p class="info-item">
                Display resolution: ${this.systemInfo.displayResolution}
              </p>
              <p class="info-item">
                Device pixel ratio: ${this.systemInfo.devicePixelRatio}
              </p>
              <p class="info-item">Browser: ${this.systemInfo.browser}</p>
              <p class="info-item">Operating system: ${this.systemInfo.os}</p>

              <button @click=${this._copyToClipboard}>Copy to clipboard</button>
            `
          : null}
      </div>
    `;
  }

  private async _gatherSystemInfo() {
    this.isLoading = true;
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab?.url && tab.id) {
        this.systemInfo = {
          dateAndTime: getDateAndTime(),
          url: tab.url,
          visibleArea: await getVisibleArea(tab.id),
          displayResolution: await getDisplayResolution(tab.id),
          devicePixelRatio: await getDevicePixelRatio(tab.id),
          browser: getChromeVersion(navigator.userAgent),
          os: getOS(navigator.userAgent),
        };
      }
    } catch (error) {
      console.error('Failed to gather system info:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async _copyToClipboard() {
    if (!this.systemInfo) return;

    const text = [
      `Date and time: ${this.systemInfo.dateAndTime}`,
      `URL: ${this.systemInfo.url}`,
      `Visible area: ${this.systemInfo.visibleArea}`,
      `Display resolution: ${this.systemInfo.displayResolution}`,
      `Device pixel ratio: ${this.systemInfo.devicePixelRatio}`,
      `Browser: ${this.systemInfo.browser}`,
      `Operating system: ${this.systemInfo.os}`,
    ].join('\n');

    await navigator.clipboard.writeText(text);
  }

  private async _annotateScreenshot() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id || !tab.windowId) return;

      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: 'png',
      });

      // Store screenshot in background service worker and open editor in new tab
      await chrome.runtime.sendMessage({ type: 'STORE_SCREENSHOT', dataUrl });
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
