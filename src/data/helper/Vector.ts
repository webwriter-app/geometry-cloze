import { MathPoint } from './Calc';

export default class Vector {
  static normalize(point: MathPoint, toLength = 1): MathPoint {
    const length = Vector.len(point);
    if (length === 0) return { x: 0, y: 0 };
    return {
      x: (point.x / length) * toLength,
      y: (point.y / length) * toLength
    };
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

  static subtract(vector1: MathPoint, vector2: MathPoint): MathPoint {
    return { x: vector1.x - vector2.x, y: vector1.y - vector2.y };
  }

  static multiply(vector: MathPoint, scalar: number): MathPoint {
    return { x: vector.x * scalar, y: vector.y * scalar };
  }

  static angle(vector1: MathPoint, vector2: MathPoint): number {
    return Math.atan2(vector2.y, vector2.x) - Math.atan2(vector1.y, vector1.x);
  }

  static len(vector: MathPoint): number {
    return Math.sqrt(vector.x ** 2 + vector.y ** 2);
  }
}
