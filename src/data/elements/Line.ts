import Calc, { MathLine, MathPoint } from '../helper/Calc';
import Vector from '../helper/Vector';

import Element, { NamedElement } from './base/Element';
import { StylableData } from './base/Stylable';
import Draggable, { DraggableData } from './base/Draggable';
import Point from './Point';

import InteractionManager from '../CanvasManager/InteractionManager';
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
    if (this.hidden) return;
    super.draw(ctx);
    ctx.beginPath();
    const vector = {
      x: this._end.x - this._start.x,
      y: this._end.y - this._start.y
    };
    const normalized = Vector.normalize(vector);
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

    // draw label
    if (this.isShowingLabel) {
      const padding = 5;
      const middlePoint = {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2
      };
      const label = this.getLabel();
      ctx.font = '24px Arial';
      const metrics = ctx.measureText(label);
      const fontHeight =
        metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
      if (this.parent && 'getPoints' in this.parent) {
        const ortho = Vector.orthogonal(normalized);
        const point1 = Vector.add(
          middlePoint,
          Vector.scale(ortho, fontHeight / 2)
        );
        const factor = Calc.isPointInPolygon(point1, this.parent.getPoints())
          ? -1
          : 1;

        const angleFactor = 1 + Math.min(Math.abs(ortho.x), Math.abs(ortho.y));
        const startPoint = Vector.add(
          middlePoint,
          Vector.scale(ortho, fontHeight * factor * angleFactor)
        );
        ctx.clearRect(
          startPoint.x - metrics.width / 2 - padding,
          startPoint.y - fontHeight / 2 - padding,
          metrics.width + 2 * padding,
          fontHeight + 2 * padding
        );
        ctx.fillStyle = this.stroke;
        ctx.fillText(
          label,
          startPoint.x - metrics.width / 2,
          startPoint.y + fontHeight / 4
        );
      } else {
        ctx.clearRect(
          middlePoint.x - metrics.width / 2 - padding,
          middlePoint.y - fontHeight / 2 - padding,
          metrics.width + 2 * padding,
          fontHeight + 2 * padding
        );
        ctx.fillStyle = this.stroke;
        ctx.fillText(
          label,
          middlePoint.x - metrics.width / 2,
          middlePoint.y + fontHeight / 4
        );
      }
    }
  }

  setStart(start: MathPoint) {
    if (start instanceof Point || !(this._start instanceof Point))
      this._start = start;
    else this._start.move({ ...start, relative: false });

    this.requestRedraw();
  }

  setEnd(end: MathPoint) {
    if (end instanceof Point || !(this._end instanceof Point)) this._end = end;
    else this._end.move({ ...end, relative: false });
    this.requestRedraw();
  }

  get start() {
    return this._start;
  }

  get end() {
    return this._end;
  }

  getHit(point: MathPoint, point2?: MathPoint): Draggable[] {
    if (this.hidden) return [];
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

  protected getLabel() {
    return (
      Math.round(
        (Calc.distance(this.start, this.end) / this.manager.scale) * 100
      ) / 100
    ).toLocaleString();
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
