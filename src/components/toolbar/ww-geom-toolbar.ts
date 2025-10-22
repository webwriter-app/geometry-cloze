import { LitElementWw } from '@webwriter/lit';
import { css, html, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { localized, msg, str } from '@lit/localize';

import '@shoelace-style/shoelace/dist/themes/light.css';

import SlButton from '@shoelace-style/shoelace/dist/components/button/button.component.js';
import SlTooltip from '@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js';
import SlButtonGroup from '@shoelace-style/shoelace/dist/components/button-group/button-group.component.js';
import SlDropdown from '@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js';
import SlMenu from '@shoelace-style/shoelace/dist/components/menu/menu.component.js';
import SlMenuLabel from '@shoelace-style/shoelace/dist/components/menu-label/menu-label.component.js';
import SlDivider from '@shoelace-style/shoelace/dist/components/divider/divider.component.js';
import SlRange from '@shoelace-style/shoelace/dist/components/range/range.component.js';
import SlCheckbox from '@shoelace-style/shoelace/dist/components/checkbox/checkbox.component.js';

import CursorIcon from '../icons/cursor';
import PolygonIcon from '../icons/polygon';
import DividerLineIcon from '../icons/divider-line';
import TrashIcon from '../icons/trash';
import CanvasManager from '../../data/CanvasManager/CanvasManager';
import Draggable from '../../data/elements/base/Draggable';
import WwColorPicker from './ww-color-picker';
import Shape from '../../data/elements/Shape';
import Line from '../../data/elements/Line';
import Stylable, { DEFAULT_STYLE } from '../../data/elements/base/Stylable';
import Point, { DEFAULT_POINT_STYLE } from '../../data/elements/Point';
import WwLetterPicker from './ww-letter-picker';
import TypeIcon from '../icons/type';
import RulerIcon from '../icons/ruler';
import AngleIcon from '../icons/angle';
import WwKbd from '../ui/ww-kbd';

@localized()
export class WwGeomToolbar extends LitElementWw {
  @property({ type: Object })
  accessor manager: CanvasManager | null = null;

  @state()
  private accessor mode: InteractionMode = 'select';
  private modeEventListener = (event: Event) =>
    (this.mode = (event as CustomEvent<InteractionMode>).detail);

  @state()
  private accessor selection: Draggable[] = [];
  private selectionEventListener = (event: Event) =>
    (this.selection = (event as CustomEvent<Draggable[]>).detail);

  render() {
    return html`
      ${this.ModeButtonGroup()}
      <div class="spacer"></div>
      ${this.LabelMenu()} ${this.StyleButtonGroup()} ${this.DeleteButton()}
    `;
  }

  private ModeButtonGroup() {
    return html`
      <sl-button-group>
        ${this.ModeButton(
          'select',
          CursorIcon,
          html`${msg('Select and move objects')} <ww-kbd>S</ww-kbd>`
        )}
        ${this.ModeButton(
          'create',
          PolygonIcon,
          html`${msg('Create and connect objects')} <ww-kbd>C</ww-kbd>`
        )}
        ${this.ModeButton(
          'divider',
          DividerLineIcon,
          html`${msg('Create divider lines')} <ww-kbd>D</ww-kbd>`
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
          @click=${() => {
            if (this.manager) this.manager.mode = mode;
          }}>
          ${icon}
        </sl-button>
      </sl-tooltip>
    `;
  }

  private LabelMenu() {
    const color = this.selection[0]?.labelColor ?? DEFAULT_STYLE.labelColor;

    return html`
      <sl-dropdown>
        <sl-button
          slot="trigger"
          size="small"
          caret
          ?disabled=${this.selection.length === 0 || this.mode !== 'select'}>
          <div style="color: ${color}; display: contents;">${TypeIcon}</div>
        </sl-button>
        <sl-menu>
          ${this.CurrentLabelMenu()}
          <sl-divider></sl-divider>
          <sl-menu-label>${msg('Label color')}</sl-menu-label>
          <ww-color-picker
            .value=${color}
            @input=${(e: CustomEvent) => {
              this.selection.forEach((element) =>
                element.setLabelColor(e.detail)
              );
              this.manager?.requestRedraw();
              this.requestUpdate();
            }}></ww-color-picker>
        </sl-menu>
      </sl-dropdown>
    `;
  }

  private CurrentLabelMenu() {
    if (this.selection.length > 1) {
      return html`<sl-menu-label>
        ${msg(str`${this.selection.length} objects selected`)}
      </sl-menu-label>`;
    }

    const element = this.selection[0];
    if (element instanceof Shape) {
      return this.ShapeLabelMenu(element);
    } else if (element instanceof Line) {
      return this.LineLabelMenu(element);
    } else if (element instanceof Point) {
      return this.PointLabelMenu(element);
    } else {
      return html`<sl-menu-label>Unimplemented</sl-menu-label>`;
    }
  }

  private ShapeLabelMenu(shape: Shape) {
    const labelChanged = () => {
      shape.shouldShowLabel(shape.showArea || shape.showPerimeter);
      this.manager?.requestRedraw();
      this.requestUpdate();
    };

    return html`
      <sl-menu-label>${msg('Shape label')}</sl-menu-label>
      <div class="menu-padding">
        <sl-checkbox
          size="small"
          ?checked=${shape.showArea}
          @sl-change=${(e: CustomEvent) => {
            shape.showArea = (e.target as SlCheckbox).checked;
            labelChanged();
          }}>
          ${msg('Show Area')}
        </sl-checkbox>
        <br />
        <sl-checkbox
          size="small"
          ?checked=${shape.showPerimeter}
          @sl-change=${(e: CustomEvent) => {
            shape.showPerimeter = (e.target as SlCheckbox).checked;
            labelChanged();
          }}>
          ${msg('Show Perimeter')}
        </sl-checkbox>
      </div>
    `;
  }

  private LineLabelMenu(line: Line) {
    let labelValue = line.labelName;
    if (!line.showLabel) labelValue = 'none';
    else if (line.labelStyle == 'value') labelValue = 'special';

    return html`
      <sl-menu-label>${msg('Line label')}</sl-menu-label>
      <ww-letter-picker
        .value=${labelValue}
        alphabet="latin-lowercase"
        special=${msg('Length')}
        @input=${(e: CustomEvent) => {
          if (e.detail === 'none') {
            line.shouldShowLabel(false);
          } else {
            line.shouldShowLabel(true);
            if (e.detail === 'special') {
              line.setLabelStyle('value');
            } else {
              line.setLabelStyle('name');
              line.setLabelName(e.detail);
            }
          }
          this.requestUpdate();
        }}>
        ${RulerIcon}
      </ww-letter-picker>
    `;
  }

  private PointLabelMenu(point: Point) {
    let labelValue = point.labelName;
    if (!point.showLabel) labelValue = 'none';
    else if (point.labelStyle == 'value') labelValue = 'special';

    return html`
      <sl-checkbox
        class="menu-padding"
        size="small"
        ?checked=${point.showOutsideAngle}
        @sl-change=${(e: CustomEvent) => {
          point.showOutsideAngle = (e.target as SlCheckbox).checked;
          point.shouldShowLabel(point.showLabel);
          this.manager?.requestRedraw();
          this.requestUpdate();
        }}>
        Flip angle
      </sl-checkbox>
      <ww-letter-picker
        .value=${labelValue}
        alphabet="greek-lowercase"
        special=${msg('Length')}
        @input=${(e: CustomEvent) => {
          if (e.detail === 'none') {
            point.shouldShowLabel(false);
          } else {
            point.shouldShowLabel(true);
            if (e.detail === 'special') {
              point.setLabelStyle('value');
            } else {
              point.setLabelStyle('name');
              point.setLabelName(e.detail);
            }
          }
          this.requestUpdate();
        }}>
        ${AngleIcon}
      </ww-letter-picker>
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
        <sl-button
          slot="trigger"
          size="small"
          caret
          .disabled=${!pointElement || this.mode !== 'select'}>
          <div class="icon-container">
            <div
              class="icon-point-fill"
              style="background-color: ${color};"></div>
          </div>
        </sl-button>
        <sl-menu>
          <sl-menu-label>${msg('Point color')}</sl-menu-label>
          <ww-color-picker
            .color=${color}
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
    let color = lineElement?.stroke ?? DEFAULT_STYLE.stroke;
    if (color.startsWith('#') && color.length === 9) color = color.slice(0, 7); // Remove alpha channel for display
    const width = lineElement?.lineWidth ?? DEFAULT_STYLE.lineWidth;

    const sliderValue = WwGeomToolbar.LINE_WIDTHS.indexOf(width) ?? 2;

    return html`
      <sl-dropdown>
        <sl-button
          slot="trigger"
          size="small"
          caret
          .disabled=${!lineElement || this.mode !== 'select'}>
          <div class="icon-container">
            <div
              class="icon-line-stroke"
              style="background-color: ${color}; height: ${width}px;"></div>
          </div>
        </sl-button>
        <sl-menu>
          <sl-menu-label>${msg('Line width')}</sl-menu-label>
          <sl-range
            class="menu-padding"
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
            .value=${color}
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
    if (color.startsWith('#') && color.length === 9) color = color.slice(0, 7); // Remove alpha channel for display

    return html`
      <sl-dropdown>
        <sl-button
          slot="trigger"
          size="small"
          caret
          .disabled=${!shapeElement || this.mode !== 'select'}>
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
            .value=${color}
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
          ${msg('Delete selected objects')} <ww-kbd>⟵</ww-kbd> /
          <ww-kbd>Del</ww-kbd>
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
    if (this.manager) this.managerAttached(this.manager);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.manager) this.managerDetached(this.manager);
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has('manager')) {
      const old = changed.get('manager');
      if (old) this.managerDetached(old as CanvasManager);
      if (this.manager) this.managerAttached(this.manager);
    }
  }

  private managerAttached(manager: CanvasManager) {
    manager.addEventListener('modeupdate', this.modeEventListener);
    manager.addEventListener('selectionupdate', this.selectionEventListener);
    this.mode = manager.mode;
  }

  private managerDetached(manager: CanvasManager) {
    manager.removeEventListener('modeupdate', this.modeEventListener);
    manager.removeEventListener('selectionupdate', this.selectionEventListener);
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

    sl-menu-label::part(base),
    .menu-padding {
      padding: 0 calc(2 * var(--sl-spacing-x-small));
    }

    svg,
    .icon-container {
      display: inline-block;
      height: 1.5em;
      width: 1.5em;
    }

    ww-color-picker,
    ww-letter-picker {
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

    sl-checkbox {
      margin-bottom: var(--sl-spacing-2x-small);
    }
  `;

  public static get scopedElements() {
    return {
      'ww-color-picker': WwColorPicker,
      'ww-letter-picker': WwLetterPicker,
      'ww-kbd': WwKbd,
      'sl-button': SlButton,
      'sl-tooltip': SlTooltip,
      'sl-button-group': SlButtonGroup,
      'sl-dropdown': SlDropdown,
      'sl-menu': SlMenu,
      'sl-menu-label': SlMenuLabel,
      'sl-divider': SlDivider,
      'sl-range': SlRange,
      'sl-checkbox': SlCheckbox
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geom-toolbar': WwGeomToolbar;
  }
}
