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
  invalid: boolean = false;

  @property({ type: String })
  error: string = '';

  @property({ type: String })
  additionalInfo: string = '';

  private assignedInput: HTMLInputElement | null = null;

  protected firstUpdated() {
    const slot = this.shadowRoot?.querySelector('slot');
    if (!slot) return;
    slot.addEventListener('slotchange', () => this.bindInputListeners(slot));
    this.bindInputListeners(slot);
  }

  private bindInputListeners(slot: HTMLSlotElement) {
    if (this.assignedInput) {
      this.assignedInput.removeEventListener('blur', this.onBlur);
    }
    this.assignedInput =
      (slot.assignedElements()[0] as HTMLInputElement) ?? null;
    if (this.assignedInput) {
      this.assignedInput.addEventListener('blur', this.onBlur);
      this.applyErrorClass(!!this.error || this.invalid);
    }
  }

  private onBlur = () => {
    this.applyErrorClass(
      !!this.error ||
        this.invalid ||
        (this.isRequired && !this.assignedInput?.value.trim())
    );
  };

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('error') || changedProperties.has('invalid')) {
      this.applyErrorClass(!!this.error || this.invalid);
    }
  }

  private applyErrorClass(hasError: boolean) {
    this.classList.toggle('error', hasError);
  }

  private focusInput() {
    this.assignedInput?.focus();
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
      <div class="input-wrapper"><slot></slot></div>
      ${this.error
        ? html`<p class="error">${this.error}</p>`
        : this.additionalInfo
          ? html`<div class="additional-info">
              ${unsafeHTML(this.additionalInfo)}
            </div>`
          : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-form-input': HBFormInput;
  }
}
