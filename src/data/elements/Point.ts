import Calc, { MathPoint } from '../helper/Calc';
import CanvasManager from '../CanvasManager';
import Draggable from './base/Draggable';
import { ContextMenuItem } from '/types/ContextMenu';
import { NamedElement } from './base/Element';

export type BasePoint = MathPoint & NamedElement;

export default class Point extends Draggable {
  protected _x: number;
  protected _y: number;

  constructor(canvas: CanvasManager, data: BasePoint, active = true) {
    super(canvas, {}, active);
    if (data.name !== undefined) this.name = data.name;
    this._x = data.x;
    this._y = data.y;
  }

  draw() {
    if (!this.active) return;
    super.draw();
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.stroke();
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

  getHit(point: Point): Draggable[] {
    return Calc.distance(this, point) - this.clickTargetSize <
      this.size + this.lineWidth / 2
      ? [this]
      : super.getHit(point);
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
}
