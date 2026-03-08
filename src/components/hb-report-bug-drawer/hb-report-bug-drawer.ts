import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '../hb-form-input/hb-form-input';
import styles from './hb-report-bug-drawer.scss';

@customElement('hb-report-bug-drawer')
export class HBReportBugDrawer extends LitElement {
  static styles = unsafeCSS(styles);

  @property({ type: Boolean })
  isOpen: boolean = false;

  @state()
  private isClosing: boolean = false;

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
      this.dispatchEvent(
        new CustomEvent('close', { bubbles: true, composed: true })
      );
    }
  }

  private handleVerifyConnection() {
    console.log('verifying connection...');
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
            .additionalInfo=${'e.g. https://dev.azure.com/my-org'}
          >
            <input type="text" />
          </hb-form-input>
          <hb-form-input
            label="Personal access token"
            isRequired
            .additionalInfo=${'Generate a PAT in Azure DevOps under<br />User Settings → Personal Access Tokens'}
          >
            <input type="password" />
          </hb-form-input>
          <button
            class="action-button primary"
            @click=${this.handleVerifyConnection}
          >
            Verify and save
          </button>
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
