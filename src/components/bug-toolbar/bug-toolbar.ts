import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './bug-toolbar.scss';

@customElement('bug-toolbar')
export class BugToolbar extends LitElement {
  static styles = unsafeCSS(styles);

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
    'bug-toolbar': BugToolbar;
  }
}
