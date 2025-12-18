import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './hb-toolbar-tool.scss';

@customElement('hb-toolbar-tool')
export class HBToolbarTool extends LitElement {
  static styles = unsafeCSS(styles);

  @property({ type: String })
  title: string = '';

  @property({ type: String })
  icon: string = '';

  @property({ type: Boolean })
  isActive: boolean = false;

  render() {
    return html`
      <button 
        class="${this.isActive ? 'activated' : ''}" 
        title=${this.title}
      >
        <img src="../images/${this.icon}-black.svg" alt=${this.icon} class="icon-default" />
        <img src="../images/${this.icon}-white.svg" alt=${this.icon} class="icon-hover-and-activated" />
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-toolbar-tool': HBToolbarTool;
  }
}
