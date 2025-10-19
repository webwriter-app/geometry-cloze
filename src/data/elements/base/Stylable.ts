import Manager from '../../CanvasManager/Abstracts';
import SHOELACE, { hslToHex } from '../../helper/Shoelace';
import Element, { NamedElement } from './Element';
import { msg } from '@lit/localize';

export interface StylableData {
  lineWidth?: number;
  size?: number;
  stroke?: string;
  fill?: string;
  shadow?: boolean;
  labelColor?: string;
  showLabel?: boolean;
  labelStyle?: 'value' | 'name';
  labelName?: string;
  dashed?: boolean;
}

export const DEFAULT_STYLE = {
  lineWidth: 3,
  size: 10,
  stroke: hslToHex(SHOELACE.color.gray[950]),
  fill: 'transparent',
  shadow: false,
  showLabel: false,
  labelColor: hslToHex(SHOELACE.color.gray[950]),
  labelStyle: 'value',
  labelName: '',
  dashed: false
} as const;

export default class Stylable extends Element {
  protected get defaultStyle() {
    return DEFAULT_STYLE;
  }

  private _lineWidth: number;
  private _size: number;
  private _stroke: string;
  private _fill: string;
  private _shadow: boolean;
  private _showLabel: boolean;
  private _labelColor: string;
  private _labelStyle: 'value' | 'name';
  private _labelName: string;
  private _dashed: boolean;

  constructor(manager: Manager, data: StylableData & NamedElement = {}) {
    super(manager, data);
    this._lineWidth = data.lineWidth || this.defaultStyle.lineWidth;
    this._size = data.size || this.defaultStyle.size;
    this._stroke = data.stroke || this.defaultStyle.stroke;
    this._fill = data.fill || this.defaultStyle.fill;
    this._shadow = data.shadow || this.defaultStyle.shadow;
    this._showLabel = data.showLabel || this.defaultStyle.showLabel;
    this._labelColor = data.labelColor || this.defaultStyle.labelColor;
    this._labelStyle = data.labelStyle || this.defaultStyle.labelStyle;
    this._labelName = data.labelName || this.defaultStyle.labelName;
    this._dashed = data.dashed || this.defaultStyle.dashed;

    this.addEventListener('style-change', this.requestRedraw.bind(this));
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.stroke;
    ctx.fillStyle = this.fill;
    ctx.setLineDash(this.dashed ? [10, 10] : []);

    ctx.shadowBlur = this.shadow ? 5 : 0;
    ctx.shadowColor = this.shadow ? '#00000050' : 'transparent';
    ctx.shadowOffsetX = this.shadow ? 5 : 0;
    ctx.shadowOffsetY = this.shadow ? 5 : 0;
  }

  setLineWidth(newLineWidth: number | null) {
    const newValue = newLineWidth ?? 3;
    const hasChanges = newValue !== this._lineWidth;
    this._lineWidth = newValue;
    if (hasChanges)
      this.fireEvent('style-change', { lineWidth: this.lineWidth });
  }
  get lineWidth() {
    return this._lineWidth;
  }

  setSize(size: number | null) {
    const newValue = size ?? 10;
    const hasChanges = newValue !== this._size;
    this._size = newValue;
    if (hasChanges) this.fireEvent('style-change', { size: this.size });
  }
  get size() {
    return this._size;
  }

  setStroke(stroke: string | null) {
    const newValue = stroke ?? 'transparent';
    const hasChanges = newValue !== this._stroke;
    this._stroke = newValue;
    if (hasChanges) this.fireEvent('style-change', { stroke: this.stroke });
  }
  get stroke() {
    return this._stroke;
  }

  setFill(fill: string | null) {
    const newValue = fill ?? 'transparent';
    const hasChanges = newValue !== this._fill;
    this._fill = newValue;
    if (hasChanges) this.fireEvent('style-change', { fill: this.fill });
  }
  get fill() {
    return this._fill;
  }

  setShadow(shadow: boolean | null) {
    const newValue = shadow ?? false;
    const hasChanges = newValue !== this._shadow;
    this._shadow = newValue;
    if (hasChanges) this.fireEvent('style-change', { shadow: this.shadow });
  }
  get shadow() {
    return this._shadow;
  }

  setDashed(dashed: boolean | null) {
    const newValue = dashed ?? false;
    const hasChanges = newValue !== this._dashed;
    this._dashed = newValue;
    if (hasChanges) this.fireEvent('style-change', { dashed: this._dashed });
  }
  get dashed() {
    return this._dashed;
  }

  shouldShowLabel(show: boolean | null) {
    const newValue = show ?? false;
    const hasChanges = newValue !== this._showLabel;
    this._showLabel = newValue;
    if (hasChanges)
      this.fireEvent('style-change', { showLabel: this._showLabel });
  }
  get showLabel() {
    return this._showLabel;
  }

  setLabelColor(color: string | null) {
    const newValue = color ?? '#111827';
    const hasChanges = newValue !== this._labelColor;
    this._labelColor = newValue;
    if (hasChanges)
      this.fireEvent('style-change', { labelColor: this._labelColor });
  }
  get labelColor() {
    return this._labelColor;
  }

  setLabelStyle(style: 'value' | 'name' | null) {
    const newValue = style ?? 'value';
    const hasChanges = newValue !== this._labelStyle;
    this._labelStyle = newValue;
    if (hasChanges)
      this.fireEvent('style-change', { labelStyle: this._labelStyle });
  }
  get labelStyle() {
    return this._labelStyle;
  }

  setLabelName(name: string | null) {
    const newValue = name ?? 'α';
    const hasChanges = newValue !== this._labelName;
    this._labelName = newValue;
    this.setLabelStyle('name');
    if (hasChanges)
      this.fireEvent('style-change', { labelName: this._labelName });
  }
  get labelName() {
    return this._labelName;
  }

  protected getValueLabel(): string {
    return '';
  }
  protected getLabel(): string {
    if (this.labelStyle === 'value') return this.getValueLabel();
    return this.labelName;
  }

  public export() {
    const res: StylableData = {};

    if (this._lineWidth !== this.defaultStyle.lineWidth)
      res.lineWidth = this._lineWidth;
    if (this._size !== this.defaultStyle.size) res.size = this._size;
    if (this._stroke !== this.defaultStyle.stroke) res.stroke = this._stroke;
    if (this._fill !== this.defaultStyle.fill) res.fill = this._fill;
    if (this._shadow !== this.defaultStyle.shadow) res.shadow = this._shadow;
    if (this._showLabel !== this.defaultStyle.showLabel)
      res.showLabel = this._showLabel;
    if (this._labelColor !== this.defaultStyle.labelColor)
      res.labelColor = this._labelColor;
    if (this._labelStyle !== this.defaultStyle.labelStyle)
      res.labelStyle = this._labelStyle;
    if (this._labelName !== this.defaultStyle.labelName)
      res.labelName = this._labelName;
    if (this._dashed !== this.defaultStyle.dashed) res.dashed = this._dashed;

    return { ...super.export(), ...res };
  }
}
