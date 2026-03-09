import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import styles from './hb-form-input.scss';

const ERROR_SHADOW = '0 0 0 1.5px #e74c3c';

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
  private showOutline: boolean = false;

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
    this.assignedInput = (slot.assignedElements()[0] as HTMLInputElement) ?? null;
    if (this.assignedInput) {
      this.assignedInput.addEventListener('blur', this.onBlur);
      this.applyOutline();
    }
  }

  private onBlur = () => {
    this.showOutline =
      !!this.error || this.invalid || (this.isRequired && !this.assignedInput?.value.trim());
    this.applyOutline();
  };

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('error') || changedProperties.has('invalid')) {
      this.showOutline = !!this.error || this.invalid;
      this.applyOutline();
    }
  }

  private applyOutline() {
    if (!this.assignedInput) return;
    this.assignedInput.style.boxShadow = this.showOutline ? ERROR_SHADOW : '';
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
      <slot></slot>
      ${this.error
        ? html`<p class="error">${this.error}</p>`
        : this.additionalInfo
          ? html`<p>${unsafeHTML(this.additionalInfo)}</p>`
          : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-form-input': HBFormInput;
  }
}
