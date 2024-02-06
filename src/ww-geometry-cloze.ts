import { LitElement, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import './components/toolbar/ww-geom-toolbar';
// init shoelace
import './misc/shoelaceSetup';
import { InteractionMode } from './data/CanvasManager/InteractionManager';
import { WwGeomContextMenu } from './components/context-menu/ww-geom-context-menu';
import CanvasManager from './data/CanvasManager/CanvasManager';
import Shape from './data/elements/Shape';

/**
 * A widget to create and view geometry exercises.
 */
@customElement('ww-geometry-cloze')
export class WwGeometryCloze extends LitElement {
  @query('canvas') canvas!: HTMLCanvasElement;
  @query('ww-geom-context-menu') contextMenu!: WwGeomContextMenu;

  manager: CanvasManager | null = null;

  @property({ attribute: true })
  mode: InteractionMode = 'select';

  render() {
    return html`<div class="wrapper">
      <ww-geom-toolbar
        mode=${this.mode}
        @mode-change=${(e: CustomEvent<{ mode: InteractionMode }>) => {
          this.mode = e.detail.mode;
          if (!this.manager) return;
          this.manager.mode = e.detail.mode;
        }}></ww-geom-toolbar>
      <div class="canvas-wrapper">
        <canvas width="2000" height="1000"></canvas>
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

  firstUpdated() {
    this.addEventListener('blur', this.onBlur.bind(this));
    this.addEventListener('click', this.onClick.bind(this));
    if (this.canvas) {
      if (this.manager) {
        console.warn('Prevented creating multiple CanvasManager');
        return;
      }
      this.manager = new CanvasManager(this.canvas, this.contextMenu);
      this.manager.listenForModeChange((mode) => (this.mode = mode));

      const polygon = Shape.createPolygon(this.manager, [
        { x: 200, y: 200, name: 'top left' },
        { x: 500, y: 200, name: 'top right' },
        { x: 500, y: 500, name: 'bottom right' },
        { x: 200, y: 500, name: 'bottom left' }
      ]);
      polygon.addPoint({
        x: 600,
        y: 300,
        name: 'middle right'
      });

      const line = Shape.createLine(this.manager, {
        // @ts-ignore
        start: { x: 800, y: 100, name: 'top right' },
        // @ts-ignore
        end: { x: 300, y: 900, name: 'bottom left' },
        name: 'standalone line'
      });

      const point7 = Shape.createPoint(this.manager, {
        x: 100,
        y: 100,
        name: 'standalone top left'
      });

      this.manager.addShape(polygon);
      this.manager.addShape(line);
      this.manager.addShape(point7);

      //@ts-ignore
      window.manager = this.manager;
    } else console.warn('No canvas context');
  }

  disconnectedCallback(): void {
    this.removeEventListener('blur', this.onBlur);
    this.removeEventListener('click', this.onClick);
    super.disconnectedCallback();
  }

  static styles = css`
    .wrapper {
      margin: 2rem;
    }
    .canvas-wrapper {
      position: relative;
    }
    canvas {
      aspect-ratio: 2 / 1;
      width: calc(100% - 2px);
      border: solid 1px black;
      box-sizing: border-box;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geometry-cloze': WwGeometryCloze;
  }
}
