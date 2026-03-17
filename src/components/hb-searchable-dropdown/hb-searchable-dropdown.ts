import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import styles from './hb-searchable-dropdown.scss';

export interface DropdownOption {
  id: string;
  name: string;
}

@customElement('hb-searchable-dropdown')
export class HBSearchableDropdown extends LitElement {
  static styles = unsafeCSS(styles);

  @property({ type: Array })
  options: DropdownOption[] = [];

  @property({ type: String })
  value: string = '';

  @property({ type: String })
  placeholder: string = 'Select...';

  @property({ type: Boolean })
  loading: boolean = false;

  @property({ type: Boolean })
  invalid: boolean = false;

  @property({ type: String })
  label: string = '';

  @property({ type: Boolean })
  isRequired: boolean = false;

  @state()
  private isOpen: boolean = false;

  @state()
  private searchQuery: string = '';

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.handleDocumentClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleDocumentClick);
  }

  private handleDocumentClick = (e: MouseEvent) => {
    if (!(e.composedPath() as Node[]).includes(this)) {
      this.closeDropdown();
    }
  };

  private closeDropdown() {
    this.isOpen = false;
    this.searchQuery = '';
  }

  private get filteredOptions(): DropdownOption[] {
    if (!this.searchQuery.trim()) return this.options;
    const q = this.searchQuery.toLowerCase();
    return this.options.filter(o => o.name.toLowerCase().includes(q));
  }

  private get selectedOption(): DropdownOption | undefined {
    return this.options.find(o => o.id === this.value);
  }

  private handleTriggerClick() {
    if (this.loading) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.updateComplete.then(() => {
        this.shadowRoot?.querySelector<HTMLInputElement>('.search-input')?.focus();
      });
    } else {
      this.searchQuery = '';
    }
  }

  private handleTriggerKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleTriggerClick();
    } else if (e.key === 'Escape') {
      this.closeDropdown();
    }
  }

  private selectOption(option: DropdownOption) {
    this.value = option.id;
    this.closeDropdown();
    this.classList.remove('error-validation');
    this.dispatchEvent(
      new CustomEvent('change', { detail: option, bubbles: true, composed: true })
    );
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('invalid')) {
      this.classList.toggle('error-validation', this.invalid);
    }
  }

  render() {
    const filtered = this.filteredOptions;
    const selected = this.selectedOption;

    return html`
      ${this.label
        ? html`<label
            >${this.label}${this.isRequired
              ? html`<span class="required"> *</span>`
              : ''}</label
          >`
        : ''}
      <div class="select-wrapper">
        <div
          class="trigger ${this.isOpen ? 'open' : ''} ${this.loading
            ? 'is-loading'
            : ''}"
          tabindex=${this.loading ? '-1' : '0'}
          @click=${this.handleTriggerClick}
          @keydown=${this.handleTriggerKeydown}
          role="combobox"
          aria-expanded=${this.isOpen}
          aria-haspopup="listbox"
        >
          ${this.loading
            ? html`<span class="spinner"></span>
                <span class="trigger-text placeholder">Loading projects…</span>`
            : html`<span class="trigger-text ${!selected ? 'placeholder' : ''}">
                  ${selected?.name ?? this.placeholder}
                </span>
                <svg
                  class="chevron"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="black"
                    stroke-width="1.25"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>`}
        </div>
        ${this.isOpen
          ? html`
              <div class="dropdown" role="listbox">
                <div class="search-wrapper">
                  <input
                    class="search-input"
                    type="text"
                    placeholder="Search…"
                    .value=${this.searchQuery}
                    @input=${(e: InputEvent) => {
                      this.searchQuery = (e.target as HTMLInputElement).value;
                    }}
                    @keydown=${(e: KeyboardEvent) => {
                      if (e.key === 'Escape') this.closeDropdown();
                    }}
                  />
                </div>
                ${filtered.length > 0
                  ? html`
                      <ul class="options-list">
                        ${filtered.map(
                          option => html`
                            <li
                              class="option ${option.id === this.value
                                ? 'selected'
                                : ''}"
                              @click=${() => this.selectOption(option)}
                              role="option"
                              aria-selected=${option.id === this.value}
                            >
                              ${option.name}
                            </li>
                          `
                        )}
                      </ul>
                    `
                  : html`<p class="no-results">No projects found.</p>`}
              </div>
            `
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-searchable-dropdown': HBSearchableDropdown;
  }
}
