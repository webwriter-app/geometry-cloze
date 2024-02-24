import Draggable, { DraggableData } from './base/Draggable';
import Calc, { MathLine, MathPoint } from '../helper/Calc';
import Element, { NamedElement } from './base/Element';
import Point from './Point';
import InteractionManager from '../CanvasManager/InteractionManager';
import { StylableData } from './base/Stylable';
import { ContextMenuItem } from '../../types/ContextMenu';

export type BaseLine = MathLine & NamedElement;

export default class Line extends Draggable {
  private _start: MathPoint;
  private _end: MathPoint;
  protected _x: number;
  protected _y: number;
  protected clickTargetSize = 2;

  constructor(
    canvas: InteractionManager,
    data: BaseLine & Partial<StylableData & DraggableData>
  ) {
    super(canvas, data);
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
    super.move(relativeCoords);
    if (this._start instanceof Point) this._start.move(relativeCoords);
    if (this._end instanceof Point) this._end.move(relativeCoords);
    this.fireEvent('move', this);
    this.requestRedraw();
  }

  protected removeChild(child: Element): void {
    this.delete();
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    ctx.beginPath();
    const vector = {
      x: this._end.x - this._start.x,
      y: this._end.y - this._start.y
    };
    const normalized = Calc.normalize(vector);
    const start = {
      x: this._start.x,
      y: this._start.y
    };
    if (this.start instanceof Point) {
      start.x += normalized.x * this.start.size;
      start.y += normalized.y * this.start.size;
    }
    ctx.moveTo(start.x, start.y);

    const end = {
      x: this._end.x,
      y: this._end.y
    };
    if (this.end instanceof Point) {
      end.x -= normalized.x * this.end.size;
      end.y -= normalized.y * this.end.size;
    }
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  setStart(start: MathPoint) {
    this._start = start;
    this.requestRedraw();
  }

  setEnd(end: MathPoint) {
    this._end = end;
    this.requestRedraw();
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

  public isEndpoint(point: MathPoint) {
    return this._start === point || this._end === point;
  }

  public export() {
    return {
      ...super.export(),
      _type: 'line' as const,
      start: {
        x: this._start.x,
        y: this._start.y,
        ...(this._start instanceof Point && { id: this._start.id })
      },
      end: {
        x: this._end.x,
        y: this._end.y,
        ...(this._end instanceof Point && { id: this._end.id })
      }
    };
  }

  public static import(data: BaseLine, canvas: InteractionManager) {
    return new Line(canvas, data);
  }
}
