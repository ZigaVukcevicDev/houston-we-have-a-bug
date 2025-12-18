import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './hb-toolbar.scss';
import '../hb-toolbar-tool/hb-toolbar-tool';

@customElement('hb-toolbar')
export class HBToolbar extends LitElement {
  static styles = unsafeCSS(styles);

  render() {
    return html`
      <div class="toolbar">
        <a href="https://github.com/ZigaVukcevicDev/houston-we-have-a-bug" class="logo" target="_blank" title="GitHub">
          <img src="../images/rocket.svg" alt="rocket" />
        </a>

        <div class="tools">
          <hb-toolbar-tool title="Text" icon="text" .isActive=${false}></hb-toolbar-tool>
          <hb-toolbar-tool title="Line" icon="line" .isActive=${false}></hb-toolbar-tool>
          <hb-toolbar-tool title="Arrow" icon="arrow" .isActive=${true}></hb-toolbar-tool>
          <hb-toolbar-tool title="Rectangle" icon="rectangle" .isActive=${false}></hb-toolbar-tool>
          <hb-toolbar-tool title="Crop" icon="crop" .isActive=${false}></hb-toolbar-tool>
        </div>

        <div class="download">TBD</div>
      </div> 
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-toolbar': HBToolbar;
  }
}
