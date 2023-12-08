import Point from './Point';
import Draggable from './Draggable';
import Calc from './Calc';
import CanvasManager from './CanvasManager';

export default class Line extends Draggable {
  private _start: Point;
  private _end: Point;
  protected _x: number;
  protected _y: number;

  constructor(canvas: CanvasManager, start: Point, end: Point) {
    super(canvas);
    this._start = start;
    this._end = end;
    this.children.push(start, end);
    this._x = start.x;
    this._y = start.y;

    start.addEventListener('move', this.onStartMove.bind(this));
  }

  onStartMove() {
    this._x = this.start.x;
    this._y = this.start.y;
  }

  delete() {
    super.delete();
    this.start.removeEventListener('move', this.onStartMove.bind(this));
  }

  draw() {
    this._start.draw();
    this._end.draw();
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

  getHit(point: Point): Draggable | null {
    const pointHit = super.getHit(point);
    if (pointHit) return pointHit;
    if (Calc.distance(this, point) <= this.lineWidth + this.clickTargetSize)
      return this;
    return null;
  }
}
