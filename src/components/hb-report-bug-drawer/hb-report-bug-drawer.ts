import { LitElement, html, unsafeCSS } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { customElement, property, state } from 'lit/decorators.js';
import '../hb-form-input/hb-form-input';
import '../hb-searchable-dropdown/hb-searchable-dropdown';
import type { DropdownOption } from '../hb-searchable-dropdown/hb-searchable-dropdown';
import styles from './hb-report-bug-drawer.scss';

const connectionErrorMessage = 'Could not connect. Check your URL and token.';
const STORAGE_KEY = 'azure_devops_credentials';

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

  @state()
  private projects: DropdownOption[] = [];

  @state()
  private projectsLoading: boolean = false;

  @state()
  private projectsError: string = '';

  @state()
  private selectedProjectId: string = '';

  @state()
  private parentOptions: DropdownOption[] = [];

  @state()
  private parentLoading: boolean = false;

  @state()
  private selectedParentId: string = '';

  private parentSearchDebounce: ReturnType<typeof setTimeout> | null = null;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.handleEscapeKey);
    this.loadCredentials();
  }

  private async loadCredentials() {
    if (!chrome?.storage?.local) return;
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const saved = result[STORAGE_KEY];
    if (saved?.orgUrl && saved?.pat) {
      this.orgUrl = saved.orgUrl;
      this.pat = saved.pat;
      this.isConfigured = true;
      this.fetchProjects();
    }
  }

  private async saveCredentials() {
    if (!chrome?.storage?.local) return;
    await chrome.storage.local.set({ [STORAGE_KEY]: { orgUrl: this.orgUrl, pat: this.pat } });
  }

  private handleParentSearch(e: CustomEvent) {
    const query = (e.detail as string).trim();
    if (this.parentSearchDebounce) clearTimeout(this.parentSearchDebounce);
    if (!query) {
      this.parentOptions = [];
      return;
    }
    this.parentSearchDebounce = setTimeout(() => this.fetchParentItems(query), 300);
  }

  private async fetchParentItems(query: string) {
    if (!this.selectedProjectId) return;
    const projectIdAtStart = this.selectedProjectId;
    this.parentLoading = true;
    try {
      const escapedQuery = query.replace(/'/g, "''");
      const numericId = /^\d+$/.test(query.trim()) ? parseInt(query.trim(), 10) : null;
      const condition = numericId !== null
        ? `([System.Title] CONTAINS '${escapedQuery}' OR [System.Id] = ${numericId})`
        : `[System.Title] CONTAINS '${escapedQuery}'`;
      const wiql = `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.WorkItemType] IN ('User Story', 'Feature', 'Epic') AND ${condition} ORDER BY [System.ChangedDate] DESC`;
      const wiqlResponse = await fetch(
        `${this.orgUrl}/${this.selectedProjectId}/_apis/wit/wiql?$top=20&api-version=7.1`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${btoa(`:${this.pat}`)}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ query: wiql }),
        }
      );
      if (!wiqlResponse.ok) throw new Error();
      const wiqlData = await wiqlResponse.json();
      const ids: number[] = (wiqlData.workItems as { id: number }[])?.map(w => w.id) ?? [];
      if (ids.length === 0) {
        if (this.selectedProjectId === projectIdAtStart) this.parentOptions = [];
        return;
      }
      const detailsResponse = await fetch(
        `${this.orgUrl}/_apis/wit/workitems?ids=${ids.join(',')}&fields=System.Title,System.WorkItemType&api-version=7.1`,
        {
          headers: {
            Authorization: `Basic ${btoa(`:${this.pat}`)}`,
            Accept: 'application/json',
          },
        }
      );
      if (!detailsResponse.ok) throw new Error();
      const detailsData = await detailsResponse.json();
      if (this.selectedProjectId !== projectIdAtStart) return;
      this.parentOptions = (
        detailsData.value as {
          id: number;
          fields: { 'System.Title': string; 'System.WorkItemType': string };
        }[]
      ).map(item => ({
        id: String(item.id),
        name: item.fields['System.Title'],
        meta: item.fields['System.WorkItemType'],
        subtitle: `#${item.id}`,
      }));
    } catch {
      if (this.selectedProjectId === projectIdAtStart) this.parentOptions = [];
    } finally {
      if (this.selectedProjectId === projectIdAtStart) this.parentLoading = false;
    }
  }

  private async fetchProjects() {
    if (!this.orgUrl || !this.pat) return;
    this.projectsLoading = true;
    this.projectsError = '';
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
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      this.projects = (data.value as { id: string; name: string }[]).map(p => ({
        id: p.id,
        name: p.name,
      }));
    } catch {
      this.projectsError = 'Could not load projects. Try reconnecting in Settings.';
    } finally {
      this.projectsLoading = false;
    }
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
      await this.saveCredentials();
      const data = await response.json();
      this.projects = (data.value as { id: string; name: string }[]).map(p => ({
        id: p.id,
        name: p.name,
      }));
      this.selectedProjectId = '';
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
              width="16"
              height="16"
            />
            <img
              class="icon-hover-and-active"
              src="../images/back-white.svg"
              alt="back"
              width="16"
              height="16"
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
          class="action-button primary loading"
          @click=${this.handleVerifyConnection}
          ?disabled=${this.isVerifying}
        >
          ${this.isVerifying ? html`<span class="spinner"></span>` : ''} Verify
          and save
        </button>
        ${this.connectionError
          ? html`
              <div class="error-message">
                <img src="../images/cancel-red.svg" alt="error" />
                <p>${this.connectionError}</p>
              </div>
            `
          : ''}
        ${this.connectionSuccess
          ? html`
              <div class="success-message">
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
          : html`
              <hb-searchable-dropdown
                label="Project"
                isRequired
                placeholder="Select project…"
                .options=${this.projects}
                .loading=${this.projectsLoading}
                .value=${this.selectedProjectId}
                @change=${(e: CustomEvent) => {
                  this.selectedProjectId = (e.detail as DropdownOption).id;
                  this.selectedParentId = '';
                  this.parentOptions = [];
                }}
              ></hb-searchable-dropdown>
              ${this.projectsError
                ? html`
                    <div class="error-message">
                      <img src="../images/cancel-red.svg" alt="error" />
                      <p>${this.projectsError}</p>
                    </div>
                  `
                : ''}
              ${this.selectedProjectId
                ? keyed(this.selectedProjectId, html`
                    <hb-searchable-dropdown
                      label="Parent work item"
                      placeholder="Search by title or id..."
                      ?asyncSearch=${true}
                      .options=${this.parentOptions}
                      .loading=${this.parentLoading}
                      .value=${this.selectedParentId}
                      @search=${this.handleParentSearch}
                      @change=${(e: CustomEvent) => {
                        this.selectedParentId = (e.detail as DropdownOption).id;
                      }}
                    ></hb-searchable-dropdown>
                  `)
                : ''}
            `}
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
