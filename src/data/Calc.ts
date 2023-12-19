import Point from './Point';

export type MathPoint = Pick<Point, 'x' | 'y'>;
export type MathLine = {
  start: MathPoint;
  end: MathPoint;
};

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
    points: Point[],
    extreme: 'max' | 'min',
    axis: 'x' | 'y'
  ): Point | null {
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
}
