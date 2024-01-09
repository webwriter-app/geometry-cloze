import Calc, { IsAbove } from '../helper/Calc';
import CanvasManager from '../CanvasManager';
import Draggable from './base/Draggable';
import Line from './Line';
import Point from './Point';

export default class Polygon extends Draggable {
  protected _x: number;
  protected _y: number;

  protected _points: Point[];
  protected _lines: Line[] = [];

  constructor(canvas: CanvasManager, points: Point[], active = true) {
    super(canvas, {}, active);
    this._points = [];
    this.addPoint(...points);
    this._x = Calc.getExtremePoint(points, 'min', 'x')?.x ?? 0;
    this._y = Calc.getExtremePoint(points, 'min', 'y')?.y ?? 0;
    this.recreateLines();
  }

  move(coords: { x?: number; y?: number; relative: boolean }): void {
    if (coords.relative) {
      this._x += coords.x ?? 0;
      this._y += coords.y ?? 0;
    } else {
      this._x = coords.x ?? this.x;
      this._y = coords.y ?? this.y;
    }

    const change = coords.relative
      ? coords
      : {
          x: coords.x ? coords.x - this.x : 0,
          y: coords.y ? coords.y - this.y : 0,
          relative: true
        };

    this._points.forEach((point) => point.move(change));

    this.recreateLines();
    this.fireEvent('move', this);
    this.requestRedraw();
  }

  getHit(point: Point, point2?: Point): Draggable[] {
    return super.getHit(point, point2);
  }

  addPoint(...points: Point[]) {
    for (const point of points) {
      const nearestLine = this._lines.reduce(
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
        this._points.push(point);
        this.addChild(point);
      } else {
        const index = this._points.indexOf(nearestLine.line.end);
        if (index === -1) throw new Error('Line end not found in polygon');
        this._points.splice(index, 0, point);
        this.addChildAt(point, index);
      }
    }
    this.recreateLines();
    this.requestRedraw();
  }

  removePoint(point: Point) {
    this._points = this._points.filter((p) => p !== point);
    this.removeChild(point);
    this.recreateLines();
    this.requestRedraw();
  }

  private recreateLines() {
    this._lines.forEach((line) => {
      line.delete();
      this.removeChild(line);
    });
    this._lines = [];

    const lines = [];

    for (let i = 0; i < this._points.length - 1; i++) {
      const line = new Line(this.manager, this._points[i], this._points[i + 1]);
      lines.push(line);
    }
    if (this._points.length > 2)
      lines.push(
        new Line(this.manager, this._points[0], this._points.slice(-1)[0])
      );

    this._lines = lines;
    this.addChild(...lines);

    return lines;
  }

  public recreateAsValidShape() {
    this._lines.forEach((line) => {
      line.delete();
      this.removeChild(line);
    });
    this._lines = [];

    /**
     * Algorithm:
     *
     * Find the leftmost point p
     * Find the rightmost point q
     * Partition the points into set above and below line
     * Sort sets by x coordinate
     * [p, ...above, q, ...below, p] -> connect from left to right
     */

    const p = Calc.getExtremePoint(this._points, 'min', 'x');
    const q = Calc.getExtremePoint(this._points, 'max', 'x');

    // if no points or only one point, no lines
    if (!p || !q || p === q) return [];

    let above: Point[] = [];
    let below: Point[] = [];

    const line = { start: p, end: q };
    for (const point of this._points) {
      if (point === p || point === q) continue;
      if (Calc.isPointAboveLine(line, point) >= IsAbove.Above)
        above.push(point);
      else below.push(point);
    }

    // sort above by x
    above = above.sort((a, b) => a.x - b.x);
    // sort below by x
    below = below.sort((a, b) => a.x - b.x);

    const orderedPoints = [p, ...above, q, ...below, p];

    const lines = [];

    for (let i = 0; i < orderedPoints.length - 1; i++) {
      const line = new Line(
        this.manager,
        orderedPoints[i],
        orderedPoints[i + 1]
      );
      lines.push(line);
    }

    this._lines = lines;
    this.addChild(...lines);

    return lines;
  }

  draw(): void {
    this.ctx.strokeStyle = 'transparent';
    this.ctx.fillStyle = this.fill;
    this.ctx.beginPath();
    const lastPoint = this._points.slice(-1)[0];
    if (!lastPoint) return;
    this.ctx.moveTo(lastPoint.x, lastPoint.y);
    for (const point of this._points) {
      this.ctx.lineTo(point.x, point.y);
    }
    this.ctx.closePath();
    this.ctx.fill();
    super.draw();
  }
}
