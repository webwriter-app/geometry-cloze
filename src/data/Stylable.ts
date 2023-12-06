import Element from './Element';

export interface StylableData {
  size?: number;
  stroke?: string;
  fill?: string;
}

export default class Stylable extends Element {
  private _size: number;
  private _stroke: string;
  private _fill: string;

  constructor(canvas: HTMLCanvasElement, data: StylableData = {}) {
    super(canvas);
    this._size = data.size || 1;
    this._stroke = data.stroke || 'black';
    this._fill = data.fill || 'transparent';
    this.addEventListener('style-change', this.draw.bind(this));
  }

  draw() {
    this.ctx.lineWidth = this.size;
    this.ctx.strokeStyle = this.stroke;
    this.ctx.fillStyle = this.fill;
  }

  set size(size: number) {
    this._size = size;
    this.fireEvent('style-change');
  }
  get size() {
    return this._size;
  }

  set stroke(stroke: string) {
    this._stroke = stroke;
    this.fireEvent('style-change');
  }
  get stroke() {
    return this._stroke;
  }

  set fill(fill: string) {
    this._fill = fill;
    this.fireEvent('style-change');
  }
  get fill() {
    return this._fill;
  }
}
