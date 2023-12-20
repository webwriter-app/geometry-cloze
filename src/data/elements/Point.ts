import Calc from '../helper/Calc';
import CanvasManager from '../CanvasManager';
import Draggable from './base/Draggable';

export interface PointData {
  x: number;
  y: number;
}

export default class Point extends Draggable {
  protected _x: number;
  protected _y: number;

  constructor(canvas: CanvasManager, data: PointData, active = true) {
    super(canvas, {}, active);
    this._x = data.x;
    this._y = data.y;
  }

  draw() {
    if (!this.active) return;
    super.draw();
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.stroke();
  }

  move(coords: { x?: number; y?: number; relative: boolean }) {
    if (coords.relative) {
      this._x += coords.x ?? 0;
      this._y += coords.y ?? 0;
    } else {
      this._x = coords.x ?? this.x;
      this._y = coords.y ?? this.y;
    }
    this.fireEvent('move', this);
    this.requestRedraw();
  }

  getHit(point: Point): Draggable[] {
    return Calc.distance(this, point) - this.clickTargetSize <
      this.size + this.lineWidth / 2
      ? [this]
      : super.getHit(point);
  }
}
