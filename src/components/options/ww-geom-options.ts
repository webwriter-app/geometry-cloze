import { LitElementWw } from '@webwriter/lit';
import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import SlCheckbox from '@shoelace-style/shoelace/dist/components/checkbox/checkbox.component.js';
import SlTooltip from '@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js';
import SlTag from '@shoelace-style/shoelace/dist/components/tag/tag.component.js';
import SlIcon from '@shoelace-style/shoelace/dist/components/icon/icon.component.js';
import SlRange from '@shoelace-style/shoelace/dist/components/range/range.component.js';
import InfoSVG from '../icons/info.svg';
import CanvasManager from '../../data/CanvasManager/CanvasManager';

import '@shoelace-style/shoelace/dist/themes/light.css';
import { SlInputEvent } from '@shoelace-style/shoelace';

/**
 * A widget to create and view geometry exercises.
 */
@customElement('ww-geometry-options')
export class WwGeometryOptions extends LitElementWw {
  @state()
  manager: CanvasManager | null = null;
  @query('sl-range') sizeRange!: SlRange;

  render() {
    return html`<div class="options">
      <h4>Teacher Options</h4>
      <sl-checkbox
        .checked=${this.manager?.showGrid ?? false}
        @sl-change=${() => this.manager?.toggleGrid()}>
        Show grid
      </sl-checkbox>
      <sl-checkbox
        .checked=${this.manager?.snapping ?? false}
        @sl-change=${() => this.manager?.toggleSnapping()}>
        Snap to grid
        <sl-tooltip placement="right">
          <sl-icon src=${InfoSVG}></sl-icon>
          <span slot="content">
            You can also temporarily disable snapping by pressing
            <sl-tag size="small">Alt</sl-tag> while dragging an element
          </span>
        </sl-tooltip>
      </sl-checkbox>
      <sl-checkbox
        .checked=${this.manager?.abstractRightAngle ?? false}
        @sl-change=${() => {
          if (this.manager)
            this.manager.abstractRightAngle = !this.manager.abstractRightAngle;
        }}>
        Abstract right angle
        <sl-tooltip placement="right">
          <sl-icon src=${InfoSVG}></sl-icon>
          <span slot="content">
            When enabled, right angles will be drawn as a small square
          </span>
        </sl-tooltip>
      </sl-checkbox>
      <sl-range
        min="0"
        max="10"
        step="1"
        label="Scale"
        help-text="Scales all label of lengths and sizes."
        value="5"
        @sl-input=${(e: SlInputEvent) => {
          const value = (e.target as SlRange)?.value ?? 5;
          const scale = this.convertRange(value);
          this.manager?.setScale(scale);
        }}></sl-range>
    </div>`;
  }

  public firstUpdated() {
    if (this.sizeRange)
      this.sizeRange.tooltipFormatter = (value) =>
        this.convertRange(value).toString();
  }

  private convertRange(input: number): number {
    const map = new Map([
      [0, 0.01],
      [1, 0.1],
      [2, 0.125],
      [3, 0.25],
      [4, 0.75],
      [5, 1],
      [6, 1.5],
      [7, 2],
      [8, 3],
      [9, 5],
      [10, 10]
    ]);
    return map.get(Math.min(Math.max(input, 0), 10)) ?? 1;
  }

  public static get scopedElements() {
    return {
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
    .options > *:not(h4) {
      padding-left: 1rem;
    }
    .options h4 {
      user-select: none;
      margin: 0;
    }
    sl-range {
      box-sizing: border-box;
      max-width: 80%;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geometry-options': WwGeometryOptions;
  }
}
