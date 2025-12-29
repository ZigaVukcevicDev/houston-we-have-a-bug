import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { getChromeVersion } from '../../utils/get-chrome-version';
import { getDateAndTime } from '../../utils/get-date-and-time';
import { getDevicePixelRatio } from '../../utils/get-device-pixel-ratio';
import { getDisplayResolution } from '../../utils/get-display-resolution';
import { getOS } from '../../utils/get-os';
import { getVisibleArea } from '../../utils/get-visible-area';
import type { EnvironmentDetails } from '../../interfaces/environment-details.interface';
import styles from './hb-popup.scss';

@customElement('hb-popup')
export class HBPopup extends LitElement {
  static styles = unsafeCSS(styles);

  @state()
  private systemInfo: EnvironmentDetails | null = null;

  @state()
  private isCopyingDisabled = false;

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

          <button class="action-button secondary mt-md mb-md" @click=${this.gatherSystemInfo}>
            <img src="../images/info-black.svg" alt="info" class="icon-default" />
            <img src="../images/info-red-400.svg" alt="info" class="icon-hover" />
            <img src="../images/info-red-500.svg" alt="info" class="icon-active" />
            Gather system info
          </button>
        </div>

        ${this.renderSystemInfo()}
      </div>
    `;
  }

  private renderCopyButtonIcon() {
    if (this.isCopyingDisabled) {
      return html`
        <img src="../images/check-black.svg" alt="check" class="icon-default" />
      `;
    }

    return html`
      <img src="../images/copy-black.svg" alt="copy" class="icon-default" />
      <img src="../images/copy-red-400.svg" alt="copy" class="icon-hover" />
      <img src="../images/copy-red-500.svg" alt="copy" class="icon-active" />
    `;
  }

  private renderSystemInfo() {
    if (!this.systemInfo) {
      return null;
    }

    return html`
      <div class="system-info-heading">
        <h2>System info</h2>

        <button
          class="icon-button"
          @click=${this.copyToClipboard}
          title="Copy to clipboard"
          ?disabled=${this.isCopyingDisabled}
        >
          ${this.renderCopyButtonIcon()}
        </button>
      </div>

      <table class="system-info">
        <tbody>
          <tr>
            <th>
              <img src="../images/clock-black.svg" alt="clock" />
              Date and time
            </th>
            <td>${this.systemInfo.dateAndTime}</td>
          </tr>
          <tr>
            <th colspan="2">
              <img src="../images/globe-black.svg" alt="globe" />
              URL
              <table>
                <tr>
                  <td style="width: auto;"><span class="url">${this.systemInfo.url}</span></td>
                </tr>
              </table>
            </th>
          </tr>
          <tr>
            <th colspan="2">
              <img src="../images/display-black.svg" alt="display" />
              Display
              <table>
                <tr>
                  <td>Visible area</td>
                  <td>${this.systemInfo.visibleArea}</td>
                </tr>
                <tr>
                  <td>Display resolution</td>
                  <td>${this.systemInfo.displayResolution}</td>
                </tr>
                <tr>
                  <td>Device pixel ratio</td>
                  <td>${this.systemInfo.devicePixelRatio}</td>
                </tr>
              </table>
            </th>
          </tr>
          <tr>
            <th colspan="2">
              <img src="../images/target-black.svg" alt="target" />
              System
              <table>
                <tr>
                  <td>Browser</td>
                  <td>${this.systemInfo.browser}</td>
                </tr>
                <tr>
                  <td>Operating system</td>
                  <td>${this.systemInfo.os}</td>
                </tr>
              </table>
            </th>
          </tr>
        </tbody>
      </table>
    `;
  }

  private async gatherSystemInfo() {
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
    }
  }

  private async copyToClipboard() {
    if (!this.systemInfo) return;

    const text = [
      `Date and time: ${this.systemInfo.dateAndTime}`,
      `URL: ${this.systemInfo.url}`,
      ``,
      `Display`,
      `Visible area: ${this.systemInfo.visibleArea}`,
      `Display resolution: ${this.systemInfo.displayResolution}`,
      `Device pixel ratio: ${this.systemInfo.devicePixelRatio}`,
      ``,
      `System`,
      `Browser: ${this.systemInfo.browser}`,
      `Operating system: ${this.systemInfo.os}`,
    ].join('\n');

    this.isCopyingDisabled = true;
    await navigator.clipboard.writeText(text);
    setTimeout(() => {
      this.isCopyingDisabled = false;
    }, 3000);
  }

  private async annotateScreenshot() {
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
