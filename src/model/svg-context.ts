type Measure = (text: string, font: string) => TextMetrics;

type State = {
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  globalAlpha: number;
  lineDash: number[];
  font: string;
  shadowBlur: number;
  shadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
};

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const round = (value: number) => Math.round(value * 100) / 100;

/**
 * The part of the canvas 2D context that the figure drawing uses, writing SVG
 * elements instead of pixels. Text is measured by the caller's `measure`, so
 * that the layout equals the one on the canvas.
 */
export default class SvgContext {
  fillStyle = '#000000';
  strokeStyle = '#000000';
  globalAlpha = 1;
  shadowBlur = 0;
  shadowColor = 'transparent';
  shadowOffsetX = 0;
  shadowOffsetY = 0;

  private _lineWidth = 1;
  private _font = '10px sans-serif';
  private lineDash: number[] = [];
  private path = '';
  private stack: State[] = [];
  private parts: string[] = [];

  constructor(
    private readonly measure: Measure,
    readonly width: number,
    readonly height: number
  ) {}

  /** As on the canvas, a value that is not positive is ignored. */
  get lineWidth() {
    return this._lineWidth;
  }
  set lineWidth(value: number) {
    if (value > 0 && Number.isFinite(value)) this._lineWidth = value;
  }

  /** A size without a family gets a generic one, so that measuring and drawing agree. */
  get font() {
    return this._font;
  }
  set font(value: string) {
    this._font = /^\s*[\d.]+px\s*$/.test(value) ? `${value.trim()} sans-serif` : value;
  }

  setLineDash(segments: number[]) {
    this.lineDash = segments;
  }

  save() {
    this.stack.push({
      fillStyle: this.fillStyle,
      strokeStyle: this.strokeStyle,
      lineWidth: this._lineWidth,
      globalAlpha: this.globalAlpha,
      lineDash: this.lineDash,
      font: this._font,
      shadowBlur: this.shadowBlur,
      shadowColor: this.shadowColor,
      shadowOffsetX: this.shadowOffsetX,
      shadowOffsetY: this.shadowOffsetY
    });
  }

  restore() {
    const state = this.stack.pop();
    if (state) Object.assign(this, state);
  }

  beginPath() {
    this.path = '';
  }

  moveTo(x: number, y: number) {
    this.path += `M${round(x)} ${round(y)}`;
  }

  lineTo(x: number, y: number) {
    this.path += `L${round(x)} ${round(y)}`;
  }

  closePath() {
    this.path += 'Z';
  }

  /** Clockwise arc as on the canvas; a full turn becomes two half circles. */
  arc(x: number, y: number, radius: number, start: number, end: number) {
    const turn = 2 * Math.PI;
    const sweep = end - start;
    const point = (angle: number) =>
      `${round(x + radius * Math.cos(angle))} ${round(y + radius * Math.sin(angle))}`;
    const command = this.path ? 'L' : 'M';
    if (sweep >= turn - 1e-9) {
      this.path += `${command}${point(start)}A${radius} ${radius} 0 1 1 ${point(start + Math.PI)}A${radius} ${radius} 0 1 1 ${point(start)}`;
      return;
    }
    const delta = ((sweep % turn) + turn) % turn;
    this.path += `${command}${point(start)}A${radius} ${radius} 0 ${delta > Math.PI ? 1 : 0} 1 ${point(start + delta)}`;
  }

  fill() {
    if (!this.path) return;
    this.parts.push(
      `<path d="${this.path}" fill="${escape(this.fillStyle)}"${this.effects()}/>`
    );
  }

  stroke() {
    if (!this.path) return;
    const dash = this.lineDash.length
      ? ` stroke-dasharray="${this.lineDash.join(' ')}"`
      : '';
    this.parts.push(
      `<path d="${this.path}" fill="none" stroke="${escape(this.strokeStyle)}" stroke-width="${this.lineWidth}"${dash}${this.effects()}/>`
    );
  }

  fillText(text: string, x: number, y: number) {
    this.parts.push(
      `<text x="${round(x)}" y="${round(y)}" fill="${escape(this.fillStyle)}"${this.effects(`font:${this.font}`)}>${escape(text)}</text>`
    );
  }

  measureText(text: string) {
    return this.measure(text, this.font);
  }

  private effects(style = '') {
    const opacity = this.globalAlpha === 1 ? '' : ` opacity="${this.globalAlpha}"`;
    const shadow =
      this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY
        ? `filter:drop-shadow(${this.shadowOffsetX}px ${this.shadowOffsetY}px ${this.shadowBlur}px ${this.shadowColor})`
        : '';
    const css = [style, shadow].filter(Boolean).join(';');
    return css ? `${opacity} style="${escape(css)}"` : opacity;
  }

  /** The finished document. */
  toString() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.width} ${this.height}" width="${this.width}" height="${this.height}">${this.parts.join('')}</svg>`;
  }
}
