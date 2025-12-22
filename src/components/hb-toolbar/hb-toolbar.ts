import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import styles from './hb-toolbar.scss';
import '../hb-toolbar-tool/hb-toolbar-tool';
import type { ToolType } from '../../types/tool-type.type';


@customElement('hb-toolbar')
export class HBToolbar extends LitElement {
  static styles = unsafeCSS(styles);

  @property({ type: String })
  activeTool: ToolType | null = null;

  render() {
    return html`
      <div class="toolbar">
        <a href="https://github.com/ZigaVukcevicDev/houston-we-have-a-bug" class="logo" target="_blank" title="GitHub">
          <img src="../images/rocket.svg" alt="rocket" />
        </a>

        <div class="tools">
          <hb-toolbar-tool title="Select" icon="select" .isActive=${this.activeTool === 'select'} @click=${() => this._handleToolClick('select')}></hb-toolbar-tool>
          <hb-toolbar-tool title="Text" icon="text" .isActive=${this.activeTool === 'text'} @click=${() => this._handleToolClick('text')}></hb-toolbar-tool>
          <hb-toolbar-tool title="Line" icon="line" .isActive=${this.activeTool === 'line'} @click=${() => this._handleToolClick('line')}></hb-toolbar-tool>
          <hb-toolbar-tool title="Arrow" icon="arrow" .isActive=${this.activeTool === 'arrow'} @click=${() => this._handleToolClick('arrow')}></hb-toolbar-tool>
          <hb-toolbar-tool title="Rectangle" icon="rectangle" .isActive=${this.activeTool === 'rectangle'} @click=${() => this._handleToolClick('rectangle')}></hb-toolbar-tool>
          <hb-toolbar-tool title="Crop" icon="crop" .isActive=${this.activeTool === 'crop'} @click=${() => this._handleToolClick('crop')}></hb-toolbar-tool>
        </div>

        <button class="download" title="Download" @click=${this._handleDownload}>
          <img src="../images/download-white.svg" alt="download" />
        </button>
      </div> 
    `;
  }

  private _handleToolClick(tool: ToolType) {
    this.activeTool = tool;

    this.dispatchEvent(new CustomEvent('tool-change', {
      bubbles: true,
      composed: true,
      detail: { tool }
    }));
  }

  private _handleDownload() {
    this.dispatchEvent(new CustomEvent('download', { bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-toolbar': HBToolbar;
  }
}
