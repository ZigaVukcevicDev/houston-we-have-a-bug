import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { getChromeVersion } from '../../utils/get-chrome-version';
import { getDateAndTime } from '../../utils/get-date-and-time';
import { getDevicePixelRatio } from '../../utils/get-device-pixel-ratio';
import { getDisplayResolution } from '../../utils/get-display-resolution';
import { getOS } from '../../utils/get-os';
import { getVisibleArea } from '../../utils/get-visible-area';
import styles from './hb-popup.scss';

interface EnvironmentDetails {
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
  private environmentDetails: EnvironmentDetails | null = null;

  @state()
  private isLoading = false;

  render() {
    return html`
      <div class="popup-content">
        <div class="logo-with-heading">
          <img src="../images/rocket.svg" alt="rocket" />
          <h1>Houston, we have a bug</h1>
        </div>

        <button
          class="action-button primary"
          @click=${this._annotateScreenshot}
        >
          <img src="../images/pencil.svg" alt="pencil" />
          Annotate screenshot
        </button>

        <button @click=${this._gatherEnvironmentDetails}>
          Gather environment details
        </button>

        ${this.environmentDetails
          ? html`
              <h2>Environment details</h2>
              <table class="environment-details">
                <tbody>
                  <tr>
                    <th>
                      <img src="../images/clock.svg" alt="clock" />
                      Date and time
                    </th>
                    <td>${this.environmentDetails.dateAndTime}</td>
                  </tr>
                  <tr>
                    <th>
                      <img src="../images/globe.svg" alt="globe" />
                      URL
                    </th>
                    <td>${this.environmentDetails.url}</td>
                  </tr>
                  <tr>
                    <th>
                      <img src="../images/display.svg" alt="display" />
                      Visible area
                    </th>
                    <td>${this.environmentDetails.visibleArea}</td>
                  </tr>
                  <tr>
                    <th>Display resolution</th>
                    <td>${this.environmentDetails.displayResolution}</td>
                  </tr>
                  <tr>
                    <th>Device pixel ratio</th>
                    <td>${this.environmentDetails.devicePixelRatio}</td>
                  </tr>
                  <tr>
                    <th>
                      <img src="../images/target.svg" alt="target" />
                      Browser
                    </th>
                    <td>${this.environmentDetails.browser}</td>
                  </tr>
                  <tr>
                    <th>Operating system</th>
                    <td>${this.environmentDetails.os}</td>
                  </tr>
                </tbody>
              </table>
              <button @click=${this._copyToClipboard}>Copy to clipboard</button>
            `
          : null}
      </div>
    `;
  }

  private async _gatherEnvironmentDetails() {
    this.isLoading = true;
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab?.url && tab.id) {
        this.environmentDetails = {
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
    if (!this.environmentDetails) return;

    const text = [
      `Date and time: ${this.environmentDetails.dateAndTime}`,
      `URL: ${this.environmentDetails.url}`,
      `Visible area: ${this.environmentDetails.visibleArea}`,
      `Display resolution: ${this.environmentDetails.displayResolution}`,
      `Device pixel ratio: ${this.environmentDetails.devicePixelRatio}`,
      `Browser: ${this.environmentDetails.browser}`,
      `Operating system: ${this.environmentDetails.os}`,
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
