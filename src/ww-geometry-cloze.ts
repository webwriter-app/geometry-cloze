import '@webcomponents/scoped-custom-element-registry';
import { LitElementWw } from '@webwriter/lit';
import { PropertyValueMap, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { WwGeomContextMenu } from './components/context-menu/ww-geom-context-menu';
import { WwGeomToolbar } from './components/toolbar/ww-geom-toolbar';
import Shape from './data/elements/Shape';
import CanvasManager, { CanvasData } from './data/CanvasManager/CanvasManager';
import Objects from './data/helper/Objects';
import { LitElement } from 'lit';

import '@shoelace-style/shoelace/dist/themes/light.css';
import { WwGeomOptions } from './components/options/ww-geom-options';

/**
 * A widget to create and view geometry exercises.
 */
@customElement('ww-geometry-cloze')
export class WwGeometryCloze extends LitElementWw {
  @query('canvas') accessor  canvas!: HTMLCanvasElement;
  @query('ww-geom-context-menu') accessor contextMenu!: WwGeomContextMenu;

  manager: CanvasManager | null = null;

  @property({
    attribute: true,
    reflect: true,
    type: Array
  })
  accessor elements: CanvasData['children'];

  @property({
    attribute: true,
    reflect: true,
    type: String
  })
  accessor mode: CanvasData['mode'] = 'select';
  @property({
    attribute: true,
    reflect: true,
    type: Boolean
  })
  accessor abstractRightAngle: CanvasData['abstractRightAngle'] = false;
  @property({
    attribute: true,
    reflect: true,
    type: Boolean
  })
  accessor showGrid: CanvasData['showGrid'] = true;
  @property({
    attribute: true,
    reflect: true,
    type: Boolean
  })
  accessor snap: CanvasData['snapping'] = true;

  render() {
    return html`<div class="wrapper">
      ${
        this.isContentEditable
          ? html`<ww-geom-toolbar
              mode=${this.mode}
              @mode-change=${(e: CustomEvent<{ mode: InteractionMode }>) => {
                this.mode = e.detail.mode;
                if (!this.manager) return;
                this.manager.mode = e.detail.mode;
              }}></ww-geom-toolbar>`
          : ''
      }
        <canvas width="1000" height="700"></canvas>
        <ww-geom-context-menu></ww-geom-context-menu>
      </div>
    </div>
    <ww-geom-options part="options" .manager=${
      this.manager
    }></ww-geom-options>`;
  }

  private onBlur() {
    this.contextMenu?.close();
  }
  private onClick() {
    this.contextMenu?.close();
  }

  protected updated(
    changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    if (changedProperties.has('elements')) {
      if (!this.manager || !this.elements) return;
      const exportData = this.manager.export();
      if (!Objects.deepEqual(exportData.children, this.elements))
        this.manager.import({
          children: this.elements
        });
    } else if (changedProperties.has('mode')) {
      if (this.manager) this.manager.mode = this.mode;
    } else if (changedProperties.has('abstractRightAngle'.toLowerCase())) {
      if (this.manager)
        this.manager.abstractRightAngle = this.abstractRightAngle;
    } else if (changedProperties.has('showGrid'.toLowerCase())) {
      if (this.manager) this.manager.toggleGrid(this.showGrid);
    } else if (changedProperties.has('snap')) {
      if (this.manager) this.manager.toggleSnapping(this.snap);
    }
  }

  private onCanvasValueChange(value: CanvasData) {
    this.elements = value.children;
    this.mode = value.mode;
    this.abstractRightAngle = value.abstractRightAngle;
    this.showGrid = value.showGrid;
    this.snap = value.snapping;
  }

  firstUpdated() {
    this.addEventListener('blur', this.onBlur.bind(this));
    this.addEventListener('click', this.onClick.bind(this));
    if (this.canvas) {
      if (this.manager) {
        console.warn('Prevented creating multiple CanvasManager');
        return;
      }
      this.manager = new CanvasManager(
        this.canvas,
        this.renderRoot as HTMLElement,
        this.contextMenu
      );
      this.manager.addUpdateListener(this.onCanvasValueChange.bind(this));

      if (this.elements) {
        this.manager.import({
          children: this.elements,
          mode: this.mode
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
    this.removeEventListener('blur', this.onBlur);
    this.removeEventListener('click', this.onClick);
    if (this.manager) {
      this.manager.removeUpdateListener(this.onCanvasValueChange);
      this.manager.unmount();
    }
    super.disconnectedCallback();
  }

  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true
  };

  public static get scopedElements() {
    return {
      'ww-geom-toolbar': WwGeomToolbar,
      'ww-geom-context-menu': WwGeomContextMenu,
      'ww-geom-options': WwGeomOptions
    };
  }

  static styles = css`
    :host {
      outline: none;
      z-index: 10000000;
      position: relative;
    }
    .wrapper {
      margin: 2rem;
      margin-top: 0;
      position: relative;
      outline: none;
    }
    canvas {
      aspect-ratio: 10 / 7;
      width: calc(100% - 2px);
      border: solid 1px black;
      box-sizing: border-box;
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
