import Point from './Point';
import Selectable from './Selectable';

export default class Line extends Selectable {
  private _start: Point;
  private _end: Point;

  constructor(canvas: HTMLCanvasElement, start: Point, end: Point) {
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
}
