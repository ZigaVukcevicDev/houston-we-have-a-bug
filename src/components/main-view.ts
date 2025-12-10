import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { getChromeVersion } from '../utils/get-chrome-version';
import { getDateAndTime } from '../utils/get-date-and-time';
import { getDevicePixelRatio } from '../utils/get-device-pixel-ratio';
import { getDisplayResolution } from '../utils/get-display-resolution';
import { getOS } from '../utils/get-os';
import { getVisibleArea } from '../utils/get-visible-area';

interface SystemInfo {
  dateAndTime: string;
  url: string;
  visibleArea: string;
  displayResolution: string;
  devicePixelRatio: string;
  browser: string;
  os: string;
}

@customElement('main-view')
export class MainView extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 16px;
    }

    h1 {
      font-size: 18px;
      margin: 0 0 16px 0;
      color: #333;
    }

    h2 {
      font-size: 14px;
      margin: 16px 0 8px 0;
      color: #333;
    }

    button {
      width: 100%;
      padding: 10px 16px;
      background: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.3s;
      margin: 5px 0;
    }

    button:hover {
      background: #357ae8;
    }

    button:active {
      background: #2d5bc7;
    }

    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .info-item {
      margin-top: 12px;
      font-size: 12px;
      color: #666;
      word-break: break-all;
    }
  `;

  @state()
  private systemInfo: SystemInfo | null = null;

  @state()
  private isLoading = false;

  render() {
    return html`
      <h1>Houston, we have a bug</h1>

      <button @click=${this._gatherSystemInfo} ?disabled=${this.isLoading}>
        ${this.isLoading ? 'Gathering...' : 'Gather system info'}
      </button>

      <button @click=${this._captureScreenshot}>Capture screenshot</button>

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

  private async _captureScreenshot() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id || !tab.windowId) return;

      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: 'png',
      });

      this.dispatchEvent(
        new CustomEvent('capture-screenshot', {
          detail: dataUrl,
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'main-view': MainView;
  }
}
