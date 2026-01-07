import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../../components/hb-toolbar/hb-toolbar';
import '../../components/hb-canvas/hb-canvas';
import type { HBCanvas } from '../../components/hb-canvas/hb-canvas';
import { getDateTimeForFilename } from '../../utils/get-date-time-for-filename';
import { getChromeVersion } from '../../utils/get-chrome-version';
import { getDateAndTime } from '../../utils/get-date-and-time';
import { getDevicePixelRatio } from '../../utils/get-device-pixel-ratio';
import { getDisplayResolution } from '../../utils/get-display-resolution';
import { getOS } from '../../utils/get-os';
import { getVisibleArea } from '../../utils/get-visible-area';
import type { SystemInfo } from '../../interfaces/system-info.interface';
import type { ActiveTool } from '../../types/active-tool.type';
import styles from './hb-annotation.scss';

@customElement('hb-annotation')
export class HBAnnotation extends LitElement {
  static styles = unsafeCSS(styles);

  @state()
  private dataUrl: string = '';

  @state()
  private activeTool: ActiveTool | null = null;

  @state()
  private systemInfo: SystemInfo | null = null;

  @state()
  private showSystemInfo: boolean = false;

  @state()
  private isCopyingDisabled = false;

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
        <button class="action-button secondary ml-md ${this.showSystemInfo ? 'activated' : ''} js-system-info-button" @click=${(e: Event) => { e.stopPropagation(); this.toggleSystemInfo(); }}>
          <img src="../images/info-black.svg" alt="info" class="icon-default" />
          <img src="../images/info-white.svg" alt="info" class="icon-hover-and-active" />
          System info
        </button>
      </div>
      ${this.showSystemInfo ? html`
        <div class="system-info-container js-system-info-container" @click=${(e: Event) => e.stopPropagation()}>
          ${this.renderSystemInfo()}
          </div>
      ` : ''} 
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

    // Add click listener for closing system info when clicking outside
    document.addEventListener('click', this.handleClickOutside, true);
    document.addEventListener('keydown', this.handleEscapeKey);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Clean up listener
    document.removeEventListener('click', this.handleClickOutside, true);
    document.removeEventListener('keydown', this.handleEscapeKey);
  }

  private handleClickOutside = (event: MouseEvent) => {
    if (!this.showSystemInfo) return;

    const path = event.composedPath();
    const container = this.shadowRoot?.querySelector('.js-system-info-container');
    const button = this.shadowRoot?.querySelector('.js-system-info-button');

    const clickedInside = path.some(el => {
      if (el === container || el === button) return true;

      if (el instanceof Node) {
        return (container && container.contains(el)) || (button && button.contains(el));
      }

      return false;
    });

    if (!clickedInside) {
      this.showSystemInfo = false;
    }
  };

  private handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.showSystemInfo) {
      this.showSystemInfo = false;
    }
  };

  private async loadScreenshotFromStorage() {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session');

    if (!sessionId) {
      console.error('No session ID found in URL');
      return;
    }

    try {
      const key = `screenshot_${sessionId}`;
      const result = await chrome.storage.session.get(key);
      const data = result[key];

      if (!data) {
        console.error('Screenshot data not found or expired');
        return;
      }

      this.dataUrl = data.dataUrl;
      this.systemInfo = data.systemInfo;

      await chrome.storage.session.remove(key);
    } catch (error) {
      console.error('Failed to load screenshot from storage:', error);
    }
  }

  private handleToolChange(event: CustomEvent) {
    this.activeTool = event.detail.tool;
  }

  private handleDownload() {
    const canvas = this.shadowRoot?.querySelector('hb-canvas') as HBCanvas;
    canvas?.download(`bug ${getDateTimeForFilename()}.jpg`);
  }

  private async toggleSystemInfo() {
    this.showSystemInfo = !this.showSystemInfo;
    // System info is already loaded from storage, no need to gather
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

  private renderCopyButtonIcon() {
    if (this.isCopyingDisabled) {
      return html`
        <img src="../images/check-black.svg" alt="check" class="icon-default" />
      `;
    }

    return html`
      <img src="../images/copy-black.svg" alt="copy" class="icon-default" />
      <img src="../images/copy-white.svg" alt="copy" class="icon-hover-and-active" />
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
          class="action-button tertiary"
          @click=${this.copyToClipboard}
          title="Copy to clipboard"
          ?disabled=${this.isCopyingDisabled}
        >
          ${this.renderCopyButtonIcon()}
          ${this.isCopyingDisabled ? 'Copied' : 'Copy'}
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
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-annotation': HBAnnotation;
  }
}
