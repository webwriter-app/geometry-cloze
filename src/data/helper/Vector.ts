import { MathPoint } from './Calc';

export default class Vector {
  static normalize(point: MathPoint): MathPoint {
    const length = Math.sqrt(point.x ** 2 + point.y ** 2);
    return { x: point.x / length, y: point.y / length };
  }

  static orthogonal(vector: MathPoint): MathPoint {
    return { x: -vector.y, y: vector.x };
  }

  static scale(vector: MathPoint, scale: number): MathPoint {
    return { x: vector.x * scale, y: vector.y * scale };
  }

  static add(vector1: MathPoint, vector2: MathPoint): MathPoint {
    return { x: vector1.x + vector2.x, y: vector1.y + vector2.y };
  }
}
