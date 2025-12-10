import { LitElement, html, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import './components/main-view/main-view';
import styles from './styles/app.scss';

@customElement('houston-we-have-a-bug')
export class HoustonWeHaveABug extends LitElement {
  static styles = unsafeCSS(styles);

  render() {
    return html`<main-view></main-view>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'houston-we-have-a-bug': HoustonWeHaveABug;
  }
}
