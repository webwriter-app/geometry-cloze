import { LitElement, css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import CanvasManager from '../../data/CanvasManager/CanvasManager';
import Shape from '../../data/elements/Shape';
import { WwGeomContextMenu } from '../context-menu/ww-geom-context-menu';
import '../context-menu/ww-geom-context-menu';

/**
 *
 */
@customElement('ww-geom-canvas')
export class WwGeomCanvas extends LitElement {
  @query('canvas') canvas!: HTMLCanvasElement;
  @query('ww-geom-context-menu') contextMenu!: WwGeomContextMenu;

  render() {
    return html`<div class="wrapper">
      <canvas width="2000" height="1000"></canvas>
      <div class="click-target"></div>
      <ww-geom-context-menu></ww-geom-context-menu>
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
      const manager = new CanvasManager(this.canvas, this.contextMenu);

      const polygon = Shape.createPolygon(manager, [
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

      const line = Shape.createLine(manager, {
        start: { x: 800, y: 100 },
        end: { x: 300, y: 900 },
        name: 'standalone line'
      });

      const point7 = Shape.createPoint(manager, {
        x: 100,
        y: 100,
        name: 'standalone top left'
      });

      manager.addShape(polygon);
      manager.addShape(line);
      manager.addShape(point7);

      //@ts-ignore
      window.manager = manager;
    } else console.warn('No canvas context');
  }

  disconnectedCallback(): void {
    this.removeEventListener('blur', this.onBlur);
    this.removeEventListener('click', this.onClick);
    super.disconnectedCallback();
  }

  static styles = css`
    .wrapper {
      position: relative;
      margin: 2rem;
    }
    .click-target {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
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
    'ww-geom-canvas': WwGeomCanvas;
  }
}
