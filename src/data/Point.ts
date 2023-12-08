import Calc from './Calc';
import CanvasManager from './CanvasManager';
import Draggable from './Draggable';

export interface PointData {
  x: number;
  y: number;
}

export default class Point extends Draggable {
  public readonly x: number;
  public readonly y: number;

  constructor(canvas: CanvasManager, data: PointData, active = true) {
    super(canvas, {}, active);
    this.x = data.x;
    this.y = data.y;
  }

  draw() {
    if (!this.active) return;
    super.draw();
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.stroke();
  }

  public isHit(point: Point): boolean {
    return (
      Calc.distance(this, point) - this.clickTargetSize <
      this.size + this.lineWidth / 2
    );
  }
}
