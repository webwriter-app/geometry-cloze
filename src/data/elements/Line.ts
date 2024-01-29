import Draggable from './base/Draggable';
import Calc, { MathLine, MathPoint } from '../helper/Calc';
import Element, { NamedElement } from './base/Element';
import { ContextMenuItem } from '/types/ContextMenu';
import Point from './Point';
import InteractionManager from '../CanvasManager/InteractionManager';

export type BaseLine = MathLine & NamedElement;

export default class Line extends Draggable {
  private _start: MathPoint;
  private _end: MathPoint;
  protected _x: number;
  protected _y: number;
  protected clickTargetSize = 2;

  constructor(canvas: InteractionManager, data: BaseLine) {
    super(canvas);
    if (data.name !== undefined) this.name = data.name;
    this._start = data.start;
    this._end = data.end;
    this._x = data.start.x;
    this._y = data.start.y;
  }

  public move(coords: {
    x?: number | undefined;
    y?: number | undefined;
    relative: boolean;
  }): void {
    const relativeCoords = coords.relative
      ? coords
      : {
          x: (coords?.x ?? this._x) - this._x,
          y: (coords?.y ?? this._y) - this._y,
          relative: true
        };
    super.move(coords);
    if (this._start instanceof Point) this._start.move(relativeCoords);
    if (this._end instanceof Point) this._end.move(relativeCoords);
    this.fireEvent('move', this);
    this.requestRedraw();
  }

  protected removeChild(child: Element): void {
    this.delete();
  }

  onStartMove() {
    this._x = this.start.x;
    this._y = this.start.y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    ctx.beginPath();
    // TODO: account for point size
    ctx.moveTo(this._start.x, this._start.y);
    ctx.lineTo(this._end.x, this._end.y);
    ctx.stroke();
  }

  get start() {
    return this._start;
  }

  get end() {
    return this._end;
  }

  getHit(point: MathPoint, point2?: MathPoint): Draggable[] {
    if (point2) {
      const rect = {
        x1: point.x,
        y1: point.y,
        x2: point2.x,
        y2: point2.y
      };
      const hits = [];
      const lineHit = Calc.isInRect(rect, this);

      if (lineHit) hits.push(this);

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
