import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../../components/hb-toolbar/hb-toolbar';
import '../../components/hb-canvas/hb-canvas';
import type { HBCanvas } from '../../components/hb-canvas/hb-canvas';
import { getDateTimeForFilename } from '../../utils/get-date-time-for-filename';
import type { ActiveTool } from '../../types/active-tool.type';
import styles from './hb-annotation.scss';

@customElement('hb-annotation')
export class HBAnnotation extends LitElement {
  static styles = unsafeCSS(styles);

  @state()
  private dataUrl: string = '';

  @state()
  private activeTool: ActiveTool | null = null;

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
          @tool-change=${this.handleToolChange}
        ></hb-toolbar>
      </div>
      <div class="topbar-container">
        <button
          class="action-button primary"
          @click=${this.handleDownload}
        >
          <img src="../images/download-white.svg" alt="download" />
          Download
        </button>
        <button class="action-button secondary ml-md">
          <img src="../images/info-black.svg" alt="info" class="icon-default" />
          <img src="../images/info-white.svg" alt="info" class="icon-hover-and-active" />
          System info
        </button>
      </div>
      <div class="system-info-container">
        Text goes here
      </div> 
      <div class="canvas-container">
        <hb-canvas
          .dataUrl=${this.dataUrl}
          .activeTool=${this.activeTool}
          @tool-change=${this.handleToolChange}
        ></hb-canvas>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadScreenshotFromStorage();
  }

  private async loadScreenshotFromStorage() {
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

  private handleToolChange(event: CustomEvent) {
    this.activeTool = event.detail.tool;
  }

  private handleDownload() {
    const canvas = this.shadowRoot?.querySelector('hb-canvas') as HBCanvas;
    canvas?.download(`bug ${getDateTimeForFilename()}.jpg`);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-annotation': HBAnnotation;
  }
}
