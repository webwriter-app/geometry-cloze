import { LitElement, css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import Point from '../../data/elements/Point';
import CanvasManager from '/data/CanvasManager';
import Polygon from '../../data/elements/Polygon';
import Line from '../../data/elements/Line';
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

  firstUpdated() {
    this.addEventListener('blur', this.onBlur.bind(this));
    if (this.canvas) {
      const manager = new CanvasManager(this.canvas, this.contextMenu);

      const point = new Point(manager, { x: 200, y: 200 });
      point.name = 'top left';
      const point2 = new Point(manager, { x: 500, y: 200 });
      point2.name = 'top right';
      const point3 = new Point(manager, { x: 500, y: 500 });
      point3.name = 'bottom right';
      const point4 = new Point(manager, { x: 200, y: 500 });
      point4.name = 'bottom left';
      const point41 = new Point(manager, { x: 600, y: 300 });
      point41.name = 'middle right';
      const polygon = new Polygon(manager, [point, point4, point3, point2]);
      polygon.addPoint(point41);

      const point5 = new Point(manager, { x: 800, y: 100 });
      const point6 = new Point(manager, { x: 300, y: 900 });
      const line = new Line(manager, point5, point6);

      manager.addShape(polygon);
      manager.addShape(line);

      //@ts-ignore
      window.manager = manager;
    } else console.warn('No canvas context');
  }

  disconnectedCallback(): void {
    this.removeEventListener('blur', this.onBlur);
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
