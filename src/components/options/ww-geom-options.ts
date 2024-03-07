import { LitElementWw } from '@webwriter/lit';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import SlCheckbox from '@shoelace-style/shoelace/dist/components/checkbox/checkbox.component.js';
import SlTooltip from '@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js';
import SlTag from '@shoelace-style/shoelace/dist/components/tag/tag.component.js';
import SlIcon from '@shoelace-style/shoelace/dist/components/icon/icon.component.js';
import InfoSVG from '../icons/info.svg';
import CanvasManager from '../../data/CanvasManager/CanvasManager';

import '@shoelace-style/shoelace/dist/themes/light.css';

/**
 * A widget to create and view geometry exercises.
 */
@customElement('ww-geometry-options')
export class WwGeometryOptions extends LitElementWw {
  @state()
  manager: CanvasManager | null = null;

  render() {
    return html`<div class="options">
      <h6>Teacher Options</h6>
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
    </div> `;
  }

  public static get scopedElements() {
    return {
      'sl-checkbox': SlCheckbox,
      'sl-tooltip': SlTooltip,
      'sl-icon': SlIcon,
      'sl-tag': SlTag
    };
  }

  static styles = css`
    .options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .options h6 {
      margin: 0;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geometry-options': WwGeometryOptions;
  }
}
