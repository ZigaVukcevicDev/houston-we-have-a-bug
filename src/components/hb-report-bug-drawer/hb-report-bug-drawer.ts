import { LitElement, html, unsafeCSS } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { customElement, property, state } from 'lit/decorators.js';
import '../hb-form-input/hb-form-input';
import '../hb-searchable-dropdown/hb-searchable-dropdown';
import type { DropdownOption } from '../hb-searchable-dropdown/hb-searchable-dropdown';
import type { SystemInfo } from '../../interfaces/system-info.interface';
import styles from './hb-report-bug-drawer.scss';

const connectionErrorMessage = 'Could not connect. Check your URL and token.';
const STORAGE_KEY = 'azure_devops_credentials';

@customElement('hb-report-bug-drawer')
export class HBReportBugDrawer extends LitElement {
  static styles = unsafeCSS(styles);

  @property({ type: Boolean })
  isOpen: boolean = false;

  @property({ attribute: false })
  systemInfo: SystemInfo | null = null;

  @property({ attribute: false })
  annotatedScreenshot: string = '';

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

  @state()
  private bugTitle: string = '';

  @state()
  private bugReproSteps: string = '';

  @state()
  private bugSystemInfo: string = '';

  @state()
  private bugSeverity: string = '';

  @state()
  private severityOptions: DropdownOption[] = [];

  @state()
  private bugFieldsLoading: boolean = false;

  @state()
  private isTitleValid: boolean = true;

  @state()
  private isSubmitting: boolean = false;

  @state()
  private submitError: string = '';

  @state()
  private submitWorkItemId: number | null = null;

  @state()
  private submitWorkItemUrl: string = '';

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
    await chrome.storage.local.set({
      [STORAGE_KEY]: { orgUrl: this.orgUrl, pat: this.pat },
    });
  }

  private handleParentSearch(e: CustomEvent) {
    const query = (e.detail as string).trim();
    if (this.parentSearchDebounce) clearTimeout(this.parentSearchDebounce);
    if (!query) {
      this.parentOptions = [];
      return;
    }
    this.parentSearchDebounce = setTimeout(
      () => this.fetchParentItems(query),
      300
    );
  }

  private async fetchParentItems(query: string) {
    if (!this.selectedProjectId) return;
    const projectIdAtStart = this.selectedProjectId;
    this.parentLoading = true;
    try {
      const escapedQuery = query.replace(/'/g, "''");
      const numericId = /^\d+$/.test(query.trim())
        ? parseInt(query.trim(), 10)
        : null;
      const condition =
        numericId !== null
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
      const ids: number[] =
        (wiqlData.workItems as { id: number }[])?.map((w) => w.id) ?? [];
      if (ids.length === 0) {
        if (this.selectedProjectId === projectIdAtStart)
          this.parentOptions = [];
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
      ).map((item) => ({
        id: String(item.id),
        name: item.fields['System.Title'],
        meta: item.fields['System.WorkItemType'],
        subtitle: `#${item.id}`,
      }));
    } catch {
      if (this.selectedProjectId === projectIdAtStart) this.parentOptions = [];
    } finally {
      if (this.selectedProjectId === projectIdAtStart)
        this.parentLoading = false;
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
      this.projects = (data.value as { id: string; name: string }[]).map(
        (p) => ({
          id: p.id,
          name: p.name,
        })
      );
    } catch {
      this.projectsError =
        'Could not load projects. Try reconnecting in Settings.';
    } finally {
      this.projectsLoading = false;
    }
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('systemInfo') && this.systemInfo) {
      const s = this.systemInfo;
      this.bugSystemInfo = [
        `Date and time: ${s.dateAndTime}`,
        `URL: ${s.url}`,
        ``,
        `Display`,
        `Visible area: ${s.visibleArea}`,
        `Display resolution: ${s.displayResolution}`,
        `Device pixel ratio: ${s.devicePixelRatio}`,
        ``,
        `System`,
        `Browser: ${s.browser}`,
        `Operating system: ${s.os}`,
      ].join('\n');
    }
  }

  private async handleSubmit() {
    if (this.isSubmitting) return;

    this.isTitleValid = this.bugTitle.trim().length > 0;
    if (!this.isTitleValid) return;

    this.isSubmitting = true;
    this.submitError = '';
    this.submitWorkItemId = null;

    try {
      const toHtml = (text: string) =>
        text
          .trim()
          .replace(/\n/g, '<br>')
          .replace(
            /(https?:\/\/[^\s<>"]+)/g,
            '<a href="$1">$1</a>'
          );

      // Upload annotated screenshot as attachment
      let screenshotUrl = '';
      if (this.annotatedScreenshot) {
        try {
          const base64 = this.annotatedScreenshot.split(',')[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: 'image/png' });
          const attachResponse = await fetch(
            `${this.orgUrl}/${this.selectedProjectId}/_apis/wit/attachments?fileName=annotated-screenshot.png&api-version=7.1`,
            {
              method: 'POST',
              headers: {
                Authorization: `Basic ${btoa(`:${this.pat}`)}`,
                'Content-Type': 'application/octet-stream',
              },
              body: blob,
            }
          );
          if (attachResponse.ok) {
            const attachData = await attachResponse.json();
            screenshotUrl = attachData.url as string;
          }
        } catch {
          // silently skip — screenshot upload failure won't block the work item
        }
      }

      const patches: { op: string; path: string; value: unknown }[] = [
        {
          op: 'add',
          path: '/fields/System.Title',
          value: this.bugTitle.trim(),
        },
      ];

      const hasReproText = this.bugReproSteps.trim().length > 0;
      if (hasReproText || screenshotUrl) {
        let reproHtml = hasReproText ? toHtml(this.bugReproSteps) : '';
        if (screenshotUrl) {
          reproHtml += (reproHtml ? '<br><br>' : '') +
            `<img src="${screenshotUrl}" alt="Annotated screenshot" />`;
        }
        patches.push({
          op: 'add',
          path: '/fields/Microsoft.VSTS.TCM.ReproSteps',
          value: reproHtml,
        });
      }

      if (this.bugSystemInfo.trim()) {
        patches.push({
          op: 'add',
          path: '/fields/Microsoft.VSTS.TCM.SystemInfo',
          value: toHtml(this.bugSystemInfo),
        });
      }
      if (this.bugSeverity) {
        patches.push({
          op: 'add',
          path: '/fields/Microsoft.VSTS.Common.Severity',
          value: this.bugSeverity,
        });
      }
      if (this.selectedParentId) {
        patches.push({
          op: 'add',
          path: '/relations/-',
          value: {
            rel: 'System.LinkTypes.Hierarchy-Reverse',
            url: `${this.orgUrl}/_apis/wit/workitems/${this.selectedParentId}`,
          },
        });
      }

      const response = await fetch(
        `${this.orgUrl}/${this.selectedProjectId}/_apis/wit/workitems/$Bug?api-version=7.1`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${btoa(`:${this.pat}`)}`,
            'Content-Type': 'application/json-patch+json',
            Accept: 'application/json',
          },
          body: JSON.stringify(patches),
        }
      );

      if (response.status === 401 || response.status === 403) {
        this.submitError =
          'Authentication failed. Your token may have expired. Go to Settings to update it.';
        return;
      }
      if (!response.ok) {
        this.submitError =
          'Azure DevOps returned an error. Please try again later.';
        return;
      }

      const data = await response.json();
      this.submitWorkItemId = data.id as number;
      this.submitWorkItemUrl =
        (data._links?.html?.href as string) ??
        `${this.orgUrl}/${this.selectedProjectId}/_workitems/edit/${this.submitWorkItemId}`;
    } catch {
      this.submitError =
        'Could not connect. Please check your connection and try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

  private async fetchBugFields() {
    if (!this.selectedProjectId) return;
    this.bugFieldsLoading = true;
    try {
      const response = await fetch(
        `${this.orgUrl}/${this.selectedProjectId}/_apis/wit/workitemtypes/Bug/fields?$expand=allowedValues&api-version=7.1`,
        {
          headers: {
            Authorization: `Basic ${btoa(`:${this.pat}`)}`,
            Accept: 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error();
      const data = await response.json();
      const fields = data.value as {
        referenceName: string;
        allowedValues: string[];
      }[];
      const severityField = fields.find(
        (f) => f.referenceName === 'Microsoft.VSTS.Common.Severity'
      );
      this.severityOptions = (severityField?.allowedValues ?? []).map((v) => ({
        id: v,
        name: v,
      }));
    } catch {
      // silently fail — dropdowns stay empty
    } finally {
      this.bugFieldsLoading = false;
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
      this.submitWorkItemId = null;
      this.submitWorkItemUrl = '';
      this.submitError = '';
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
      this.projects = (data.value as { id: string; name: string }[]).map(
        (p) => ({
          id: p.id,
          name: p.name,
        })
      );
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
              ${!this.submitWorkItemId
                ? html`<hb-searchable-dropdown
                      label="Project"
                      isRequired
                      placeholder="Select project…"
                      .options=${this.projects}
                      .loading=${this.projectsLoading}
                      .value=${this.selectedProjectId}
                      @change=${(e: CustomEvent) => {
                        this.selectedProjectId = (
                          e.detail as DropdownOption
                        ).id;
                        this.selectedParentId = '';
                        this.parentOptions = [];
                        this.bugTitle = '';
                        this.bugReproSteps = '';
                        this.bugSeverity = '';
                        this.severityOptions = [];
                        this.isTitleValid = true;
                        this.submitError = '';
                        this.submitWorkItemId = null;
                        this.fetchBugFields();
                      }}
                    ></hb-searchable-dropdown>
                    ${this.projectsError
                      ? html`
                          <div class="error-message">
                            <img src="../images/cancel-red.svg" alt="error" />
                            <p>${this.projectsError}</p>
                          </div>
                        `
                      : ''} `
                : ''}
              ${this.selectedProjectId
                ? keyed(
                    this.selectedProjectId,
                    this.submitWorkItemId
                      ? html`
                          <div class="success-screen">
                            <img
                              src="../images/check-green.svg"
                              alt="success"
                              class="success-screen-icon"
                            />
                            <p class="success-screen-message">
                              Bug successfully submitted.
                            </p>
                            <div class="success-screen-link-row">
                              <a
                                href=${this.submitWorkItemUrl}
                                target="_blank"
                                class="success-screen-link"
                              >
                                View in Azure DevOps
                              </a>
                              <img
                                src="../images/external-link-black.svg"
                                alt=""
                                width="16"
                                height="16"
                              />
                            </div>
                          </div>
                        `
                      : html`
                          <hb-searchable-dropdown
                            label="Parent work item"
                            placeholder="Search by title or id..."
                            ?asyncSearch=${true}
                            ?clearable=${true}
                            .options=${this.parentOptions}
                            .loading=${this.parentLoading}
                            .value=${this.selectedParentId}
                            @search=${this.handleParentSearch}
                            @change=${(e: CustomEvent) => {
                              this.selectedParentId =
                                (e.detail as DropdownOption | null)?.id ?? '';
                            }}
                          ></hb-searchable-dropdown>
                          <hb-form-input
                            label="Title"
                            isRequired
                            ?invalid=${!this.isTitleValid}
                          >
                            <input
                              type="text"
                              placeholder="Short description of the bug"
                              .value=${this.bugTitle}
                              @input=${(e: InputEvent) => {
                                this.bugTitle = (
                                  e.target as HTMLInputElement
                                ).value;
                                if (!this.isTitleValid && this.bugTitle.trim())
                                  this.isTitleValid = true;
                              }}
                            />
                          </hb-form-input>
                          <hb-form-input
                            label="Repro steps"
                            .additionalInfo=${'The annotated screenshot will be appended automatically.'}
                          >
                            <textarea
                              placeholder="Steps to reproduce…"
                              .value=${this.bugReproSteps}
                              @input=${(e: InputEvent) => {
                                this.bugReproSteps = (
                                  e.target as HTMLTextAreaElement
                                ).value;
                              }}
                            ></textarea>
                          </hb-form-input>
                          <hb-form-input label="System info">
                            <textarea
                              placeholder="OS, browser, version…"
                              .value=${this.bugSystemInfo}
                              @input=${(e: InputEvent) => {
                                this.bugSystemInfo = (
                                  e.target as HTMLTextAreaElement
                                ).value;
                              }}
                            ></textarea>
                          </hb-form-input>
                          <hb-searchable-dropdown
                            label="Severity"
                            placeholder="Select severity…"
                            .options=${this.severityOptions}
                            .loading=${this.bugFieldsLoading}
                            .value=${this.bugSeverity}
                            @change=${(e: CustomEvent) => {
                              this.bugSeverity =
                                (e.detail as DropdownOption | null)?.id ?? '';
                            }}
                          ></hb-searchable-dropdown>
                          <button
                            class="action-button primary loading"
                            @click=${this.handleSubmit}
                            ?disabled=${this.isSubmitting}
                          >
                            ${this.isSubmitting
                              ? html`<span class="spinner"></span>`
                              : ''}
                            Submit bug
                          </button>
                          ${this.submitError
                            ? html`
                                <div class="error-message">
                                  <img
                                    src="../images/cancel-red.svg"
                                    alt="error"
                                  />
                                  <p>
                                    ${this.submitError}
                                    ${this.submitError.includes('Settings')
                                      ? html`<button
                                          class="link-button"
                                          @click=${() =>
                                            (this.view = 'settings')}
                                        >
                                          Settings
                                        </button>`
                                      : ''}
                                  </p>
                                </div>
                              `
                            : ''}
                        `
                  )
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
