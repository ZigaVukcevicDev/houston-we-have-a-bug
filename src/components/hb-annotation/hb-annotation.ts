import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../../components/hb-toolbar/hb-toolbar';
import '../../components/hb-canvas/hb-canvas';
import type { HBCanvas } from '../../components/hb-canvas/hb-canvas';
import styles from './hb-annotation.scss';

@customElement('hb-annotation')
export class HBAnnotation extends LitElement {
  static styles = unsafeCSS(styles);

  @state()
  private dataUrl: string = '';

  @state()
  private color: string = '#ff0000';

  @state()
  private fontSize: number = 24;

  connectedCallback() {
    super.connectedCallback();
    this._loadScreenshotFromStorage();
  }

  private async _loadScreenshotFromStorage() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_SCREENSHOT',
      });
      if (response?.dataUrl) {
        this.dataUrl = response.dataUrl;
      }
    } catch (error) {
      console.error('Failed to load screenshot:', error);
    }
  }

  render() {
    if (!this.dataUrl) {
      return html`
        <div class="no-screenshot">
          <p>
            No screenshot loaded. Please capture a screenshot from the extension
            popup.
          </p>
        </div>
      `;
    }

    return html`
      <!-- TODO: remove when not needed
      <div class="header">
        <div class="header-actions">
          <button class="action-button secondary" @click=${this._handleClear}>
            Clear annotations
          </button>
          <button class="action-button primary" @click=${this._handleDownload}>
            <img src="../images/download-white.svg" alt="download" />
            Download
          </button>
        </div>
      </div>
      -->

      <div class="toolbar-container">
        <hb-toolbar></hb-toolbar>
      </div>

      <div class="canvas-container">
        <hb-canvas
          .dataUrl=${this.dataUrl}
          .color=${this.color}
          .fontSize=${this.fontSize}
        ></hb-canvas>
      </div>
    `;
  }

  private _handleClear() {
    const canvas = this.shadowRoot?.querySelector('hb-canvas') as HBCanvas;
    canvas?.clearAnnotations();
  }

  private _handleDownload() {
    const canvas = this.shadowRoot?.querySelector('hb-canvas') as HBCanvas;
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    canvas?.download(`bug ${date} at ${time}.jpg`);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-annotation': HBAnnotation;
  }
}
