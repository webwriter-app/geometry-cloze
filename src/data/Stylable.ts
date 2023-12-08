import Element from './Element';

export interface StylableData {
  lineWidth?: number;
  size?: number;
  stroke?: string;
  fill?: string;
}

export default class Stylable extends Element {
  private _lineWidth: number;
  private _size: number;
  private _stroke: string;
  private _fill: string;

  constructor(canvas: HTMLCanvasElement, data: StylableData = {}) {
    super(canvas);
    this._lineWidth = data.lineWidth || 1;
    this._size = data.size || 5;
    this._stroke = data.stroke || 'black';
    this._fill = data.fill || 'transparent';
    this.addEventListener('style-change', this.requestRedraw.bind(this));
  }

  draw() {
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = this.stroke;
    this.ctx.fillStyle = this.fill;
  }

  setLineWidth(newLineWidth: number | null) {
    this._lineWidth = newLineWidth ?? 1;
    this.fireEvent('style-change');
  }
  get lineWidth() {
    return this._lineWidth;
  }

  setSize(size: number | null) {
    this._size = size ?? 5;
    this.fireEvent('style-change');
  }
  get size() {
    return this._size;
  }

  setStroke(stroke: string | null) {
    this._stroke = stroke ?? 'transparent';
    this.fireEvent('style-change');
  }
  get stroke() {
    return this._stroke;
  }

  setFill(fill: string | null) {
    this._fill = fill ?? 'transparent';
    this.fireEvent('style-change');
  }
  get fill() {
    return this._fill;
  }
}
