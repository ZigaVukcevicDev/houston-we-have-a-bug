import { LitElement, html, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import styles from './styles/app.scss';
import './components/hb-popup/hb-popup';

@customElement('houston-we-have-a-bug')
export class HoustonWeHaveABug extends LitElement {
  static styles = unsafeCSS(styles);

  render() {
    return html`<hb-popup></hb-popup>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'houston-we-have-a-bug': HoustonWeHaveABug;
  }
}
