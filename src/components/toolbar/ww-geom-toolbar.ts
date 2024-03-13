import { LitElementWw } from '@webwriter/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/themes/light.css';

import SlButton from '@shoelace-style/shoelace/dist/components/button/button.component.js';
import SlTooltip from '@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js';
import SlIcon from '@shoelace-style/shoelace/dist/components/icon/icon.component.js';
import HandIndexThumb from '../icons/hand-index-thumb';
import Pentagon from '../icons/pentagon';
import PentagonHalf from '../icons/pentagon-half';

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
          <div class="iconWrapper">${HandIndexThumb}</div>
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
          <div class="iconWrapper">${Pentagon}</div>
        </sl-button>
      </sl-tooltip>
      <sl-tooltip>
        <span slot="content"> Create divider lines <strong>[D]</strong> </span>
        <sl-button
          size="large"
          circle
          @click=${this.handleModeChange.bind(this, 'divider')}
          variant=${this.mode === 'divider' ? 'primary' : 'default'}>
          <div class="iconWrapper">${PentagonHalf}</div>
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
      user-select: none;
    }
    .iconWrapper {
      height: 100%;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-bottom: 0.3rem;
      box-sizing: border-box;
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
