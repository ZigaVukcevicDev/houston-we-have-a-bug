import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '../hb-form-input/hb-form-input';
import styles from './hb-report-bug-drawer.scss';

const connectionErrorMessage = 'Could not connect. Check your URL and token.';

@customElement('hb-report-bug-drawer')
export class HBReportBugDrawer extends LitElement {
  static styles = unsafeCSS(styles);

  @property({ type: Boolean })
  isOpen: boolean = false;

  @state()
  private isClosing: boolean = false;

  @state()
  private orgUrl: string = '';

  @state()
  private pat: string = '';

  @state()
  private isOrgUrlValid: boolean = true;

  @state()
  private connectionError: string = '';

  @state()
  private connectionSuccess: boolean = false;

  @state()
  private isVerifying: boolean = false;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.handleEscapeKey);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleEscapeKey);
  }

  private handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.isOpen) {
      this.handleClose();
    }
  };

  private handleClose() {
    this.isClosing = true;
  }

  private handleAnimationEnd(e: AnimationEvent) {
    if (e.animationName === 'slide-out-to-right') {
      this.isClosing = false;
      this.connectionError = '';
      this.connectionSuccess = false;
      this.isOrgUrlValid = true;
      this.dispatchEvent(
        new CustomEvent('close', { bubbles: true, composed: true })
      );
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private async handleVerifyConnection() {
    if (this.isVerifying) return;

    this.isOrgUrlValid = this.isValidUrl(this.orgUrl);
    if (!this.isOrgUrlValid) return;

    this.isVerifying = true;
    this.connectionSuccess = false;
    this.connectionError = '';

    try {
      const response = await fetch(
        `${this.orgUrl}/_apis/projects?api-version=7.1`,
        {
          headers: {
            Authorization: `Basic ${btoa(`:${this.pat}`)}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        this.connectionError = connectionErrorMessage;
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        this.connectionError = connectionErrorMessage;
        return;
      }

      this.connectionError = '';
      this.connectionSuccess = true;
      const data = await response.json();
      console.warn('Connection verified:', data);
    } catch {
      this.connectionSuccess = false;
      this.connectionError = connectionErrorMessage;
    } finally {
      this.isVerifying = false;
    }
  }

  render() {
    if (!this.isOpen) return html``;

    return html`
      <div
        class="overlay ${this.isClosing ? 'closing' : ''}"
        @click=${this.handleClose}
      ></div>
      <div
        class="panel ${this.isClosing ? 'closing' : ''}"
        @animationend=${this.handleAnimationEnd}
      >
        <div class="header">
          <button class="icon-button" @click=${this.handleClose} title="Close">
            Close
            <!-- <img src="../images/close-black.svg" alt="close" /> -->
          </button>
        </div>
        <div class="body">
          <button class="icon-button" title="Settings">
            Settings
            <!-- <img src="../images/settings-black.svg" alt="settings" /> -->
          </button>
          <hb-form-input
            label="Organization URL"
            isRequired
            ?isValid=${this.isOrgUrlValid}
            .additionalInfo=${'e.g. https://dev.azure.com/my-org'}
          >
            <input
              type="text"
              .value=${this.orgUrl}
              @input=${(e: InputEvent) => {
                this.orgUrl = (e.target as HTMLInputElement).value;
                this.isOrgUrlValid = true;
              }}
            />
          </hb-form-input>
          <hb-form-input
            label="Personal access token"
            isRequired
            .additionalInfo=${'Go to <strong>Azure DevOps</strong> → <strong>User settings</strong> → <strong>Personal access tokens</strong> and create a new token with <strong>any name</strong>.<br />Under <strong>Scopes</strong>, select <strong>Custom defined</strong> and enable:<ul><li>Work Items (Read & write) and</li><li>Project and Team (Read).</li></ul>'}
          >
            <input
              type="password"
              .value=${this.pat}
              @input=${(e: InputEvent) =>
                (this.pat = (e.target as HTMLInputElement).value)}
            />
          </hb-form-input>
          <button
            class="action-button primary"
            @click=${this.handleVerifyConnection}
            ?disabled=${this.isVerifying}
          >
            Verify and save${this.isVerifying ? ' (loading)' : ''}
          </button>
          ${this.connectionError
            ? html`<p class="error">${this.connectionError}</p>`
            : ''}
          ${this.connectionSuccess
            ? html`<p class="success">Connection verified and saved.</p>`
            : ''}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-report-bug-drawer': HBReportBugDrawer;
  }
}
