import Calc, { MathPoint } from '../helper/Calc';
import Draggable, { DraggableData } from './base/Draggable';
import { ContextMenuItem } from '/types/ContextMenu';
import { NamedElement } from './base/Element';
import InteractionManager from '../CanvasManager/InteractionManager';
import { StylableData } from './base/Stylable';

export type BasePoint = MathPoint & NamedElement;

export default class Point extends Draggable {
  protected _x: number;
  protected _y: number;

  constructor(
    canvas: InteractionManager,
    data: BasePoint & Partial<StylableData & DraggableData>
  ) {
    super(canvas, data);
    if (data.name !== undefined) this.name = data.name;
    this._x = data.x;
    this._y = data.y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  move(coords: { x?: number; y?: number; relative: boolean }) {
    if (coords.relative) {
      this._x += coords.x ?? 0;
      this._y += coords.y ?? 0;
    } else {
      this._x = coords.x ?? this.x;
      this._y = coords.y ?? this.y;
    }
    this.fireEvent('move', this);
    this.requestRedraw();
  }

  getHit(point: MathPoint, point2?: MathPoint): Draggable[] {
    if (!point2)
      return Calc.distance(this, point) - this.clickTargetSize <
        this.size + this.lineWidth / 2
        ? [this]
        : super.getHit(point, point2);
    else {
      const isInSelection = Calc.isPointInRect(
        {
          x1: point.x,
          y1: point.y,
          x2: point2.x,
          y2: point2.y
        },
        this
      );
      if (isInSelection) return [this];
      return super.getHit(point, point2);
    }
  }

  public getContextMenuItems(): ContextMenuItem[] {
    return [
      ...super.getContextMenuItems(),
      ...this.getStyleContextMenuItems({
        stroke: true,
        fill: true,
        lineWidth: true
      })
    ];
  }

  public export() {
    return {
      ...super.export(),
      _type: 'point' as const,
      x: this.x,
      y: this.y
    };
  }

  public static import(data: BasePoint, canvas: InteractionManager) {
    return new Point(canvas, data);
  }
}
