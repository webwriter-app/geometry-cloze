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
    return html`<div class="wrapper">
      <canvas width="2000" height="1000"></canvas>
      <div class="click-target"></div>
    </div>`;
  }

  firstUpdated() {
    if (this.canvas) {
      const manager = new CanvasManager(this.canvas);

      const point = new Point(manager, { x: 200, y: 200 });

      const point2 = new Point(manager, { x: 500, y: 200 });

      const line = new Line(manager, point, point2);

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
