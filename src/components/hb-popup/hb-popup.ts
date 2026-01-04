import { LitElement, html, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
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
