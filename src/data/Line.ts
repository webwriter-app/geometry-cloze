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

  move(coords: { x?: number; y?: number; relative: boolean }) {
    const change = coords.relative
      ? coords
      : {
          x: coords.x ? coords.x - this.start.x : 0,
          y: coords.y ? coords.y - this.start.y : 0,
          relative: true
        };

    this._start.move(change);
    this._end.move(change);
    this.fireEvent('move', this);
    this.requestRedraw();
  }

  isHit(point: Point): boolean {
    return Calc.distance(this, point) <= this.lineWidth + this.clickTargetSize;
  }
}
