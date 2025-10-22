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
 * The geometry cloze widgets allows for the creation and embedding of geometric
 * figures. It provides a 1000 x 700 unit wide canvas which can contain
 * arbitrary polygons, lines and points with custom styling, labels and
 * measurements.
 *
 * If the widget is `contenteditable`, the user can interactively create and
 * edit the shapes on the canvas. Otherwise, the canvas is rendered as a static
 * image.
 */
@localized()
@customElement('ww-geometry-cloze')
export class WwGeometryCloze extends LitElementWw {
  @query('canvas') private accessor canvas!: HTMLCanvasElement;

  private manager: CanvasManager | null = null;

  protected localize = LOCALIZE;

  /**
   * A JSON-serialized list of all the objects that make up the canvas. Each
   * object is either a polygon element or a divider line, described below.
   *
   * ### Elements
   *
   * - Represents a drawable object on the 1000×700 canvas.
   * - Every object must include a `"_type"` field to indicate its type.
   * - Every object must provide a numeric `id` that is unique across the entire
   *   canvas.
   *
   * ### Polygon Object (`"_type": "element"`)
   *
   * - `id` (number): Unique identifier for the shape.
   * - `fill` (string, optional): `'transparent'` or a palette color with a `50`
   *   alpha suffix (for example `"#2563eb50"`).
   * - `labelColor` (string, optional): Palette color applied to any label
   *   rendered for the shape.
   * - `showArea`, `showPerimeter` (boolean, optional): Enable live area and
   *   perimeter labels respectively. When either is `true`, required child
   *   labels are shown automatically.
   * - `children` (array): Mix of point and line definitions describing the
   *   polygon.
   *
   * ### Point Child (`"_type": "point"`)
   *
   * - `id` (number): Unique identifier within the shape.
   * - `x`, `y` (number): Absolute coordinates on the canvas.
   * - `fill` (string, optional): Palette color for the point marker. When
   *   omitted, the point defaults to black.
   * - `showLabel` (boolean, optional): When `true`, renders an angle marker
   *   and label around the point.
   * - `labelColor` (string, optional): Palette color for the angle label.
   * - `labelStyle` (string, optional): `'name'` renders a fixed letter;
   *   `'value'` displays the measured angle.
   * - `labelName` (string, optional): One of `['α','β','γ','δ','ε','ζ','η','θ',
   *   'ι','κ','λ','μ','ν','ξ','ο','π','ρ','σ','τ','υ','φ','χ','ω','ϡ','ͳ','ϸ']`
   *   when `labelStyle` is `'name'`.
   * - `showOutsideAngle` (boolean, optional): When `true`, the displayed angle
   *   wraps around the exterior.
   *
   * ### Line Child (`"_type": "line"`)
   *
   * - `id` (number): Unique identifier within the shape.
   * - `start`, `end` (object): Either `{ "_type": "reference", "id": <pointId> }`
   *   to reuse a point or `{ "_type": "absolute", "x": number, "y": number }`
   *   for an independent endpoint.
   * - `lineWidth` (number, optional): Width of the line in px, should be one
   *   of `1`, `2`, `3`, `5`, `7`.
   * - `stroke` (string, optional): Palette color for the stroke.
   * - `showLabel` (boolean, optional): When `true`, renders a length label
   *   along the line.
   * - `labelColor` (string, optional): Palette color for the line label.
   * - `labelStyle` (string, optional): `'name'` renders a chosen letter;
   *   `'value'` displays the live length.
   * - `labelName` (string, optional): One of `['a','b','c','d','e','f','g','h',
   *   'i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']`
   *   when `labelStyle` is `'name'`.
   *
   * ### Divider Line (`"_type": "divider-line"`)
   *
   * - `id` (number): Unique identifier.
   * - `start`, `end` (object): Always absolute coordinate objects of the form
   *   `{ "_type": "absolute", "x": number, "y": number }`.
   * - `lineWidth`, `stroke`, `labelColor`, `showLabel`, `labelStyle`,
   *   `labelName`: Same meaning and value sets as for regular lines. Divider
   *   strokes are automatically rendered with a dashed pattern.
   *
   * ### Palette Colors
   *
   * | Color  | Hex       |
   * | ------ | --------- |
   * | Black  | `#131316` |
   * | Red    | `#dc2626` |
   * | Orange | `#ea580c` |
   * | Yellow | `#ca8a04` |
   * | Lime   | `#65a30d` |
   * | Green  | `#16a34a` |
   * | Cyan   | `#0891b2` |
   * | Blue   | `#2563eb` |
   * | Violet | `#7c3aed` |
   * | Pink   | `#db2777` |
   */
  @property({
    attribute: true,
    reflect: true,
    type: Array
  })
  accessor elements: CanvasData['children'];

  /**
   * Active editing mode, accepting three possible values:
   * - `select`: Move and connect objects
   * - `create`: Create and connect objects
   * - `divider`: Create divider lines
   */
  @property({
    attribute: true,
    reflect: true,
    type: String
  })
  accessor mode: CanvasData['mode'] = 'select';

  /**
   * If set, right angles will be rendered as a square instead of a curved arc.
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

  /**
   * Global scale factor for the entire canvas.
   * Importantly, this does not effect the rendering of the shapes themselves, only the labels showing lengths and sizes.
   */
  @property({
    attribute: true,
    reflect: true,
    type: Number
  })
  accessor scale: number = 1;

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
    this.scale = value.scaleFactor;
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
          snapping: !this.disableSnapping,
          scaleFactor: this.scale
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
