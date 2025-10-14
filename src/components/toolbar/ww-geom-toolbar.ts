import { LitElementWw } from '@webwriter/lit';
import { css, html, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { localized, msg } from '@lit/localize';

import '@shoelace-style/shoelace/dist/themes/light.css';

import SlButton from '@shoelace-style/shoelace/dist/components/button/button.component.js';
import SlTooltip from '@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js';
import SlButtonGroup from '@shoelace-style/shoelace/dist/components/button-group/button-group.component.js';
import SlDropdown from '@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js';
import SlMenu from '@shoelace-style/shoelace/dist/components/menu/menu.component.js';
import SlMenuLabel from '@shoelace-style/shoelace/dist/components/menu-label/menu-label.component.js';
import SlDivider from '@shoelace-style/shoelace/dist/components/divider/divider.component.js';
import SlRange from '@shoelace-style/shoelace/dist/components/range/range.component.js';

import CursorIcon from '../icons/cursor';
import PolygonIcon from '../icons/polygon';
import DividerLineIcon from '../icons/divider-line';
import TrashIcon from '../icons/trash';
import CanvasManager from '../../data/CanvasManager/CanvasManager';
import Draggable from '../../data/elements/base/Draggable';
import WwColorPicker from './ww-color-picker';
import Shape from '../../data/elements/Shape';
import Line from '../../data/elements/Line';
import { DEFAULT_STYLE } from '../../data/elements/base/Stylable';
import Point, { DEFAULT_POINT_STYLE } from '../../data/elements/Point';

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
    return html`
      ${this.ModeButtonGroup()}
      <div class="spacer"></div>
      ${this.StyleButtonGroup()} ${this.DeleteButton()}
    `;
  }

  private ModeButtonGroup() {
    return html`
      <sl-button-group>
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
      </sl-button-group>
    `;
  }

  private ModeButton(
    mode: InteractionMode,
    icon: TemplateResult,
    tooltip: TemplateResult
  ) {
    return html`
      <sl-tooltip placement="bottom">
        <span slot="content">${tooltip}</span>
        <sl-button
          size="small"
          variant=${this.mode === mode ? 'primary' : 'default'}
          @click=${() => (this.manager.mode = mode)}>
          ${icon}
        </sl-button>
      </sl-tooltip>
    `;
  }

  private StyleButtonGroup() {
    return html`
      <sl-button-group>
        ${this.PointFillButton()} ${this.LineStrokeButton()}
        ${this.ShapeFillButton()}
      </sl-button-group>
    `;
  }

  private PointFillButton() {
    const pointElement = this.selection.find((e) => e instanceof Point);
    const color = pointElement?.fill ?? DEFAULT_POINT_STYLE.fill;

    return html`
      <sl-dropdown>
        <sl-button slot="trigger" size="small" caret .disabled=${!pointElement}>
          <div class="icon-container">
            <div
              class="icon-point-fill"
              style="background-color: ${color};"></div>
          </div>
        </sl-button>
        <sl-menu>
          <sl-menu-label>${msg('Point color')}</sl-menu-label>
          <ww-color-picker
            @input=${(e: CustomEvent) => {
              this.selection
                .filter((element) => element instanceof Point)
                .forEach((point) => point.setFill(e.detail));
              this.requestUpdate();
            }}></ww-color-picker>
        </sl-menu>
      </sl-dropdown>
    `;
  }

  private static LINE_WIDTHS = [1, 2, 3, 5, 7];

  private LineStrokeButton() {
    const lineElement = this.selection.find((e) => e instanceof Line);
    const color = lineElement?.stroke ?? DEFAULT_STYLE.stroke;
    const width = lineElement?.lineWidth ?? DEFAULT_STYLE.lineWidth;

    const sliderValue = WwGeomToolbar.LINE_WIDTHS.indexOf(width) ?? 2;

    return html`
      <sl-dropdown>
        <sl-button slot="trigger" size="small" caret .disabled=${!lineElement}>
          <div class="icon-container">
            <div
              class="icon-line-stroke"
              style="background-color: ${color}; height: ${width}px;"></div>
          </div>
        </sl-button>
        <sl-menu>
          <sl-menu-label>${msg('Line width')}</sl-menu-label>
          <sl-range
            min="0"
            max="4"
            tooltip="none"
            value=${sliderValue}
            @input=${(e: InputEvent) => {
              const newValue =
                WwGeomToolbar.LINE_WIDTHS[(e.target as SlRange).value];
              this.selection
                .filter((element) => element instanceof Line)
                .forEach((line) => line.setLineWidth(newValue));
              this.requestUpdate();
            }}>
          </sl-range>
          <sl-divider></sl-divider>
          <sl-menu-label>${msg('Line color')}</sl-menu-label>
          <ww-color-picker
            @input=${(e: CustomEvent) => {
              this.selection
                .filter((element) => element instanceof Line)
                .forEach((line) => line.setStroke(e.detail));
              this.requestUpdate();
            }}></ww-color-picker>
        </sl-menu>
      </sl-dropdown>
    `;
  }

  private ShapeFillButton() {
    const shapeElement = this.selection.find((e) => e instanceof Shape);
    let color = shapeElement?.fill ?? 'transparent';
    if (color.startsWith('#') && color.length === 9) {
      color = color.slice(0, 7); // Remove alpha channel for display
    }

    return html`
      <sl-dropdown>
        <sl-button slot="trigger" size="small" caret .disabled=${!shapeElement}>
          <div class="icon-container">
            ${color === 'transparent'
              ? html`<div
                  class="icon-shape-fill icon-shape-fill__transparent"></div>`
              : html`<div
                  class="icon-shape-fill"
                  style="background-color: ${color};"></div>`}
          </div>
        </sl-button>
        <sl-menu>
          <sl-menu-label>${msg('Fill color')}</sl-menu-label>
          <ww-color-picker
            include-transparent
            @input=${(e: CustomEvent) => {
              const color =
                e.detail === 'transparent' ? 'transparent' : e.detail + '50';
              this.selection
                .filter((element) => element instanceof Shape)
                .forEach((shape) => shape.setFill(color));
              this.requestUpdate();
            }}></ww-color-picker>
        </sl-menu>
      </sl-dropdown>
    `;
  }

  private DeleteButton() {
    return html`
      <sl-tooltip placement="bottom">
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
      </sl-tooltip>
    `;
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

    sl-menu-label::part(base),
    sl-range {
      padding: 0 calc(2 * var(--sl-spacing-x-small));
    }

    svg,
    .icon-container {
      display: inline-block;
      height: 1.5em;
      width: 1.5em;
    }

    ww-color-picker {
      padding: 0 var(--sl-spacing-x-small);
    }

    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-point-fill {
      width: 50%;
      height: 50%;
      border-radius: var(--sl-border-radius-circle);
      background-color: var(--sl-color-primary-600);
    }

    .icon-line-stroke {
      width: 100%;
      height: 2px;
      background-color: var(--sl-color-primary-600);
      border-radius: var(--sl-border-radius-pill);
    }

    .icon-shape-fill {
      width: 100%;
      height: 100%;
      border-radius: var(--sl-border-radius-medium);
    }

    .icon-shape-fill__transparent {
      background: repeating-conic-gradient(
          var(--sl-color-neutral-300) 0 25%,
          transparent 0 50%
        )
        0 0 / 10px 10px;
      background-position: center;
    }
  `;

  public static get scopedElements() {
    return {
      'ww-color-picker': WwColorPicker,
      'sl-button': SlButton,
      'sl-tooltip': SlTooltip,
      'sl-button-group': SlButtonGroup,
      'sl-dropdown': SlDropdown,
      'sl-menu': SlMenu,
      'sl-menu-label': SlMenuLabel,
      'sl-divider': SlDivider,
      'sl-range': SlRange
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geom-toolbar': WwGeomToolbar;
  }
}
