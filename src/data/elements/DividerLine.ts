import Manager from '../CanvasManager/Abstracts';
import { MathPoint } from '../helper/Calc';
import Line, { BaseLine } from './Line';
import Point from './Point';
import Draggable, { DraggableData } from './base/Draggable';
import { StylableData } from './base/Stylable';

export default class DividerLine extends Line {
  constructor(
    manager: Manager,
    data: BaseLine & Partial<StylableData & DraggableData>
  ) {
    const start = new Point(manager, data.start);
    const end = new Point(manager, data.end);
    super(manager, { ...data, start, end });
    for (const point of [start, end]) {
      point.hide();
      point.setFill('#00000050');
      point.setStroke('transparent');
    }

    this.addChild(start, end);
    function hidePoints(hide: boolean) {
      start.hide(hide);
      end.hide(hide);
    }
    start.addEventListener('select', hidePoints.bind(this, false));
    end.addEventListener('select', hidePoints.bind(this, false));
    start.addEventListener('blur', hidePoints.bind(this, true));
    end.addEventListener('blur', hidePoints.bind(this, true));

    this.setDashed(true);
    this.setStroke('#00000050');
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
    if (this.start instanceof Point) this.start.move(relativeCoords);
    if (this.end instanceof Point) this.end.move(relativeCoords);
    if (relativeCoords.x) this._x += relativeCoords.x;
    if (relativeCoords.y) this._y += relativeCoords.y;
    this.fireEvent('move', this);
    this.requestRedraw();
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.hidden) return;
    super.draw(ctx);
    if (this.start instanceof Point) this.start.draw(ctx);
    if (this.end instanceof Point) this.end.draw(ctx);
  }

  getHit(point: MathPoint, point2?: MathPoint): Draggable[] {
    if (this.hidden) return [];
    const res = super.getHit(point, point2);
    if (this.start instanceof Point)
      res.push(...this.start.getHit(point, point2));
    if (this.end instanceof Point) res.push(...this.end.getHit(point, point2));
    return res;
  }

  select(): void {
    if (this.start instanceof Point) this.start.hide(false);
    if (this.end instanceof Point) this.end.hide(false);
    super.select();
  }
  blur(): void {
    if (this.start instanceof Point) this.start.hide();
    if (this.end instanceof Point) this.end.hide();
    super.blur();
  }

  public static import(data: BaseLine, manager: Manager) {
    return new DividerLine(manager, data);
  }
}
