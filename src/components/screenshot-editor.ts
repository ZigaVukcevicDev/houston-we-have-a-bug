import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './editor-toolbar';
import './annotation-canvas';
import type { AnnotationCanvas } from './annotation-canvas';

@customElement('screenshot-editor')
export class ScreenshotEditor extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      padding: 16px;
      max-height: 600px;
      overflow: hidden;
    }

    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .editor-header h2 {
      font-size: 16px;
      color: #333;
      margin: 0;
    }

    .close-btn {
      width: auto;
      padding: 4px 10px;
      font-size: 20px;
      line-height: 1;
      background: transparent;
      color: #666;
      border: none;
      cursor: pointer;
      border-radius: 4px;
    }

    .close-btn:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #333;
    }

    .editor-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .editor-actions button {
      flex: 1;
      padding: 10px 16px;
      background: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.3s;
    }

    .editor-actions button:hover {
      background: #357ae8;
    }

    .secondary-btn {
      background: #757575 !important;
    }

    .secondary-btn:hover {
      background: #616161 !important;
    }
  `;

  @property({ type: String })
  dataUrl: string = '';

  @state()
  private color: string = '#ff0000';

  @state()
  private fontSize: number = 24;

  render() {
    return html`
      <div class="editor-header">
        <h2>Annotate screenshot</h2>
        <button class="close-btn" @click=${this._handleClose}>×</button>
      </div>

      <editor-toolbar
        .color=${this.color}
        .fontSize=${this.fontSize}
        @color-change=${this._handleColorChange}
        @font-size-change=${this._handleFontSizeChange}
      ></editor-toolbar>

      <annotation-canvas
        .dataUrl=${this.dataUrl}
        .color=${this.color}
        .fontSize=${this.fontSize}
      ></annotation-canvas>

      <div class="editor-actions">
        <button class="secondary-btn" @click=${this._handleClear}>Clear</button>
        <button @click=${this._handleDownload}>Download</button>
      </div>
    `;
  }

  private _handleClose() {
    this.dispatchEvent(
      new CustomEvent('close', { bubbles: true, composed: true })
    );
  }

  private _handleColorChange(e: CustomEvent<string>) {
    this.color = e.detail;
  }

  private _handleFontSizeChange(e: CustomEvent<number>) {
    this.fontSize = e.detail;
  }

  private _handleClear() {
    const canvas = this.shadowRoot?.querySelector(
      'annotation-canvas'
    ) as AnnotationCanvas;
    canvas?.clearAnnotations();
  }

  private _handleDownload() {
    const canvas = this.shadowRoot?.querySelector(
      'annotation-canvas'
    ) as AnnotationCanvas;
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    canvas?.download(`bug-screenshot-${timestamp}.png`);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'screenshot-editor': ScreenshotEditor;
  }
}
