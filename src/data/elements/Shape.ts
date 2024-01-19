import Calc from '../helper/Calc';
import CanvasManager from '../CanvasManager';
import Draggable from './base/Draggable';
import Line, { BaseLine } from './Line';
import Point, { BasePoint } from './Point';
import { ContextMenuItem } from '/types/ContextMenu';
import Element from './base/Element';

export default class Shape extends Draggable {
  static createPolygon(manager: CanvasManager, points: BasePoint[]): Shape;
  static createPolygon(manager: CanvasManager, ...points: BasePoint[]): Shape;
  static createPolygon(
    manager: CanvasManager,
    ...points: [BasePoint[]] | BasePoint[]
  ): Shape {
    let pointsArr: BasePoint[];
    if (Array.isArray(points[0])) pointsArr = points[0];
    else pointsArr = points as BasePoint[];
    if (pointsArr.length < 3)
      throw new Error("Can't create polygon with less than three points");
    const children: (BasePoint | BaseLine)[] = [];
    let lastPoint: Point | null = null;
    pointsArr.push(pointsArr[0]);
    for (const BasePoint of pointsArr) {
      const point =
        BasePoint instanceof Point ? BasePoint : new Point(manager, BasePoint);
      if (lastPoint)
        children.push(new Line(manager, { start: lastPoint, end: point }));
      children.push(point);

      lastPoint = point;
    }

    return new Shape(manager, children, true);
  }

  static createPoint(manager: CanvasManager, point: BasePoint) {
    const pointElement =
      point instanceof Point ? point : new Point(manager, point);
    return new Shape(manager, [pointElement], false);
  }

  static createLine(manager: CanvasManager, line: BaseLine) {
    const start = new Point(manager, line.start);
    const end = new Point(manager, line.end);
    const lineElement =
      line instanceof Line ? line : new Line(manager, { start, end });
    return new Shape(manager, [start, lineElement, end], false);
  }

  protected _x: number;
  protected _y: number;

  protected closed = true;

  constructor(
    canvas: CanvasManager,
    children: (BasePoint | BaseLine)[],
    closed = true
  ) {
    super(canvas, {});
    this.closed = children.length >= 3 && closed;
    let minX = Infinity;
    let minY = Infinity;
    const childrenElements = children.map((child) => {
      if (child instanceof Line || child instanceof Point) return child;
      if ('start' in child && 'end' in child)
        return new Line(this.manager, child);
      if ('x' in child && 'y' in child) {
        minX = Math.min(minX, child.x);
        minY = Math.min(minY, child.y);
        return new Point(this.manager, child);
      }
      throw new Error('Invalid child type');
    });
    this.addChild(...childrenElements);
    this._x = minX;
    this._y = minY;
  }

  protected removeChild(child: Element): void {
    super.removeChild(child);
    this.checkShapeValidity();
  }

  getPoints() {
    return this.children.filter((child) => child instanceof Point) as Point[];
  }

  getLines() {
    return this.children.filter((child) => child instanceof Line) as Line[];
  }

  getHit(point: Point, point2?: Point): Draggable[] {
    const res: Draggable[] = [];
    const edgeHits = super.getHit(point, point2);
    if (!point2 && edgeHits.length > 0) return edgeHits;
    res.push(...edgeHits);

    if (this.closed && Calc.isPointInPolygon(point, this.getPoints()))
      res.push(this);

    return res;
  }

  addPoint(...points: BasePoint[]) {
    const pointElements = points.map((p) => new Point(this.manager, p));
    const ownPoints = this.getPoints();
    for (const point of pointElements) {
      const nearestLine = this.getLines().reduce(
        (nearest, curr) => {
          const dist = Calc.distance(curr, point);
          if (dist >= nearest.dist) return nearest;
          return { dist, line: curr };
        },
        { dist: Infinity, line: null } as {
          dist: number;
          line: Line | null;
        }
      );

      if (!nearestLine.line) {
        this.addChild(
          new Line(this.manager, { start: ownPoints.slice(-1)[0], end: point }),
          point
        );
      } else {
        const lineIndex = this.children.indexOf(nearestLine.line);
        const start = this.children[lineIndex - 1];
        const end = this.children[lineIndex + 1];
        if (
          !start ||
          !end ||
          !(start instanceof Point) ||
          !(end instanceof Point)
        )
          continue;
        const line1 = new Line(this.manager, { start, end: point });
        const line2 = new Line(this.manager, { start: point, end });
        this.removeChild(nearestLine.line);
        this.addChildAt(line2, lineIndex);
        this.addChildAt(point, lineIndex);
        this.addChildAt(line1, lineIndex);
      }
    }
    this.requestRedraw();
  }

  removePoint(point: Point) {
    const index = this.children.findIndex((ele) => ele === point);
    if (index === -1) return;

    const nextLine = this.children[index + 1];
    if (nextLine && nextLine instanceof Line) this.removeChild(nextLine);

    const previousLine = this.children[index - 1];
    if (previousLine && previousLine instanceof Line)
      this.removeChild(previousLine);

    this.removeChild(point);
    this.checkShapeValidity();
  }

  removeLine(line: Line) {
    this.removeChild(line);
    this.checkShapeValidity();
  }

  /**
   * Checks is still connected
   */
  private checkShapeValidity() {
    const initialChildren = this.children.slice();
    const shapes: { elements: (Line | Point)[] }[] = [{ elements: [] }];
    let lastElement: Line | Point | null = null;
    for (const element of this.children as (Line | Point)[]) {
      if (element instanceof Point) {
        if (lastElement instanceof Line) {
          // valid next entry
          shapes.slice(-1)[0].elements.push(element);
        } else {
          // two points without connection -> create new shape
          shapes.push({ elements: [element] });
        }
      } else if (element instanceof Line) {
        if (lastElement instanceof Point) {
          // valid shape
          shapes.slice(-1)[0].elements.push(element);
        } else {
          // two lines without endpoint -> delete both
          // check if last added element is a line
          if (shapes.slice(-1)[0].elements instanceof Line)
            shapes.slice(-1)[0].elements.pop();
          // dont add current line
          // start new shape
          shapes.push({ elements: [] });
        }
      }
      lastElement = element;
    }
    const nonEmptyShapes = shapes.filter((shape) => shape.elements.length > 0);
    const self = nonEmptyShapes.pop()!;
    const removedElements = this.children.filter(
      (child) => !self.elements.includes(child as Line | Point)
    );
    for (const element of removedElements) this.removeChild(element);

    for (const newShapes of nonEmptyShapes) {
      const shape = new Shape(this.manager, newShapes.elements);
      this.manager.addShape(shape);
    }

    console.log('checked shape validity', {
      children: initialChildren,
      shapes: nonEmptyShapes
    });

    this.requestRedraw();
  }

  draw(): void {
    this.ctx.strokeStyle = 'transparent';
    this.ctx.fillStyle = this.fill;
    this.ctx.beginPath();
    const points = this.getPoints();
    const lastPoint = points.slice(-1)[0] as Point | undefined;
    if (!lastPoint) return;
    this.ctx.moveTo(lastPoint.x, lastPoint.y);
    for (const point of points) {
      this.ctx.lineTo(point.x, point.y);
    }
    this.ctx.closePath();
    this.ctx.fill();
    super.draw();
  }

  public getContextMenuItems(): ContextMenuItem[] {
    return [
      ...super.getContextMenuItems(),
      ...this.getStyleContextMenuItems({ fill: true })
    ];
  }
}
