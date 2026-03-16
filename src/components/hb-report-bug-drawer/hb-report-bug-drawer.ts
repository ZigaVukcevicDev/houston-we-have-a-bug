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
  private view: 'report-bug' | 'settings' = 'report-bug';

  @state()
  private isConfigured: boolean = false;

  @state()
  private orgUrl: string = '';

  @state()
  private pat: string = '';

  @state()
  private isOrgUrlValid: boolean = true;

  @state()
  private isPatValid: boolean = true;

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
      if (this.view === 'settings') {
        this.view = 'report-bug';
      } else {
        this.handleClose();
      }
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
      this.isPatValid = true;
      this.view = 'report-bug';
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
    this.isPatValid = this.pat.trim().length > 0;
    if (!this.isOrgUrlValid || !this.isPatValid) return;

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
      this.isConfigured = true;
      const data = await response.json();
      console.warn('Connection verified:', data);
    } catch {
      this.connectionSuccess = false;
      this.connectionError = connectionErrorMessage;
    } finally {
      this.isVerifying = false;
    }
  }

  private renderSettingsView() {
    return html`
      <div class="header settings-header">
        <div class="header-top">
          <button
            class="action-button tertiary back"
            @click=${() => (this.view = 'report-bug')}
            title="Back"
          >
            <img
              class="icon-default"
              src="../images/back-black.svg"
              alt="back"
            />
            <img
              class="icon-hover-and-active"
              src="../images/back-white.svg"
              alt="back"
            />
            Back
          </button>
          <button
            class="action-button tertiary close"
            @click=${this.handleClose}
            title="Close"
          >
            <img
              class="icon-default"
              src="../images/cancel-black.svg"
              alt="close"
            />
            <img
              class="icon-hover-and-active"
              src="../images/cancel-white.svg"
              alt="close"
            />
          </button>
        </div>
        <h2 class="header-title">Settings</h2>
      </div>
      <div class="body">
        <hb-form-input
          label="Organization URL"
          isRequired
          ?invalid=${!this.isOrgUrlValid && !this.orgUrl.trim()}
          .error=${!this.isOrgUrlValid && this.orgUrl.trim()
            ? 'Please enter a valid URL'
            : ''}
          .additionalInfo=${'Example: https://dev.azure.com/my-org'}
        >
          <input
            type="text"
            .value=${this.orgUrl}
            @input=${(e: InputEvent) => {
              this.orgUrl = (e.target as HTMLInputElement).value;
            }}
            @blur=${() => {
              if (this.orgUrl.trim()) {
                this.isOrgUrlValid = this.isValidUrl(this.orgUrl);
              }
            }}
          />
        </hb-form-input>
        <hb-form-input
          label="Personal access token"
          isRequired
          ?invalid=${!this.isPatValid}
          .additionalInfo=${'<p>Go to Azure DevOps → User settings → Personal access tokens and create a new token with any name.</p><p>Under Scopes, select Custom defined and enable:</p><ul><li>Work Items (Read & write)</li><li>Project and Team (Read).</li></ul>'}
        >
          <input
            type="password"
            .value=${this.pat}
            @input=${(e: InputEvent) => {
              this.pat = (e.target as HTMLInputElement).value;
            }}
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
          ? html`
              <div class="error">
                <img src="../images/cancel-red.svg" alt="error" />
                <p>${this.connectionError}</p>
              </div>
            `
          : ''}
        ${this.connectionSuccess
          ? html`
              <div class="success">
                <img src="../images/check-green.svg" alt="success" />
                <p>Connection verified and saved.</p>
              </div>
            `
          : ''}
      </div>
    `;
  }

  private renderReportBugView() {
    return html`
      <div class="header report-bug-header">
        <div class="header-top">
          <button
            class="action-button tertiary close"
            @click=${this.handleClose}
            title="Close"
          >
            <img
              class="icon-default"
              src="../images/cancel-black.svg"
              alt="close"
            />
            <img
              class="icon-hover-and-active"
              src="../images/cancel-white.svg"
              alt="close"
            />
          </button>
        </div>
        <div class="header-content">
          <h2 class="header-title">Report bug</h2>
          <button
            class="action-button tertiary"
            @click=${() => (this.view = 'settings')}
            title="Settings"
          >
            <img
              class="icon-default"
              src="../images/settings-black.svg"
              alt="settings"
            />
            <img
              class="icon-hover-and-active"
              src="../images/settings-white.svg"
              alt="settings"
            />
            Settings
          </button>
        </div>
      </div>
      <div class="body">
        ${!this.isConfigured
          ? html`
              <p class="info-text">
                Before you can report bugs, you'll need to set up your Azure
                DevOps connection.
              </p>
              <p class="info-text">Go to settings to get started.</p>
            `
          : html`<!-- bug report form -->`}
      </div>
    `;
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
        ${this.view === 'settings'
          ? this.renderSettingsView()
          : this.renderReportBugView()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-report-bug-drawer': HBReportBugDrawer;
  }
}
