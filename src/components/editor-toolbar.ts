import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('editor-toolbar')
export class EditorToolbar extends LitElement {
  static styles = css`
    :host {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 12px;
      padding: 8px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .tool-btn {
      width: 36px;
      height: 36px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
      border-radius: 4px;
      background: #4285f4;
      color: white;
      border: none;
      cursor: pointer;
      transition: background 0.3s;
    }

    .tool-btn:hover {
      background: #357ae8;
    }

    input[type='color'] {
      width: 36px;
      height: 36px;
      padding: 2px;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      background: white;
    }

    input[type='color']::-webkit-color-swatch-wrapper {
      padding: 2px;
    }

    input[type='color']::-webkit-color-swatch {
      border: none;
      border-radius: 2px;
    }

    select {
      height: 36px;
      padding: 0 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      font-size: 13px;
      cursor: pointer;
    }

    select:focus {
      outline: none;
      border-color: #4285f4;
    }
  `;

  @property({ type: String })
  color: string = '#ff0000';

  @property({ type: Number })
  fontSize: number = 24;

  private fontSizes = [14, 18, 24, 32, 48];

  render() {
    return html`
      <button class="tool-btn" title="Add text">T</button>

      <input
        type="color"
        .value=${this.color}
        @input=${this._handleColorChange}
        title="Text color"
      />

      <select
        .value=${String(this.fontSize)}
        @change=${this._handleFontSizeChange}
        title="Font size"
      >
        ${this.fontSizes.map(
          (size) => html`<option value=${size}>${size}px</option>`
        )}
      </select>
    `;
  }

  private _handleColorChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent('color-change', {
        detail: input.value,
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleFontSizeChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.dispatchEvent(
      new CustomEvent('font-size-change', {
        detail: parseInt(select.value, 10),
        bubbles: true,
        composed: true,
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-toolbar': EditorToolbar;
  }
}
