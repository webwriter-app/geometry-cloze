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
      <sl-button-group label="Mode">
        <sl-tooltip content="Press [S] to switch">
          <sl-button
            @click=${this.handleModeChange.bind(this, 'select')}
            variant=${this.mode === 'select' ? 'primary' : 'default'}>
            Select
          </sl-button>
        </sl-tooltip>

        <sl-tooltip content="Press [C] to switch">
          <sl-button
            @click=${this.handleModeChange.bind(this, 'create')}
            variant=${this.mode === 'create' ? 'primary' : 'default'}>
            Create
          </sl-button>
        </sl-tooltip>
      </sl-button-group>
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
      margin-bottom: 0.5rem;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geom-toolbar': WwGeomToolbar;
  }
}
