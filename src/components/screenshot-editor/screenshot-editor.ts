import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '../editor-toolbar/editor-toolbar';
import '../annotation-canvas/annotation-canvas';
import type { AnnotationCanvas } from '../annotation-canvas/annotation-canvas';
import styles from './screenshot-editor.scss';

@customElement('screenshot-editor')
export class ScreenshotEditor extends LitElement {
  static styles = unsafeCSS(styles);

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
