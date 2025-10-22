import Calc, { MathLine, MathPoint } from '../helper/Calc';
import Vector from '../helper/Vector';

import Element, { NamedElement } from './base/Element';
import { StylableData } from './base/Stylable';
import Draggable, { DraggableData, MoveCoords } from './base/Draggable';
import Point from './Point';

import Numbers from '../helper/Numbers';
import Manager from '../CanvasManager/Abstracts';
import { SELECTION_STYLE } from '../components/SelectionRect';
import SHOELACE from '../helper/Shoelace';

export type BaseLine = MathLine & NamedElement;

export default class Line extends Draggable {
  private _start: MathPoint;
  private _end: MathPoint;
  protected _x: number;
  protected _y: number;
  protected clickTargetSize = 2;

  constructor(
    manager: Manager,
    data: BaseLine & Partial<StylableData & DraggableData>
  ) {
    super(manager, data);
    this._start = data.start;
    this._end = data.end;
    this._x = data.start.x;
    this._y = data.start.y;
  }

  public move(coords: MoveCoords): void {
    const relativeCoords: MoveCoords = coords.relative
      ? coords
      : {
          x: (coords?.x ?? this._x) - this._x,
          y: (coords?.y ?? this._y) - this._y,
          relative: true,
          moveToken: coords.moveToken
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
    ctx.moveTo(this._start.x, this._start.y);
    ctx.lineTo(this._end.x, this._end.y);

    if (this.selected) {
      ctx.globalAlpha = SELECTION_STYLE.alpha;
      ctx.lineWidth = this.lineWidth + SELECTION_STYLE.strokeOffset * 2;
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = this.lineWidth;
      if (this.dashed) ctx.setLineDash([10, 10]);
    }

    ctx.stroke();

    // draw label
    if (this.showLabel) {
      const padding = 5;
      const middlePoint = {
        x: (this._start.x + this._end.x) / 2,
        y: (this._start.y + this._end.y) / 2
      };
      const label = this.getLabel();
      ctx.font = `24px ${SHOELACE.font.sans}`;
      ctx.fillStyle = this.labelColor;
      const metrics = ctx.measureText(label);
      const fontHeight =
        metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
      if (this.parent && 'getPoints' in this.parent) {
        const ortho = Vector.orthogonal(
          Vector.normalize({
            x: this._end.x - this._start.x,
            y: this._end.y - this._start.y
          })
        );
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

  protected getValueLabel() {
    return Numbers.round(
      Calc.distance(this.start, this.end) * this.manager.scale
    );
  }

  public isEndpoint(point: MathPoint) {
    return this._start === point || this._end === point;
  }

  public export() {
    return {
      ...super.export(),
      _type: 'line' as const,
      start:
        this._start instanceof Point
          ? { _type: 'reference' as const, id: this._start.id }
          : { _type: 'absolute' as const, x: this._start.x, y: this._start.y },
      end:
        this._end instanceof Point
          ? { _type: 'reference' as const, id: this._end.id }
          : { _type: 'absolute' as const, x: this._end.x, y: this._end.y }
    };
  }

  public static import(data: BaseLine, manager: Manager) {
    return new Line(manager, data);
  }
}
