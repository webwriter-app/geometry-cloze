import Calc, { MathPoint } from '../helper/Calc';
import Draggable from './base/Draggable';
import Line, { BaseLine } from './Line';
import Point, { BasePoint } from './Point';
import { ContextMenuItem } from '/types/ContextMenu';
import Element from './base/Element';
import InteractionManager from '../CanvasManager/InteractionManager';
import Arrays from '../helper/Arrays';

export default class Shape extends Draggable {
  static createPolygon(manager: InteractionManager, points: BasePoint[]): Shape;
  static createPolygon(
    manager: InteractionManager,
    ...points: BasePoint[]
  ): Shape;
  static createPolygon(
    manager: InteractionManager,
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

  static createPoint(manager: InteractionManager, point: BasePoint) {
    const pointElement =
      point instanceof Point ? point : new Point(manager, point);
    return new Shape(manager, [pointElement], false);
  }

  static createLine(manager: InteractionManager, line: BaseLine) {
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
    canvas: InteractionManager,
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
    if (child instanceof Point) this.removePoint(child);
    else if (child instanceof Line) this.removeLine(child);
    else super.removeChild(child);
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

    this.fireEvent('move');
    this.requestRedraw();
  }

  getPoints() {
    return this.children.filter((child) => child instanceof Point) as Point[];
  }

  getLines() {
    return this.children.filter((child) => child instanceof Line) as Line[];
  }

  getHit(point: MathPoint, point2?: MathPoint): Draggable[] {
    const res: Draggable[] = [];
    // points should be first, since they have higher priority to be selected
    const hits = super.getHit(point, point2).sort((a, b) => {
      if (a instanceof Point) return b instanceof Point ? 0 : -10;
      else return b instanceof Point ? 10 : 0;
    });
    if (!point2 && hits.length > 0) return hits;
    res.push(...hits);

    if (this.closed && Calc.isPointInPolygon(point, this.getPoints()))
      res.unshift(this);

    return res;
  }

  addPoint(basePoint: BasePoint, to?: Point): Point | null {
    const point = new Point(this.manager, basePoint);
    const ownPoints = this.getPoints();

    if (to) {
      if (!this.hasChild(to)) return null;
      if (this.closed) return null;
      if (!this.isEndPoint(to)) return null;
    }

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

    // if shape is not closed we check if the point is on a line otherwise we connect to the nearest endpoint
    if (!nearestLine.line) {
      this.addChild(
        new Line(this.manager, { start: ownPoints.slice(-1)[0], end: point }),
        point
      );
    } else if (this.closed || nearestLine.dist < 2) {
      const lineIndex = this.children.indexOf(nearestLine.line);
      const start = Arrays.at(this.children, lineIndex - 1);
      const end = Arrays.at(this.children, lineIndex + 1);
      if (
        !start ||
        !end ||
        !(start instanceof Point) ||
        !(end instanceof Point)
      )
        return null;
      const line1 = new Line(this.manager, { start, end: point });
      const line2 = new Line(this.manager, { start: point, end });
      this.removeChildUnsafe(nearestLine.line);
      this.addChildAt(line2, lineIndex);
      this.addChildAt(point, lineIndex);
      this.addChildAt(line1, lineIndex);
    } else {
      const nearestEndPoint =
        to ??
        [ownPoints[0], Arrays.at(ownPoints, -1)!].reduce(
          (nearest, curr) => {
            const dist = Calc.distance(curr, point);
            if (dist >= nearest.dist) return nearest;
            return { dist, point: curr };
          },
          { dist: Infinity, point: null } as {
            dist: number;
            point: Point | null;
          }
        ).point;

      const line = new Line(this.manager, {
        start: nearestEndPoint!,
        end: point
      });

      const isStart = nearestEndPoint === ownPoints[0];
      if (isStart) this.resortChildren((children) => children.reverse());
      this.addChild(line);
      this.addChild(point);
    }
    this.requestRedraw();
    return point;
  }

  removePoint(point: Point) {
    const index = this.children.findIndex((ele) => ele === point);
    if (index === -1) return;

    const nextIndex = (index + 1 + this.children.length) % this.children.length;
    const nextLine = this.children[nextIndex];
    if (nextLine && nextLine instanceof Line) this.removeChildUnsafe(nextLine);

    const previousIndex =
      (index - 1 + this.children.length) % this.children.length;
    const previousLine = this.children[previousIndex];
    if (previousLine && previousLine instanceof Line)
      this.removeChildUnsafe(previousLine);

    if (
      previousLine &&
      nextLine &&
      previousLine instanceof Line &&
      nextLine instanceof Line &&
      this.children.length >= 5 // at least three points and two lines
    ) {
      const start = previousLine.start;
      const end = nextLine.end;
      // check if these points are already connected
      const newLine = new Line(this.manager, {
        start,
        end
      });
      this.addChildAt(newLine, previousIndex);
    }

    this.removeChildUnsafe(point);
    this.checkShapeValidity();
  }

  connectPoints(point1: Point, point2: Point) {
    if (this.closed) return;
    const start = this.children.indexOf(point1);
    const end = this.children.indexOf(point2);
    const lastIndex = this.children.length - 1;
    // cant connect anything but the endpoints
    if (
      !(start === 0 && end === lastIndex) &&
      !(start === lastIndex && end === 0)
    )
      return;

    // if shape is only two points that are already connected, we dont need to do anything
    // lastIndex is 2 since 0 is the first point and 1 is the line
    if (lastIndex === 2) return;

    const line = new Line(this.manager, { start: point1, end: point2 });
    this.addChild(line);
    this.closed = true;
    this.checkShapeValidity();
    this.requestRedraw();
  }

  removeLine(line: Line) {
    const index = this.children.indexOf(line);
    this.removeChildUnsafe(line);
    // resort children, so that the new formed gap is now at the start + end
    const start = this.children.slice(index);
    const end = this.children.slice(0, index);
    const sortedChildren = start.concat(end);
    this.resortChildren(() => sortedChildren);
    this.closed = false;
    this.checkShapeValidity();
  }

  isEndPoint(point: Point) {
    if (this.closed) return false;
    return this.children[0] === point || Arrays.at(this.children, -1) === point;
  }

  /**
   * Checks is still connected
   */
  private checkShapeValidity() {
    const shapes: { elements: (Line | Point)[]; closed: boolean }[] = [];

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

    // sort children so that when shape is a line, that the point where it is split is at the end
    const sortedChildren = filteredChildren
      .slice(startIndex)
      .concat(filteredChildren.slice(0, startIndex));

    let lastElement: Line | Point | null = null;
    for (const element of sortedChildren as (Line | Point)[]) {
      const currentShape = shapes.slice(-1)[0];

      if (lastElement instanceof Point) {
        if (element instanceof Point) {
          // to points without connection -> new shape
          shapes.push({ elements: [element], closed: false });
        }

        if (element instanceof Line) {
          if (element.isEndpoint(lastElement)) {
            // valid shape
            currentShape.elements.push(element);
          } else {
            // not connected to last point -> new shape
            // but shape cant start with a line, so we create an empty shape
            shapes.push({ elements: [], closed: false });
          }
        }
      }

      if (lastElement instanceof Line) {
        if (element instanceof Point) {
          if (lastElement.isEndpoint(element)) {
            // valid shape
            currentShape.elements.push(element);
          } else {
            // since last shape is now finished, we can check if it is closed
            currentShape.closed = lastElement.isEndpoint(
              currentShape.elements[0]
            );
            // not connected to last line -> new shape
            shapes.push({ elements: [element], closed: false });
          }
        }

        if (element instanceof Line) {
          // since last shape is now finished, we can check if it is closed
          currentShape.closed = lastElement.isEndpoint(
            currentShape.elements[0]
          );
          // two lines without point -> new shape
          // but shape cant start with a line, so we create an empty shape
          shapes.push({ elements: [], closed: false });
        }
      }

      if (!lastElement) {
        if (element instanceof Point) {
          // create new shape
          shapes.push({ elements: [element], closed: false });
        }
      }

      const newesetShapeElement = shapes.slice(-1)[0].elements.slice(-1)[0];
      lastElement = newesetShapeElement ?? null;
    }

    const nonEmptyShapes = shapes.filter((shape) => shape.elements.length > 0);
    const self = nonEmptyShapes.pop();
    if (!self) {
      this.delete();
      return;
    }
    this.closed = self.closed;
    const removedElements = this.children.filter(
      (child) => !self.elements.includes(child as Line | Point)
    );
    for (const element of removedElements) this.removeChildUnsafe(element);

    for (const newShape of nonEmptyShapes) {
      const shape = new Shape(this.manager, newShape.elements, newShape.closed);
      this.manager.addShape(shape);
    }

    this.requestRedraw();
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.closed) {
      ctx.strokeStyle = 'transparent';
      ctx.fillStyle = this.fill;
      ctx.beginPath();
      const points = this.getPoints();
      const lastPoint = points.slice(-1)[0] as Point | undefined;
      if (!lastPoint) return;
      ctx.moveTo(lastPoint.x, lastPoint.y);
      for (const point of points) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.closePath();
      ctx.fill();
    }

    super.draw(ctx);
  }

  public getContextMenuItems(): ContextMenuItem[] {
    return [
      ...super.getContextMenuItems(),
      ...this.getStyleContextMenuItems({ fill: true })
    ];
  }

  public connect(shape: Shape, point: Point, to: Point) {
    // cannot connect when shape is already closed
    if (this.closed || shape.closed) return;
    if (shape === this) return this.connectPoints(point, to);

    if (Arrays.at(this.children, -1) !== point) {
      if (this.children[0] === point)
        this.resortChildren((children) => children.reverse());
      else {
        // cant connect to this point since it is not an endpoint
        return;
      }
    }

    const newChildren = shape.children.slice(); // copy the array
    if (newChildren[0] !== to) {
      if (Arrays.at(newChildren, -1) === to) newChildren.reverse();
      else {
        // cant connect to this point since it is not an endpoint
        return;
      }
    }

    const line = new Line(this.manager, { start: point, end: to });
    this.addChild(line);

    shape.delete();

    this.addChild(...newChildren);
  }

  public export() {
    return {
      ...super.export(),
      closed: this.closed
    };
  }

  public static import(
    data: ReturnType<Shape['export']>,
    manager: InteractionManager
  ) {
    const children = data.children
      .map((child) => {
        if (child._type === 'point') return Point.import(child as any, manager);
        if (child._type === 'line') return Line.import(child as any, manager);
        if (child._type === 'element') return null;
        throw new Error('Invalid child type');
      })
      .filter(Boolean) as (Point | Line)[];
    return new Shape(manager, children, data.closed);
  }
}
