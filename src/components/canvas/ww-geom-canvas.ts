import { LitElement, css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import Point from '/data/Point';
import Line from '/data/Line';
import CanvasManager from '/data/CanvasManager';

/**
 *
 */
@customElement('ww-geom-canvas')
export class WwGeomCanvas extends LitElement {
  @query('canvas') canvas!: HTMLCanvasElement;

  render() {
    return html`<canvas width="2000" height="1000"></canvas> `;
  }

  firstUpdated() {
    if (this.canvas) {
      const manager = new CanvasManager(this.canvas);

      const point = new Point(this.canvas, { x: 100, y: 100 });

      const point2 = new Point(this.canvas, { x: 200, y: 100 });

      const line = new Line(this.canvas, point, point2);

      manager.addShape(point);
      manager.addShape(point2);
      manager.addShape(line);

      //@ts-ignore
      window.manager = manager;
      //@ts-ignore
      window.point = point;
    } else console.warn('No canvas context');
  }

  static styles = css`
    canvas {
      aspect-ratio: 2 / 1;
      width: calc(100% - 2px - 4rem);
      border: solid 1px black;
      margin: 2rem;
      box-sizing: border-box;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geom-canvas': WwGeomCanvas;
  }
}
