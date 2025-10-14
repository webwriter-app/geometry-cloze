import { LitElementWw } from '@webwriter/lit';
import { css, html, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { localized, msg } from '@lit/localize';

import '@shoelace-style/shoelace/dist/themes/light.css';

import SlButton from '@shoelace-style/shoelace/dist/components/button/button.component.js';
import SlTooltip from '@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js';
import SlButtonGroup from '@shoelace-style/shoelace/dist/components/button-group/button-group.component.js';

import CursorIcon from '../icons/cursor';
import PolygonIcon from '../icons/polygon';
import DividerLineIcon from '../icons/divider-line';
import TrashIcon from '../icons/trash';
import CanvasManager, {
  CanvasData
} from '../../data/CanvasManager/CanvasManager';
import Draggable from '../../data/elements/base/Draggable';

@localized()
@customElement('ww-geom-toolbar')
export class WwGeomToolbar extends LitElementWw {
  @property({ type: Object })
  accessor manager!: CanvasManager;

  @state()
  private accessor mode: InteractionMode = 'select';
  private modeChangeListener = (newMode: InteractionMode) =>
    (this.mode = newMode);

  @state()
  private accessor selection: Draggable[] = [];
  private selectionChangeListener = (newSelection: Draggable[]) =>
    (this.selection = newSelection);

  render() {
    return html`${this.ModeSelector()}
      <div class="spacer"></div>
      ${this.DeleteButton()}`;
  }

  private ModeSelector() {
    return html`<sl-button-group>
      ${this.ModeButton(
        'select',
        CursorIcon,
        html`${msg('Select and move objects')} <kbd>S</kbd>`
      )}
      ${this.ModeButton(
        'create',
        PolygonIcon,
        html`${msg('Create and connect objects')} <kbd>C</kbd>`
      )}
      ${this.ModeButton(
        'divider',
        DividerLineIcon,
        html`${msg('Create divider lines')} <kbd>D</kbd>`
      )}
    </sl-button-group>`;
  }

  private ModeButton(
    mode: InteractionMode,
    icon: TemplateResult,
    tooltip: TemplateResult
  ) {
    return html`<sl-tooltip placement="bottom">
      <span slot="content">${tooltip}</span>
      <sl-button
        size="small"
        variant=${this.mode === mode ? 'primary' : 'default'}
        @click=${() => (this.manager.mode = mode)}>
        ${icon}
      </sl-button>
    </sl-tooltip>`;
  }

  private DeleteButton() {
    return html`<sl-tooltip placement="bottom">
      <span slot="content">
        ${msg('Delete selected objects')} <kbd>⟵</kbd> / <kbd>Del</kbd>
      </span>
      <sl-button
        size="small"
        ?disabled=${this.selection.length === 0}
        @click=${() => {
          this.selection.forEach((element) => element.delete());
          this.selection = [];
        }}>
        ${TrashIcon}
      </sl-button>
    </sl-tooltip>`;
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this.manager) {
      // TODO: Also add event listener on update of manager property
      this.manager.addModeChangeListener(this.modeChangeListener);
      this.manager.addSelectionChangeListener(this.selectionChangeListener);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.manager) {
      this.manager.removeModeChangeListener(this.modeChangeListener);
      this.manager.removeSelectionChangeListener(this.selectionChangeListener);
    }
  }

  static styles = css`
    :host {
      display: block;
      display: flex;
      padding: var(--sl-spacing-x-small);
      gap: var(--sl-spacing-x-small);
    }

    .spacer {
      flex-grow: 1;
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

    /* Inspired by the <kbd> styling on shoelace.style */
    kbd {
      display: inline-block;
      background: var(--sl-color-neutral-600);
      border: solid 1px var(--sl-color-neutral-500);
      box-shadow:
        inset 0 1px 0 0 var(--sl-color-neutral-700),
        inset 0 -1px 0 0 var(--sl-color-neutral-500);
      font-family: var(--sl-font-mono);
      font-size: 0.9125em;
      border-radius: var(--sl-border-radius-small);
      color: var(--sl-color-neutral-100);
      padding: 0.125em 0.4em;
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
