import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../context-menu/ww-geom-context-menu';

/**
 *
 */
@customElement('ww-geom-toolbar')
export class WwGeomToolbar extends LitElement {
  @property({ attribute: true })
  mode: InteractionMode = 'select';

  render() {
    return html`<div class="wrapper">
      <sl-tooltip>
        <span slot="content">
          Select and move objects <strong>[S]</strong>
        </span>
        <sl-button
          size="large"
          circle
          @click=${this.handleModeChange.bind(this, 'select')}
          variant=${this.mode === 'select' ? 'primary' : 'default'}>
          <sl-icon name="hand-index-thumb" label="Select"></sl-icon>
        </sl-button>
      </sl-tooltip>

      <sl-tooltip>
        <span slot="content">
          Create and connect objects <strong>[C]</strong>
        </span>
        <sl-button
          size="large"
          circle
          @click=${this.handleModeChange.bind(this, 'create')}
          variant=${this.mode === 'create' ? 'primary' : 'default'}>
          <sl-icon name="pentagon" label="Create"></sl-icon>
        </sl-button>
      </sl-tooltip>
    </div>`;
  }

  handleModeChange(mode: InteractionMode) {
    this.mode = mode;
    this.dispatchEvent(
      new CustomEvent('mode-change', {
        bubbles: true,
        composed: true,
        detail: { mode }
      })
    );
  }

  static styles = css`
    .wrapper {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geom-toolbar': WwGeomToolbar;
  }
}
