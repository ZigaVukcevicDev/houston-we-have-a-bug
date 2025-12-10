import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../../components/hb-toolbar/hb-toolbar';
import '../../components/hb-annotation-canvas/hb-annotation-canvas';
import type { AnnotationCanvas } from '../../components/annotation-canvas/annotation-canvas';
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
      <div class="header">
        <h1>Annotate screenshot</h1>
        <div class="header-actions">
          <button class="secondary-btn" @click=${this._handleClear}>
            Clear annotations
          </button>
          <button @click=${this._handleDownload}>Download</button>
        </div>
      </div>

      <div class="toolbar-container">
        <hb-toolbar
          .color=${this.color}
          .fontSize=${this.fontSize}
          @color-change=${this._handleColorChange}
          @font-size-change=${this._handleFontSizeChange}
        ></hb-toolbar>
      </div>

      <div class="canvas-container">
        <annotation-canvas
          .dataUrl=${this.dataUrl}
          .color=${this.color}
          .fontSize=${this.fontSize}
        ></annotation-canvas>
      </div>
    `;
  }

  private _handleColorChange(e: CustomEvent<string>) {
    this.color = e.detail;
  }

  private _handleFontSizeChange(e: CustomEvent<number>) {
    this.fontSize = e.detail;
  }

  private _handleClear() {
    const canvas = this.shadowRoot?.querySelector(
      'hb-annotation-canvas'
    ) as AnnotationCanvas;
    canvas?.clearAnnotations();
  }

  private _handleDownload() {
    const canvas = this.shadowRoot?.querySelector(
      'hb-annotation-canvas'
    ) as AnnotationCanvas;
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
