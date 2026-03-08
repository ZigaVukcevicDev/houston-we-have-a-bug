import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import styles from './hb-form-input.scss';

@customElement('hb-form-input')
export class HBFormInput extends LitElement {
  static styles = unsafeCSS(styles);

  @property({ type: String })
  label: string = '';

  @property({ type: Boolean })
  isRequired: boolean = false;

  @property({ type: Boolean })
  isValid: boolean = true;

  @property({ type: String })
  additionalInfo: string = '';

  updated() {
    this.classList.toggle('invalid', !this.isValid);
  }

  private focusInput() {
    const slot = this.shadowRoot?.querySelector('slot');
    const input = slot?.assignedElements()[0] as HTMLElement | undefined;
    input?.focus();
  }

  render() {
    return html`
      ${this.label
        ? html`
            <label @click=${this.focusInput}>
              ${this.label}
              ${this.isRequired ? html`<span class="required">*</span>` : ''}
            </label>
          `
        : ''}
      <slot></slot>
      ${this.additionalInfo ? html`<p>${unsafeHTML(this.additionalInfo)}</p>` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-form-input': HBFormInput;
  }
}
