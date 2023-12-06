import { LitElement, css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import Point from '/data/Point';
import Line from '/data/Line';

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
    const ctx = this.canvas?.getContext('2d');
    if (ctx) {
      const point = new Point(this.canvas, { x: 100, y: 100 });
      point.draw();

      const point2 = new Point(this.canvas, { x: 200, y: 100 });
      point2.draw();

      const line = new Line(this.canvas, point, point2);
      line.draw();

      //@ts-ignore
      window.line = line;
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
