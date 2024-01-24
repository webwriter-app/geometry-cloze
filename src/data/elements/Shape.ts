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
    for (const BasePoint of pointsArr) {
      const point =
        BasePoint instanceof Point ? BasePoint : new Point(manager, BasePoint);
      if (lastPoint)
        children.push(new Line(manager, { start: lastPoint, end: point }));
      children.push(point);

      lastPoint = point;
    }
    children.push(
      new Line(manager, { start: lastPoint!, end: children[0] as Point })
    );

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

  protected _x: number = 0;
  protected _y: number = 0;

  protected closed = true;

  constructor(
    canvas: CanvasManager,
    children: (BasePoint | BaseLine)[],
    closed = true
  ) {
    super(canvas, {});
    this.closed = children.length >= 3 && closed;
    const childrenElements = children.map((child) => {
      if (child instanceof Line || child instanceof Point) return child;
      if ('start' in child && 'end' in child)
        return new Line(this.manager, child);
      if (child.x !== undefined && child.y !== undefined) {
        return new Point(this.manager, child);
      }
      throw new Error('Invalid child type');
    });
    this.addChild(...childrenElements);
  }

  protected calculateOrigin() {
    const points = this.getPoints();
    const minX = Calc.getExtremePoint(points, 'min', 'x');
    const minY = Calc.getExtremePoint(points, 'min', 'y');
    if (minX) this._x = minX.x;
    if (minY) this._y = minY.y;
  }

  protected addChildAt(child: Element, index: number): void {
    super.addChildAt(child, index);
    this.calculateOrigin();
  }

  protected addChild(...children: Element[]): void {
    super.addChild(...children);
    this.calculateOrigin();
  }

  /**
   * Remove child without checking for shape validity
   */
  protected removeChildUnsafe(child: Element): void {
    super.removeChild(child);
  }

  protected removeChild(child: Element): void {
    super.removeChild(child);
    this.checkShapeValidity();
  }

  public move(coords: {
    x?: number | undefined;
    y?: number | undefined;
    relative: boolean;
  }): void {
    const points = this.getPoints();
    const relativeCoords = coords.relative
      ? coords
      : {
          x: (coords?.x ?? this._x) - this._x,
          y: (coords?.y ?? this._y) - this._y,
          relative: true
        };

    this._x += relativeCoords.x ?? 0;
    this._y += relativeCoords.y ?? 0;

    for (const point of points) {
      point.move(relativeCoords);
    }

    this.requestRedraw();
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
        this.removeChildUnsafe(nearestLine.line);
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
    if (nextLine && nextLine instanceof Line) this.removeChildUnsafe(nextLine);

    const previousLine = this.children[index - 1];
    if (previousLine && previousLine instanceof Line)
      this.removeChildUnsafe(previousLine);

    this.removeChildUnsafe(point);
    this.checkShapeValidity();
  }

  removeLine(line: Line) {
    this.removeChildUnsafe(line);
    this.checkShapeValidity();
  }

  /**
   * Checks is still connected
   */
  private checkShapeValidity() {
    const initialChildren = this.children.slice();
    const shapes: { elements: (Line | Point)[]; closed: boolean }[] = [
      { elements: [], closed: false }
    ];

    // remove all children that are neither points nor lines
    // remove all lines that are not connected to two points
    const filteredChildren = this.children.filter((child, index) => {
      const isLine = child instanceof Line;
      const isPoint = child instanceof Point;
      if (!isLine && !isPoint) return false;
      const isNextALine = this.children[index + 1] instanceof Line;
      const isPreviousALine = this.children[index - 1] instanceof Line;
      if (isLine && (isPreviousALine || isNextALine)) return false;

      return true;
    });

    let startIndex =
      filteredChildren.findIndex((child, index) => {
        const current = child;
        const next = filteredChildren[index + 1];
        if (current instanceof Point && next instanceof Point) return true;
        if (current instanceof Line && next instanceof Line) return true;
        return false;
      }) + 1;

    const sortedChildren = filteredChildren
      .slice(startIndex)
      .concat(filteredChildren.slice(0, startIndex));

    let lastElement: Line | Point | null = null;
    for (const element of sortedChildren as (Line | Point)[]) {
      if (element instanceof Point) {
        if (lastElement instanceof Line) {
          // valid next entry
          shapes.slice(-1)[0].elements.push(element);
        } else {
          shapes.slice(-1)[0].closed = true;
          // two points without connection -> create new shape
          shapes.push({ elements: [element], closed: false });
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
          shapes.push({ elements: [], closed: false });
        }
      }
      lastElement = element;
    }

    const nonEmptyShapes = shapes.filter((shape) => shape.elements.length > 0);
    const self = nonEmptyShapes.pop()!;
    this.closed = self.closed;
    const removedElements = this.children.filter(
      (child) => !self.elements.includes(child as Line | Point)
    );
    for (const element of removedElements) this.removeChildUnsafe(element);

    for (const newShape of nonEmptyShapes) {
      const shape = new Shape(this.manager, newShape.elements, newShape.closed);
      this.manager.addShape(shape);
    }

    console.log('checked shape validity', {
      children: initialChildren,
      sortedChildren,
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
