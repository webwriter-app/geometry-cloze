import Calc, { MathPoint } from '../helper/Calc';
import Vector from '../helper/Vector';
import Arrays from '../helper/Arrays';

import { NamedElement } from './base/Element';
import { StylableData } from './base/Stylable';
import Draggable, { DraggableData } from './base/Draggable';

import Shape from './Shape';

import { ContextMenuItem, ContextMenuSubmenu } from '../../types/ContextMenu';
import Numbers from '../helper/Numbers';
import Manager from '../CanvasManager/Abstracts';

export type BasePoint = MathPoint & NamedElement;

export default class Point extends Draggable {
  protected _x: number;
  protected _y: number;

  constructor(
    manager: Manager,
    data: BasePoint &
      Partial<StylableData & DraggableData> & { showOutsideAngle?: boolean }
  ) {
    super(manager, data);
    if (data.showOutsideAngle) this.showOutsideAngle = data.showOutsideAngle;
    this._x = data.x;
    this._y = data.y;
  }

  protected showOutsideAngle = false;
  draw(ctx: CanvasRenderingContext2D) {
    if (this.hidden) return;
    super.draw(ctx);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    if (this.showLabel) {
      ctx.font = '18px Arial';
      ctx.fillStyle = this.labelColor;
      ctx.strokeStyle = this.labelColor;
      const label = this.getLabel();
      let angle = this.getAngle();
      const neighbors = this.getNeighborPoints();
      const metrics = ctx.measureText(label);
      const fontHeight =
        metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
      if (angle !== -1 && neighbors) {
        const textPadding = 2.5;
        let vec1 = Vector.normalize(Vector.subtract(neighbors[0], this));
        let vec2 = Vector.normalize(Vector.subtract(neighbors[1], this));

        if (this.showOutsideAngle) angle = 360 - angle;

        if (angle === 90 && this.manager.abstractRightAngle) {
          vec1 = Vector.scale(vec1, this.size * 2 + textPadding);
          vec2 = Vector.scale(vec2, this.size * 2 + textPadding);
          ctx.moveTo(this.x + vec1.x, this.y + vec2.x);
          ctx.lineTo(this.x + vec1.x + vec2.x, this.y + vec1.y + vec2.y);
          ctx.lineTo(this.x + vec2.x, this.y + vec2.y);
          ctx.stroke();
        } else {
          // get vector inwards of polygon
          let middle = Vector.normalize(Vector.add(vec1, vec2));
          if (Vector.len(middle) === 0) middle = Vector.orthogonal(vec1);
          if (
            Calc.isPointInPolygon(
              Vector.add(this, middle),
              (this.parent as Shape).getPoints()
            ) === this.showOutsideAngle
          )
            middle = Vector.multiply(middle, -1);

          middle = Vector.normalize(middle, this.size + textPadding);
          const textDiagonal = Math.sqrt(metrics.width ** 2 + fontHeight ** 2);

          let radius: number, textX: number, textY: number;
          // outer label
          if (angle < 45) {
            textX = (middle.x + (middle.x > 0 ? 0 : -1) * metrics.width) * -1;
            textY = (middle.y + (middle.y > 0 ? 1 : 0) * fontHeight) * -1;
            radius = 20;
          } else {
            // inner label
            textX = middle.x + (middle.x > 0 ? 0 : -1) * metrics.width;
            textY = middle.y + (middle.y > 0 ? 1 : 0) * fontHeight;
            radius = textPadding + textDiagonal + 5;
          }

          ctx.fillText(label, this.x + textX, this.y + textY);

          ctx.beginPath();
          ctx.arc(
            this.x,
            this.y,
            this.size + radius,
            Vector.angle({ x: 1, y: 0 }, this.showOutsideAngle ? vec1 : vec2),
            Vector.angle({ x: 1, y: 0 }, this.showOutsideAngle ? vec2 : vec1)
          );
          ctx.stroke();
        }
      } else {
        // fallback to simple label
        ctx.clearRect(
          this.x + 10,
          this.y - 30,
          metrics.width + 10,
          fontHeight + 10
        );
        ctx.fillText(label, this.x + 10, this.y - 10);
      }
    }
  }

  getHit(point: MathPoint, point2?: MathPoint): Draggable[] {
    if (this.hidden) return [];
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
    if (!this.parent || !('getLines' in this.parent)) return null;
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

  protected getValueLabel(): string {
    let angle = this.getAngle();
    if (angle === -1) return '';
    if (this.showOutsideAngle) angle = 360 - angle;
    return `${Numbers.round(angle)}°`;
  }

  public getContextMenuItems(): ContextMenuItem[] {
    const res = [
      ...super.getContextMenuItems(),
      ...this.getStyleContextMenuItems({
        stroke: true,
        fill: true,
        lineWidth: true,
        nameList: 'greek'
      })
    ];

    (
      res.find((i) => i.type === 'submenu' && i.key === 'label') as
        | ContextMenuSubmenu
        | undefined
    )?.items.splice(1, 0, {
      key: 'showOutsideAngle',
      type: 'checkbox',
      label: 'Switch angle',
      getChecked: () => this.showOutsideAngle,
      action: (value: boolean) => {
        this.showOutsideAngle = value;
        this.requestRedraw();
      }
    });

    return res;
  }

  public export() {
    return {
      ...super.export(),
      _type: 'point' as const,
      x: this.x,
      y: this.y,
      ...(this.showOutsideAngle && { showOutsideAngle: this.showOutsideAngle })
    };
  }

  public static import(data: BasePoint, manager: Manager) {
    return new Point(manager, data);
  }
}
