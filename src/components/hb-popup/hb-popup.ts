import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
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

  @state()
  private isOnAnnotationPage: boolean = false;

  async connectedCallback() {
    super.connectedCallback();
    await this.checkIfOnAnnotationPage();
  }

  private async checkIfOnAnnotationPage() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const url = tab?.url || '';
      this.isOnAnnotationPage = url.includes('/tab.html');
    } catch {
      this.isOnAnnotationPage = false;
    }
  }

  render() {
    return html`
      <div class="popup">
        <div class="logo-with-heading">
          <img class="logo" src="../images/rocket.svg" alt="rocket" />
          <img class="heading"src="../images/hb.svg" alt="hb" />
        </div>

        <div class="ml-lg">
        <button
            class="action-button primary"
            @click=${this.annotateScreenshot}
            ?disabled=${this.isOnAnnotationPage}
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

      await chrome.runtime.sendMessage({
        type: 'STORE_SCREENSHOT',
        dataUrl,
        systemInfo,
      });

      window.close();
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
