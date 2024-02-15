import { LitElementWw } from '@webwriter/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/themes/light.css';

import SlButton from '@shoelace-style/shoelace/dist/components/button/button.component.js';
import SlTooltip from '@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js';
import SlIcon from '@shoelace-style/shoelace/dist/components/icon/icon.component.js';

/**
 *
 */
@customElement('ww-geom-toolbar')
export class WwGeomToolbar extends LitElementWw {
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

  public static get scopedElements() {
    return {
      'sl-button': SlButton,
      'sl-tooltip': SlTooltip,
      'sl-icon': SlIcon
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geom-toolbar': WwGeomToolbar;
  }
}
