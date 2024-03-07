export type MathPoint = { x: number; y: number };
export type MathLine = {
  start: MathPoint;
  end: MathPoint;
};
export type MathRect = { x1: number; y1: number; x2: number; y2: number };

export enum IsAbove {
  Above = 1,
  On = 0,
  Below = -1
}

export default class Calc {
  /**
   * Calculate the distance between a line and a point
   */
  static distance(line: MathLine, point: MathPoint): number;
  /**
   * Calculate the distance between two points
   */
  static distance(point1: MathPoint, point2: MathPoint): number;

  static distance(obj1: MathPoint | MathLine, obj2: MathPoint) {
    if ('start' in obj1) return this.distanceLinePoint(obj1, obj2);
    else return this.distancePointPoint(obj1, obj2);
  }

  private static distanceLinePoint(line: MathLine, point: MathPoint) {
    const { x: x1, y: y1 } = line.start;
    const { x: x2, y: y2 } = line.end;
    const { x: x3, y: y3 } = point;

    const px = x2 - x1;
    const py = y2 - y1;

    let u = ((x3 - x1) * px + (y3 - y1) * py) / (px ** 2 + py ** 2);

    u = Math.max(0, Math.min(1, u));

    const x = x1 + u * px;
    const y = y1 + u * py;

    const dx = x - x3;
    const dy = y - y3;

    const dist = Math.sqrt(dx * dx + dy * dy);

    return dist;
  }

  private static distancePointPoint(point1: MathPoint, point2: MathPoint) {
    return Math.sqrt(
      Math.abs((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2)
    );
  }

  /**
   * Get the point with the extreme value of a given axis
   */
  static getExtremePoint(
    points: MathPoint[],
    extreme: 'max' | 'min',
    axis: 'x' | 'y'
  ): MathPoint | null {
    const compare = extreme === 'max' ? Math.max : Math.min;
    return (
      points.reduce((extremePoint, point) =>
        compare(extremePoint[axis], point[axis]) === extremePoint[axis]
          ? extremePoint
          : point
      ) ?? null
    );
  }

  /**
   * Calculate if a point is above a line
   */
  static isPointAboveLine(line: MathLine, point: MathPoint): IsAbove {
    const { x: x1, y: y1 } = line.start;
    const { x: x2, y: y2 } = line.end;
    const { x: x3, y: y3 } = point;

    const d = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
    if (d > 0) return IsAbove.Above;
    if (d < 0) return IsAbove.Below;
    return IsAbove.On;
  }

  /**
   * Calculate if a point is in a rect
   */
  static isInRect(rect: MathRect, point: MathPoint): boolean;
  /**
   * Calculate if a line touches a rect
   */
  static isInRect(rect: MathRect, line: MathLine): boolean;
  /**
   * Calculate if a point or line touches a rect
   */
  static isInRect(rect: MathRect, obj: MathPoint | MathLine) {
    if ('start' in obj) return this.isLineInRect(rect, obj);
    else return this.isPointInRect(rect, obj);
  }
  static isPointInRect(rect: MathRect, point: MathPoint) {
    return (
      point.x >= rect.x1 &&
      point.x <= rect.x2 &&
      point.y >= rect.y1 &&
      point.y <= rect.y2
    );
  }
  /**
   * Check if the line touches the rect
   */
  private static isLineInRect(rect: MathRect, line: MathLine) {
    // if the line touches the rect, it must cross one of the rect's sides or be completely inside the rect
    const left = this.getLinePositionAtX(line, rect.x1);
    const right = this.getLinePositionAtX(line, rect.x2);
    const top = this.getLinePositionAtY(line, rect.y1);
    const bottom = this.getLinePositionAtY(line, rect.y2);

    const lineMinX = Math.min(line.start.x, line.end.x);
    const lineMaxX = Math.max(line.start.x, line.end.x);
    const lineMinY = Math.min(line.start.y, line.end.y);
    const lineMaxY = Math.max(line.start.y, line.end.y);

    if (
      left > rect.y1 &&
      left < rect.y2 &&
      lineMinX < rect.x1 &&
      lineMaxX > rect.x1
    )
      return true;
    if (
      right > rect.y1 &&
      right < rect.y2 &&
      lineMinX < rect.x2 &&
      lineMaxX > rect.x2
    )
      return true;
    if (
      top > rect.x1 &&
      top < rect.x2 &&
      lineMinY < rect.y1 &&
      lineMaxY > rect.y1
    )
      return true;
    if (
      bottom > rect.x1 &&
      bottom < rect.x2 &&
      lineMinY < rect.y2 &&
      lineMaxY > rect.y2
    )
      return true;
    if (this.isPointInRect(rect, line.start)) return true;
    if (this.isPointInRect(rect, line.end)) return true;
    return false;
  }

  private static getLinePositionAtX(line: MathLine, x: number): number {
    const { x: x1, y: y1 } = line.start;
    const { x: x2, y: y2 } = line.end;
    return ((x - x1) * (y2 - y1)) / (x2 - x1) + y1;
  }
  private static getLinePositionAtY(line: MathLine, y: number): number {
    const { x: x1, y: y1 } = line.start;
    const { x: x2, y: y2 } = line.end;
    return ((y - y1) * (x2 - x1)) / (y2 - y1) + x1;
  }

  static isPointInPolygon(point: MathPoint, polygon: MathPoint[]): boolean {
    const x = point.x;
    const y = point.y;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }

  static getAreaOfPolygon(polygon: MathPoint[]): number {
    // calculate area of all subtriangles
    const rootPoint = polygon.shift();
    if (!rootPoint) return 0;
    let lastPoint = polygon.shift();
    if (!lastPoint) return 0;
    let area = 0;
    for (const point of polygon) {
      area += this.getAreaOfTriangle(rootPoint, lastPoint, point);
      lastPoint = point;
    }

    return area;
  }

  static getAreaOfTriangle(
    p1: MathPoint,
    p2: MathPoint,
    p3: MathPoint
  ): number {
    return (
      Math.abs(
        (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2
      ) || 0
    );
  }

  static getPerimeterOfPolygon(polygon: MathPoint[]): number {
    let perimeter = 0;
    let lastPoint = polygon.shift();
    if (!lastPoint) return 0;
    for (const point of polygon) {
      perimeter += Calc.distance(lastPoint, point);
      lastPoint = point;
    }
    return perimeter;
  }
}
