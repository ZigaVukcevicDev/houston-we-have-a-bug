import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './components/main-view';
import './components/screenshot-editor';

type View = 'main' | 'editor';

@customElement('houston-we-have-a-bug')
export class HoustonWeHaveABug extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 300px;
      font-family:
        -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
    }

    :host(.editor-view) {
      width: 500px;
    }
  `;

  @state()
  private currentView: View = 'main';

  @state()
  private screenshotDataUrl: string = '';

  render() {
    return html`
      ${this.currentView === 'main'
        ? html`<main-view
            @capture-screenshot=${this._handleCaptureScreenshot}
          ></main-view>`
        : html`<screenshot-editor
            .dataUrl=${this.screenshotDataUrl}
            @close=${this._handleCloseEditor}
          ></screenshot-editor>`}
    `;
  }

  private _handleCaptureScreenshot(e: CustomEvent<string>) {
    this.screenshotDataUrl = e.detail;
    this.currentView = 'editor';
    this.classList.add('editor-view');
  }

  private _handleCloseEditor() {
    this.currentView = 'main';
    this.screenshotDataUrl = '';
    this.classList.remove('editor-view');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'houston-we-have-a-bug': HoustonWeHaveABug;
  }
}
