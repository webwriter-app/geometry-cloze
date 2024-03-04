import Calc, { MathPoint } from '../helper/Calc';
import Draggable, { DraggableData } from './base/Draggable';
import { NamedElement } from './base/Element';
import InteractionManager from '../CanvasManager/InteractionManager';
import { StylableData } from './base/Stylable';
import { ContextMenuItem } from '../../types/ContextMenu';
import Shape from './Shape';
import Vector from '../helper/Vector';
import Arrays from '../helper/Arrays';

export type BasePoint = MathPoint & NamedElement;

export default class Point extends Draggable {
  protected _x: number;
  protected _y: number;

  constructor(
    canvas: InteractionManager,
    data: BasePoint & Partial<StylableData & DraggableData>
  ) {
    super(canvas, data);
    this._x = data.x;
    this._y = data.y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    if (this.isShowingLabel) {
      const label = this.getLabel();
      const angle = this.getAngle();
      const neighbors = this.getNeighborPoints();
      ctx.font = '18px Arial';
      ctx.fillStyle = 'black';
      if (angle !== -1 && neighbors) {
        const radius = 50;
        const vec1 = Vector.normalize(Vector.subtract(neighbors[0], this));
        const vec2 = Vector.normalize(Vector.subtract(neighbors[1], this));
        const middle = Vector.normalize(Vector.add(vec1, vec2));
        ctx.beginPath();
        // ctx.moveTo(this.x + vec1.x, this.y + vec1.y);
        const args = [
          this.x,
          this.y,
          radius,
          Vector.angle({ x: 1, y: 0 }, vec2),
          Vector.angle({ x: 1, y: 0 }, vec1)
        ] as const;
        console.log(...args, vec1, vec2);
        ctx.arc(...args);
        ctx.stroke();
        ctx.fillText(label, this.x + 10, this.y - 10);
      }
    }
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

  private getNeighborPoints(): [MathPoint, MathPoint] | null {
    if (!(this.parent instanceof Shape)) return null;
    const lines = this.parent.getLines();
    const neighbors = lines.filter((l) => l.isEndpoint(this));
    if (neighbors.length !== 2) return null;
    // lines are ordered wrong for first point
    if (lines[0] === neighbors[0] && Arrays.at(lines, -1) === neighbors[1])
      neighbors.reverse();
    const points = neighbors.map((l) => (l.start === this ? l.end : l.start));
    return points as [MathPoint, MathPoint];
  }

  private getAngle(): number {
    const neighbors = this.getNeighborPoints();
    if (!neighbors) return -1;
    const vector1 = Vector.subtract(this, neighbors[0]);
    const vector2 = Vector.subtract(this, neighbors[1]);
    const angle = Vector.angle(vector1, vector2);
    const degAngle = (angle * 180) / Math.PI;
    const rightWay = ((degAngle - 360) * -1) % 360;
    const rounded = Math.round(rightWay * 100) / 100;
    return rounded;
  }

  public getLabel(): string {
    const angle = this.getAngle();
    if (angle === -1) return '';
    return `${angle}°`;
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
