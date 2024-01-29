import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../context-menu/ww-geom-context-menu';
import { InteractionMode } from '/data/CanvasManager/InteractionManager';

/**
 *
 */
@customElement('ww-geom-toolbar')
export class WwGeomToolbar extends LitElement {
  @property({ attribute: false })
  mode: InteractionMode = 'select';

  render() {
    return html`<div class="wrapper">
      <sl-button-group label="Mode">
        <sl-button
          @click=${this.handleModeChange.bind(this, 'select')}
          variant=${this.mode === 'select' ? 'primary' : 'default'}
          >Select</sl-button
        >
        <sl-button
          @click=${this.handleModeChange.bind(this, 'create')}
          variant=${this.mode === 'create' ? 'primary' : 'default'}
          >Create</sl-button
        >
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
