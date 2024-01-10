import Point from './Point';
import Draggable from './base/Draggable';
import Calc from '../helper/Calc';
import CanvasManager from '../CanvasManager';
import Element from './base/Element';
import { ContextMenuItem } from '/types/ContextMenu';

export default class Line extends Draggable {
  private _start: Point;
  private _end: Point;
  protected _x: number;
  protected _y: number;
  protected clickTargetSize = 2;

  constructor(canvas: CanvasManager, start: Point, end: Point) {
    super(canvas);
    this._start = start;
    this._end = end;
    this.addChild(start, end);
    this._x = start.x;
    this._y = start.y;

    start.addEventListener('move', this.onStartMove.bind(this));
  }

  protected removeChild(child: Element): void {
    this.delete();
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

  getHit(point: Point, point2?: Point): Draggable[] {
    if (point2) {
      const rect = {
        x1: point.x,
        y1: point.y,
        x2: point2.x,
        y2: point2.y
      };
      const hits = [];
      const lineHit = Calc.isInRect(rect, this);
      const startHit = Calc.isInRect(rect, this._start);
      const endHit = Calc.isInRect(rect, this._end);

      // if start AND end are selected, we select the line -> line is part of selection
      // if only start OR end are selected, we don't select the line -> likely intentional to select this line
      // if neither start nor end are selected, we don't select the line -> likely intentional to not select this line
      if (startHit) hits.push(this._start);
      if (endHit) hits.push(this._end);
      if (lineHit && startHit === endHit) hits.push(this);

      return hits;
    } else {
      const pointHit = super.getHit(point);
      if (pointHit.length) return pointHit;
      if (Calc.distance(this, point) <= this.lineWidth + this.clickTargetSize)
        return [this];
      return [];
    }
  }

  public getContextMenuItems(): ContextMenuItem[] {
    return [
      ...super.getContextMenuItems(),
      ...this.getStyleContextMenuItems({ stroke: true, lineWidth: true })
    ];
  }
}
