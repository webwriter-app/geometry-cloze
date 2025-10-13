import { LitElementWw } from '@webwriter/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { localized, msg } from '@lit/localize';

import '@shoelace-style/shoelace/dist/themes/light.css';

import SlButton from '@shoelace-style/shoelace/dist/components/button/button.component.js';
import SlTooltip from '@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js';
import SlButtonGroup from '@shoelace-style/shoelace/dist/components/button-group/button-group.component.js';

import CursorIcon from '../icons/cursor';
import PolygonIcon from '../icons/polygon';
import DividerLineIcon from '../icons/divider-line';

@localized()
@customElement('ww-geom-toolbar')
export class WwGeomToolbar extends LitElementWw {
  @property({ attribute: true })
  accessor mode: InteractionMode = 'select';

  render() {
    return html`${this.ModeSelector()}`;
  }

  private ModeSelector() {
    return html`<sl-button-group>
      <sl-tooltip placement="bottom" hoist>
        <span slot="content"
          >${msg(html`Select and move objects <kbd>S</kbd>`)}</span
        >
        <sl-button
          size="small"
          variant=${this.mode === 'select' ? 'primary' : 'default'}
          @click=${this.handleModeChange.bind(this, 'select')}>
          ${CursorIcon}
        </sl-button>
      </sl-tooltip>
      <sl-tooltip placement="bottom" hoist>
        <span slot="content"
          >${msg(html`Create and connect objects <kbd>C</kbd>`)}</span
        >
        <sl-button
          size="small"
          variant=${this.mode === 'create' ? 'primary' : 'default'}
          @click=${this.handleModeChange.bind(this, 'create')}>
          ${PolygonIcon}
        </sl-button>
      </sl-tooltip>
      <sl-tooltip placement="bottom" hoist>
        <span slot="content"
          >${msg(html`Create divider lines <kbd>D</kbd>`)}</span
        >
        <sl-button
          size="small"
          variant=${this.mode === 'divider' ? 'primary' : 'default'}
          @click=${this.handleModeChange.bind(this, 'divider')}>
          ${DividerLineIcon}
        </sl-button>
      </sl-tooltip>
    </sl-button-group>`;
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
    :host {
      display: block;
      display: flex;
      padding: var(--sl-spacing-x-small);
      gap: var(--sl-spacing-x-small);
    }

    svg {
      display: inline-block;
      height: 1.5em;
      width: 1.5em;
    }

    sl-button {
      &::part(label) {
        display: flex;
        align-items: center;
      }
    }
  `;

  public static get scopedElements() {
    return {
      'sl-button': SlButton,
      'sl-tooltip': SlTooltip,
      'sl-button-group': SlButtonGroup
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geom-toolbar': WwGeomToolbar;
  }
}
