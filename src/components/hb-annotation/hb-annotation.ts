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
  private activeTool: string | null = null;

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
      <div class="toolbar-container">
        <hb-toolbar 
          .activeTool=${this.activeTool}
          @download=${this._handleDownload}
          @tool-change=${this._handleToolChange}
        ></hb-toolbar>
      </div>
      <div class="canvas-container">
        <hb-canvas
          .dataUrl=${this.dataUrl}
          .drawingMode=${this.activeTool}
          @tool-change=${this._handleToolChange}
        ></hb-canvas>
      </div>
    `;
  }

  private _handleToolChange(event: CustomEvent) {
    this.activeTool = event.detail.tool;
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
