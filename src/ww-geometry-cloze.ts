// @ts-ignore
import LOCALIZE from '../localization/generated/index.js';
import '@webcomponents/scoped-custom-element-registry';
import { LitElementWw } from '@webwriter/lit';
import { PropertyValueMap, css, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { localized } from '@lit/localize';
import { WwGeomToolbar } from './components/toolbar/ww-geom-toolbar';
import Shape from './data/elements/Shape';
import CanvasManager, { CanvasData } from './data/CanvasManager/CanvasManager';
import Objects from './data/helper/Objects';
import { LitElement } from 'lit';

import '@shoelace-style/shoelace/dist/themes/light.css';
import { WwGeomOptions } from './components/options/ww-geom-options';

/**
 * Geometry cloze widget that renders the interactive canvas and manages localization/state wiring.
 */
@localized()
@customElement('ww-geometry-cloze')
export class WwGeometryCloze extends LitElementWw {
  @query('canvas') private accessor canvas!: HTMLCanvasElement;

  private manager: CanvasManager | null = null;

  protected localize = LOCALIZE;

  /**
   * Serialized children describing the current canvas content provided by the host.
   */
  @property({
    attribute: true,
    reflect: true,
    type: Array
  })
  accessor elements: CanvasData['children'];

  /**
   * Active editing mode, accepting three possible values:
   * - 'select': Move and connect objects
   * - 'create': Create and connect objects
   * - 'divider': Create divider lines
   */
  @property({
    attribute: true,
    reflect: true,
    type: String
  })
  accessor mode: CanvasData['mode'] = 'select';

  /**
   * Whether right angles will be drawn as small squares instead of arcs.
   */
  @property({
    attribute: true,
    reflect: true,
    type: Boolean
  })
  accessor abstractRightAngle: CanvasData['abstractRightAngle'] = false;

  /**
   * If set, the grid will not be rendered.
   */
  @property({
    attribute: true,
    reflect: true,
    type: Boolean
  })
  accessor hideGrid: CanvasData['showGrid'] = false;

  /**
   * If set, user interactions will not snap to the grid.
   * Does not depend on whether the grid is visible or hidden.
   */
  @property({
    attribute: true,
    reflect: true,
    type: Boolean
  })
  accessor disableSnapping: CanvasData['snapping'] = false;

  render() {
    return html` ${this.isContentEditable
        ? html`<ww-geom-toolbar
            .manager=${this.manager as any}></ww-geom-toolbar>`
        : nothing}
      <canvas tabindex="0"></canvas>
      <ww-geom-options
        part="options"
        .manager=${this.manager as any}></ww-geom-options>`;
  }

  protected updated(
    changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    if (!this.manager) return;
    if (changedProperties.has('elements')) {
      if (!this.manager || !this.elements) return;
      const exportData = this.manager.export();
      if (!Objects.deepEqual(exportData.children, this.elements))
        this.manager.import({
          children: this.elements
        });
    }

    if (changedProperties.has('mode') && this.mode !== this.manager.mode)
      this.manager.mode = this.mode;

    if (
      changedProperties.has('abstractRightAngle') &&
      this.abstractRightAngle !== this.manager.abstractRightAngle
    )
      this.manager.abstractRightAngle = this.abstractRightAngle;

    if (
      changedProperties.has('hideGrid') &&
      this.hideGrid !== !this.manager.showGrid
    )
      this.manager.toggleGrid(!this.hideGrid);

    if (
      changedProperties.has('disableSnapping') &&
      this.disableSnapping !== !this.manager.snapping
    )
      this.manager.toggleSnapping(!this.disableSnapping);
  }

  private onCanvasValueChange: EventListener = (event: Event) => {
    const value = (event as CustomEvent<CanvasData>).detail;
    this.elements = value.children;
    this.mode = value.mode;
    this.abstractRightAngle = value.abstractRightAngle;
    this.hideGrid = !value.showGrid;
    this.disableSnapping = !value.snapping;
  };

  firstUpdated() {
    if (this.canvas) {
      if (this.manager) {
        console.warn('Prevented creating multiple CanvasManager');
        return;
      }
      this.manager = new CanvasManager(
        this.canvas,
        this.renderRoot as HTMLElement
      );
      this.manager.addEventListener('dataupdate', this.onCanvasValueChange);

      if (this.elements) {
        this.manager.import({
          children: this.elements,
          mode: this.mode,
          abstractRightAngle: this.abstractRightAngle,
          showGrid: !this.hideGrid,
          snapping: !this.disableSnapping
        });
      } else {
        const polygon = Shape.createPolygon(this.manager, [
          { x: 200, y: 200, name: 'top left' },
          { x: 500, y: 200, name: 'top right' },
          {
            x: 600,
            y: 300,
            name: 'middle right'
          },
          { x: 500, y: 500, name: 'bottom right' },
          { x: 200, y: 500, name: 'bottom left' }
        ]);

        this.manager.addChild(polygon);
      }
    } else console.warn('No canvas context');
  }

  disconnectedCallback(): void {
    if (this.manager) {
      this.manager.removeEventListener('dataupdate', this.onCanvasValueChange);
      this.manager.unmount();
    }
    super.disconnectedCallback();
  }

  /** @internal */
  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true
  };

  /** @internal */
  public static get scopedElements() {
    return {
      'ww-geom-toolbar': WwGeomToolbar,
      'ww-geom-options': WwGeomOptions
    };
  }

  static styles = css`
    :host {
      position: relative;
      display: block;

      width: 100%;

      color: var(--sl-color-neutral-900);
      background-color: var(--sl-color-neutral-0);

      border: solid 1px var(--sl-color-neutral-300);
      border-radius: var(--sl-border-radius-medium);
      box-sizing: border-box;

      overflow: hidden;
      z-index: 10000000;

      outline: none;
    }
    ww-geom-toolbar {
      border-bottom: solid 1px var(--sl-color-neutral-300);
    }
    canvas {
      display: block;
      width: 100%;
      aspect-ratio: 10 / 7;
      outline: none !important;
    }
    :host(:not([contenteditable='true']):not([contenteditable=''])) canvas {
      pointer-events: none;
    }
    :host(:not([contenteditable='true']):not([contenteditable='']))
      ww-geom-options {
      display: none;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geometry-cloze': WwGeometryCloze;
  }
}
