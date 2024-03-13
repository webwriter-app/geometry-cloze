export default class Numbers {
  static round(number: number, precision: number = 2): string {
    const factor = 10 ** precision;
    const rounded = Math.round(number * factor) / factor;
    const fixed = rounded.toFixed(precision);
    // remove unnecessary trailing zeros
    return fixed.replace(/\.?0+$/, '');
  }
}
