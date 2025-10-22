import { LitElementWw } from '@webwriter/lit';
import { css, html, PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { localized, msg } from '@lit/localize';
import SlCheckbox from '@shoelace-style/shoelace/dist/components/checkbox/checkbox.component.js';
import SlTooltip from '@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js';
import SlTag from '@shoelace-style/shoelace/dist/components/tag/tag.component.js';
import SlIcon from '@shoelace-style/shoelace/dist/components/icon/icon.component.js';
import SlRange from '@shoelace-style/shoelace/dist/components/range/range.component.js';
import InfoSVG from '../icons/info.svg';
import CanvasManager from '../../data/CanvasManager/CanvasManager';
import WwKbd from '../ui/ww-kbd';

import '@shoelace-style/shoelace/dist/themes/light.css';
import { SlInputEvent } from '@shoelace-style/shoelace';

/**
 * A widget to create and view geometry exercises.
 */
@localized()
export class WwGeomOptions extends LitElementWw {
  private static SCALE_VALUES = [
    0.01, 0.1, 0.125, 0.25, 0.75, 1, 1.5, 2, 3, 5, 10
  ];

  @state()
  accessor manager: CanvasManager | null = null;

  render() {
    let scaleValue = WwGeomOptions.SCALE_VALUES.findIndex(
      (s) => s === this.manager?.scaleFactor
    );
    if (scaleValue === -1) scaleValue = 5; // Default to 1:1

    return html`<div class="options">
      <sl-checkbox
        .checked=${this.manager?.showGrid ?? false}
        @sl-change=${() => this.manager?.toggleGrid()}>
        ${msg('Show grid')}
      </sl-checkbox>
      <sl-checkbox
        .checked=${this.manager?.snapping ?? false}
        @sl-change=${() => this.manager?.toggleSnapping()}>
        <div class="checkbox-info-container">
          ${msg('Snap to grid')}
          <sl-tooltip placement="left" hoist>
            <sl-icon src=${InfoSVG}></sl-icon>
            <span slot="content">
              ${msg(
                html`You can also temporarily disable snapping by pressing
                  <ww-kbd>Alt</ww-kbd> while dragging an element`
              )}
            </span>
          </sl-tooltip>
        </div>
      </sl-checkbox>
      <sl-checkbox
        .checked=${this.manager?.abstractRightAngle ?? false}
        @sl-change=${() => {
          if (this.manager)
            this.manager.abstractRightAngle = !this.manager.abstractRightAngle;
        }}>
        <div class="checkbox-info-container">
          ${msg('Abstract right angle')}
          <sl-tooltip placement="left" hoist>
            <sl-icon src=${InfoSVG}></sl-icon>
            <span slot="content">
              ${msg(
                'When enabled, right angles will be drawn as a small square'
              )}
            </span>
          </sl-tooltip>
        </div>
      </sl-checkbox>
      <sl-range
        min="0"
        max=${WwGeomOptions.SCALE_VALUES.length - 1}
        step="1"
        .value=${scaleValue}
        label=${msg('Scale')}
        help-text=${msg('Scales all labels of lengths and sizes.')}
        .tooltipFormatter=${(value: number) => {
          const scale = WwGeomOptions.SCALE_VALUES[value];
          return `${scale * 100} %`;
        }}
        @sl-input=${(e: SlInputEvent) => {
          const value = Math.min(
            Math.max((e.target as SlRange)?.value, 0),
            WwGeomOptions.SCALE_VALUES.length - 1
          );
          const scale = WwGeomOptions.SCALE_VALUES[value];
          this.manager?.setScale(scale);
        }}></sl-range>
    </div>`;
  }

  private updateWidget = () => this.requestUpdate();

  connectedCallback() {
    super.connectedCallback();
    this.manager?.addEventListener('dataupdate', this.updateWidget);
  }

  protected updated(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('manager')) {
      const old = _changedProperties.get('manager');
      if (old) old.removeEventListener('dataupdate', this.updateWidget);
      this.manager?.addEventListener('dataupdate', this.updateWidget);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.manager?.removeEventListener('dataupdate', this.updateWidget);
  }

  public static get scopedElements() {
    return {
      'ww-kbd': WwKbd,
      'sl-checkbox': SlCheckbox,
      'sl-tooltip': SlTooltip,
      'sl-icon': SlIcon,
      'sl-tag': SlTag,
      'sl-range': SlRange
    };
  }

  static styles = css`
    .options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .checkbox-info-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geom-options': WwGeomOptions;
  }
}
