import Selectable from './Selectable';

export interface PointData {
  x: number;
  y: number;
}

export default class Point extends Selectable {
  public readonly x: number;
  public readonly y: number;

  constructor(canvas: HTMLCanvasElement, data: PointData) {
    super(canvas);
    this.x = data.x;
    this.y = data.y;
  }

  draw() {
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.stroke();
  }
}
