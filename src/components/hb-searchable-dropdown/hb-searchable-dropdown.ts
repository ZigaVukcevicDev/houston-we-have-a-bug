import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import styles from './hb-searchable-dropdown.scss';

export interface DropdownOption {
  id: string;
  name: string;
  meta?: string; // e.g., "User Story", "Feature", "Epic"
  subtitle?: string; // e.g., "#123"
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

  @property({ type: String })
  additionalInfo: string = '';

  /** When true, filtering is skipped and a `search` event is emitted on input change. */
  @property({ type: Boolean })
  asyncSearch: boolean = false;

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
    if (this.asyncSearch) return this.options;
    if (!this.searchQuery.trim()) return this.options;
    const q = this.searchQuery.toLowerCase();
    return this.options.filter(o => o.name.toLowerCase().includes(q));
  }

  private get selectedOption(): DropdownOption | undefined {
    return this.options.find(o => o.id === this.value);
  }

  private handleTriggerClick() {
    if (this.loading && !this.asyncSearch) return;
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

  private handleSearchInput(e: InputEvent) {
    this.searchQuery = (e.target as HTMLInputElement).value;
    if (this.asyncSearch) {
      this.dispatchEvent(
        new CustomEvent('search', {
          detail: this.searchQuery,
          bubbles: true,
          composed: true,
        })
      );
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

  private renderOptionsList() {
    const filtered = this.filteredOptions;

    if (this.asyncSearch && !this.searchQuery.trim()) {
      return html`<p class="search-hint">Start typing to search…</p>`;
    }

    if (this.loading) {
      return html`<div class="dropdown-loading"><span class="spinner-dark"></span></div>`;
    }

    if (filtered.length === 0) {
      return html`<p class="no-results">No results found.</p>`;
    }

    return html`
      <ul class="options-list">
        ${filtered.map(
          option => html`
            <li
              class="option ${option.id === this.value ? 'selected' : ''}"
              @click=${() => this.selectOption(option)}
              role="option"
              aria-selected=${option.id === this.value}
            >
              <div class="option-content">
                <span class="option-name">${option.name}</span>
                ${option.meta || option.subtitle
                  ? html`<span class="option-tags">
                      ${option.meta
                        ? html`<span class="option-meta ${option.meta.toLowerCase().replace(/\s+/g, '-')}"
                            >${option.meta}</span
                          >`
                        : ''}
                      ${option.subtitle
                        ? html`<span class="option-subtitle">${option.subtitle}</span>`
                        : ''}
                    </span>`
                  : ''}
              </div>
            </li>
          `
        )}
      </ul>
    `;
  }

  render() {
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
          class="trigger ${this.isOpen ? 'open' : ''} ${this.loading && !this.asyncSearch
            ? 'is-loading'
            : ''}"
          tabindex=${this.loading && !this.asyncSearch ? '-1' : '0'}
          @click=${this.handleTriggerClick}
          @keydown=${this.handleTriggerKeydown}
          role="combobox"
          aria-expanded=${this.isOpen}
          aria-haspopup="listbox"
        >
          ${this.loading && !this.asyncSearch
            ? html`<span class="spinner"></span>
                <span class="trigger-text placeholder">Loading…</span>`
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
                    @input=${this.handleSearchInput}
                    @keydown=${(e: KeyboardEvent) => {
                      if (e.key === 'Escape') this.closeDropdown();
                    }}
                  />
                </div>
                ${this.renderOptionsList()}
              </div>
            `
          : ''}
      </div>
      ${this.additionalInfo
        ? html`<p class="additional-info">${this.additionalInfo}</p>`
        : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-searchable-dropdown': HBSearchableDropdown;
  }
}
