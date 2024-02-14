import Element, { NamedElement } from './Element';
import InteractionManager from '/data/CanvasManager/InteractionManager';
import { ContextMenuItem } from '/types/ContextMenu';

export interface StylableData {
  lineWidth?: number;
  size?: number;
  stroke?: string;
  fill?: string;
  shadow?: boolean;
}

const DEFAULT_STYLE = {
  lineWidth: 3,
  size: 10,
  stroke: 'black',
  fill: 'transparent',
  shadow: false
} as const;

export default class Stylable extends Element {
  private _lineWidth: number;
  private _size: number;
  private _stroke: string;
  private _fill: string;
  private _shadow: boolean;

  constructor(
    canvas: InteractionManager,
    data: StylableData & NamedElement = {}
  ) {
    super(canvas, data);
    this._lineWidth = data.lineWidth || DEFAULT_STYLE.lineWidth;
    this._size = data.size || DEFAULT_STYLE.size;
    this._stroke = data.stroke || DEFAULT_STYLE.stroke;
    this._fill = data.fill || DEFAULT_STYLE.fill;
    this._shadow = data.shadow || DEFAULT_STYLE.shadow;

    this.addEventListener('style-change', this.requestRedraw.bind(this));
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.stroke;
    ctx.fillStyle = this.fill;

    ctx.shadowBlur = this.shadow ? 5 : 0;
    ctx.shadowColor = this.shadow ? '#000000b0' : 'transparent';
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

  protected getStyleContextMenuItems(options: {
    stroke?: boolean;
    fill?: boolean;
    lineWidth?: boolean;
  }): ContextMenuItem[] {
    const res: ContextMenuItem[] = [];
    if (options.stroke) {
      const options = [
        {
          label: 'Blue',
          value: 'blue'
        },
        {
          label: 'Red',
          value: 'red'
        },
        {
          label: 'Green',
          value: 'green'
        },
        {
          label: 'Black',
          value: 'black'
        },
        {
          label: 'Transparent',
          value: 'transparent'
        }
      ];
      res.push({
        type: 'submenu',
        label: 'Stoke',
        items: options.map(
          (option) =>
            ({
              type: 'checkbox',
              label: option.label,
              getChecked: () => this._stroke === option.value,
              action: () => this.setStroke(option.value),
              key: `stroke_${option.label.toLowerCase()}`
            }) as const
        )
      });
    }
    if (options.fill) {
      const options = [
        {
          label: 'Blue',
          value: 'blue'
        },
        {
          label: 'Red',
          value: 'red'
        },
        {
          label: 'Green',
          value: 'green'
        },
        {
          label: 'Black',
          value: 'black'
        },
        {
          label: 'Transparent',
          value: 'transparent'
        }
      ];
      res.push({
        type: 'submenu',
        label: 'Fill',
        items: options.map(
          (option) =>
            ({
              type: 'checkbox',
              getChecked: () => this._fill === option.value,
              label: option.label,
              action: () => this.setFill(option.value),
              key: `fill_${option.label.toLowerCase()}}`
            }) as const
        )
      });
    }
    if (options.lineWidth) {
      const options = [
        {
          label: 'Extra thin',
          value: 1
        },
        {
          label: 'Thin',
          value: 2
        },
        {
          label: 'Medium',
          value: 3
        },
        {
          label: 'Thick',
          value: 5
        },
        {
          label: 'Extra Thick',
          value: 7
        }
      ];
      res.push({
        type: 'submenu',
        label: 'Line Width',
        items: options.map(
          (option) =>
            ({
              type: 'checkbox',
              getChecked: () => this._lineWidth === option.value,
              label: option.label,
              action: () => this.setLineWidth(option.value),
              key: `line-width_${option.label.toLowerCase()}`
            }) as const
        )
      });
    }
    return res;
  }

  public getContextMenuItems(): ContextMenuItem[] {
    return [...super.getContextMenuItems()];
  }

  public export() {
    const res: StylableData = {};

    if (this._lineWidth !== DEFAULT_STYLE.lineWidth)
      res.lineWidth = this._lineWidth;
    if (this._size !== DEFAULT_STYLE.size) res.size = this._size;
    if (this._stroke !== DEFAULT_STYLE.stroke) res.stroke = this._stroke;
    if (this._fill !== DEFAULT_STYLE.fill) res.fill = this._fill;
    if (this._shadow !== DEFAULT_STYLE.shadow) res.shadow = this._shadow;

    return { ...super.export(), ...res };
  }
}
