import { LitElement, PropertyValueMap, css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import './components/toolbar/ww-geom-toolbar';
// init shoelace
import { WwGeomContextMenu } from './components/context-menu/ww-geom-context-menu';
import Shape from './data/elements/Shape';
import CanvasManager from './data/CanvasManager/CanvasManager';
import Objects from './data/helper/Objects';
import '@shoelace-style/shoelace/dist/themes/light.css';

/**
 * A widget to create and view geometry exercises.
 */
@customElement('ww-geometry-cloze')
export class WwGeometryCloze extends LitElement {
  @query('canvas') canvas!: HTMLCanvasElement;
  @query('ww-geom-context-menu') contextMenu!: WwGeomContextMenu;

  manager: CanvasManager | null = null;

  @property({ type: String, attribute: 'contenteditable' })
  contentEditable = '';

  @state()
  mode: InteractionMode = 'select';

  @property({
    attribute: true,
    reflect: true,
    type: Object
  })
  value: any;

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
    </div>`;
  }

  private onBlur() {
    this.contextMenu?.close();
  }
  private onClick() {
    this.contextMenu?.close();
  }

  protected updated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    if (_changedProperties.has('value')) {
      if (
        this.manager &&
        this.value &&
        !Objects.deepEqual(this.manager.export(), this.value)
      )
        this.manager.import(this.value);
    }
  }

  private onCanvasValueChange(value: any) {
    this.value = value;
  }

  firstUpdated() {
    this.addEventListener('blur', this.onBlur.bind(this));
    this.addEventListener('click', this.onClick.bind(this));
    if (this.canvas) {
      if (this.manager) {
        console.warn('Prevented creating multiple CanvasManager');
        return;
      }
      this.manager = new CanvasManager(this.canvas, this.contextMenu);
      this.manager.addUpdateListener(this.onCanvasValueChange.bind(this));
      this.manager.listenForModeChange((mode) => (this.mode = mode));

      if (this.value) {
        this.manager.import(this.value);
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

        this.manager.addShape(polygon);
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

  static styles = css`
    :host {
      outline: none;
      z-index: 0;
    }
    .wrapper {
      margin: 2rem;
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
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geometry-cloze': WwGeometryCloze;
  }
}
