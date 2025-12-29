import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './hb-toolbar.scss';
import '../hb-toolbar-tool/hb-toolbar-tool';
import type { ActiveTool } from '../../types/active-tool.type';


@customElement('hb-toolbar')
export class HBToolbar extends LitElement {
  static styles = unsafeCSS(styles);

  @property({ type: String })
  activeTool: ActiveTool | null = null;

  render() {
    return html`
      <div class="toolbar">
        <a href="https://github.com/ZigaVukcevicDev/houston-we-have-a-bug" class="logo" target="_blank" title="GitHub">
          <img src="../images/rocket.svg" alt="rocket" />
        </a>

        <div class="tools">
          <hb-toolbar-tool title="Select" icon="select" .isActive=${this.activeTool === 'select'} @click=${() => this.handleToolClick('select')}></hb-toolbar-tool>
          <hb-toolbar-tool title="Text" icon="text" .isActive=${this.activeTool === 'text'} @click=${() => this.handleToolClick('text')}></hb-toolbar-tool>
          <hb-toolbar-tool title="Line" icon="line" .isActive=${this.activeTool === 'line'} @click=${() => this.handleToolClick('line')}></hb-toolbar-tool>
          <hb-toolbar-tool title="Arrow" icon="arrow" .isActive=${this.activeTool === 'arrow'} @click=${() => this.handleToolClick('arrow')}></hb-toolbar-tool>
          <hb-toolbar-tool title="Rectangle" icon="rectangle" .isActive=${this.activeTool === 'rectangle'} @click=${() => this.handleToolClick('rectangle')}></hb-toolbar-tool>
          <hb-toolbar-tool title="Crop" icon="crop" .isActive=${this.activeTool === 'crop'} @click=${() => this.handleToolClick('crop')}></hb-toolbar-tool>
        </div>

        <button class="download" title="Download" @click=${this.handleDownload}>
          <img src="../images/download-white.svg" alt="download" />
        </button>
      </div> 
    `;
  }

  private handleToolClick(tool: ActiveTool) {
    this.activeTool = tool;

    this.dispatchEvent(new CustomEvent('tool-change', {
      bubbles: true,
      composed: true,
      detail: { tool }
    }));
  }

  private handleDownload() {
    this.dispatchEvent(new CustomEvent('download', { bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-toolbar': HBToolbar;
  }
}
