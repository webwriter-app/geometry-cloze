import Calc, { IsAbove } from './Calc';
import CanvasManager from './CanvasManager';
import Debouncer from './Debouncer';
import Draggable from './Draggable';
import Line from './Line';
import Point from './Point';

export default class Polygon extends Draggable {
  protected _x: number;
  protected _y: number;

  protected _points: Point[];
  protected _lines: Line[] = [];

  constructor(canvas: CanvasManager, points: Point[], active = true) {
    super(canvas, {}, active);
    this._points = points;
    this.addPoint(...points);
    this._x = Calc.getExtremePoint(points, 'min', 'x')?.x ?? 0;
    this._y = Calc.getExtremePoint(points, 'min', 'y')?.y ?? 0;
    this.recreateLines();
  }

  private debouncer = new Debouncer(this.recreateLines.bind(this), 100, 400);
  private onMove() {
    this.debouncer.call();
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

  getHit(point: Point): Draggable | null {
    return super.getHit(point);
  }

  addPoint(...points: Point[]) {
    this._points.push(...points);
    this.addChild(...points);
    points.forEach((point) =>
      point.addEventListener('move', this.onMove.bind(this))
    );
    this.recreateLines();
    this.requestRedraw();
  }

  removePoint(point: Point) {
    this._points = this._points.filter((p) => p !== point);
    this.removeChild(point);
    point.removeEventListener('move', this.onMove.bind(this));
    this.recreateLines();
    this.requestRedraw();
  }

  private recreateLines() {
    // check if lines intersect -> if they don't, we're done
    // if they do, remove all lines and recreate
    const intersectingLines = this._lines.filter((line) =>
      this._lines.some(
        (otherLine) =>
          line !== otherLine && Calc.doLinesIntersect(line, otherLine, true)
      )
    );
    // if (intersectingLines.length === 0) return;
    // TODO: potential improvement -> only remove lines that intersect

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
}
