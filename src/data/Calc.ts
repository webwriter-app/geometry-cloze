import Line from './Line';
import Point from './Point';

export type MathPoint = Pick<Point, 'x' | 'y'>;

export default class Calc {
  static distance(line: Line, point: MathPoint): number;
  static distance(point1: MathPoint, point2: MathPoint): number;

  static distance(obj1: MathPoint | Line, obj2: MathPoint) {
    if (obj1 instanceof Line) return this.distanceLinePoint(obj1, obj2);
    else return this.distancePointPoint(obj1, obj2);
  }

  private static distanceLinePoint(line: Line, point: MathPoint) {
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
}
