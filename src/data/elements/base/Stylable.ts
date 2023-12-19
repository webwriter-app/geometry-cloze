import CanvasManager from '../../CanvasManager';
import Element from './Element';

export interface StylableData {
  lineWidth?: number;
  size?: number;
  stroke?: string;
  fill?: string;
  shadow?: boolean;
}

export default class Stylable extends Element {
  private _lineWidth: number;
  private _size: number;
  private _stroke: string;
  private _fill: string;
  private _shadow: boolean;

  constructor(canvas: CanvasManager, data: StylableData = {}) {
    super(canvas);
    this._lineWidth = data.lineWidth || 3;
    this._size = data.size || 10;
    this._stroke = data.stroke || 'black';
    this._fill = data.fill || 'transparent';
    this._shadow = data.shadow || false;

    this.addEventListener('style-change', this.requestRedraw.bind(this));
  }

  draw() {
    super.draw();
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = this.stroke;
    this.ctx.fillStyle = this.fill;

    this.ctx.shadowBlur = this.shadow ? 5 : 0;
    this.ctx.shadowColor = this.shadow ? '#000000b0' : 'transparent';
    this.ctx.shadowOffsetX = this.shadow ? 5 : 0;
    this.ctx.shadowOffsetY = this.shadow ? 5 : 0;
  }

  setLineWidth(newLineWidth: number | null) {
    const newValue = newLineWidth ?? 3;
    const hasChanges = newValue !== this._lineWidth;
    this._lineWidth = newValue;
    if (hasChanges) this.fireEvent('style-change');
  }
  get lineWidth() {
    return this._lineWidth;
  }

  setSize(size: number | null) {
    const newValue = size ?? 10;
    const hasChanges = newValue !== this._size;
    this._size = newValue;
    if (hasChanges) this.fireEvent('style-change');
  }
  get size() {
    return this._size;
  }

  setStroke(stroke: string | null) {
    const newValue = stroke ?? 'transparent';
    const hasChanges = newValue !== this._stroke;
    this._stroke = newValue;
    if (hasChanges) this.fireEvent('style-change');
  }
  get stroke() {
    return this._stroke;
  }

  setFill(fill: string | null) {
    const newValue = fill ?? 'transparent';
    const hasChanges = newValue !== this._fill;
    this._fill = newValue;
    if (hasChanges) this.fireEvent('style-change');
  }
  get fill() {
    return this._fill;
  }

  setShadow(shadow: boolean | null) {
    const newValue = shadow ?? false;
    const hasChanges = newValue !== this._shadow;
    this._shadow = newValue;
    if (hasChanges) this.fireEvent('style-change');
  }
  get shadow() {
    return this._shadow;
  }
}
