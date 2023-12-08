import Point from './Point';
import Draggable from './Draggable';
import Calc from './Calc';
import CanvasManager from './CanvasManager';

export default class Line extends Draggable {
  private _start: Point;
  private _end: Point;

  constructor(canvas: CanvasManager, start: Point, end: Point) {
    super(canvas);
    this._start = start;
    this._end = end;
  }

  draw() {
    super.draw();
    this.ctx.beginPath();
    // TODO: account for point size
    this.ctx.moveTo(this._start.x, this._start.y);
    this.ctx.lineTo(this._end.x, this._end.y);
    this.ctx.stroke();
  }

  get start() {
    return this._start;
  }

  get end() {
    return this._end;
  }

  public isHit(point: Point): boolean {
    return Calc.distance(this, point) <= this.lineWidth + this.clickTargetSize;
  }
}
