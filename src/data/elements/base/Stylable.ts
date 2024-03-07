import { ContextMenuItem } from '../../../types/ContextMenu';
import InteractionManager from '../../CanvasManager/InteractionManager';
import Element, { NamedElement } from './Element';

export interface StylableData {
  lineWidth?: number;
  size?: number;
  stroke?: string;
  fill?: string;
  shadow?: boolean;
  labelColor?: string;
  showLabel?: boolean;
  labelStyle?: 'value' | 'name';
  dashed?: boolean;
}

const DEFAULT_STYLE = {
  lineWidth: 3,
  size: 10,
  stroke: '#111827',
  fill: 'transparent',
  shadow: false,
  showLabel: false,
  labelColor: '#111827',
  labelStyle: 'value',
  dashed: false
} as const;

export default class Stylable extends Element {
  private _lineWidth: number;
  private _size: number;
  private _stroke: string;
  private _fill: string;
  private _shadow: boolean;
  private _showLabel: boolean;
  private _labelColor: string;
  private _dashed: boolean;

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
    this._showLabel = data.showLabel || DEFAULT_STYLE.showLabel;
    this._labelColor = data.labelColor || DEFAULT_STYLE.labelColor;
    this._dashed = data.dashed || DEFAULT_STYLE.dashed;

    this.addEventListener('style-change', this.requestRedraw.bind(this));
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.stroke;
    ctx.fillStyle = this.fill;
    ctx.setLineDash(this.dashed ? [10, 10] : []);

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

  setDashed(dashed: boolean | null) {
    const newValue = dashed ?? false;
    const hasChanges = newValue !== this._dashed;
    this._dashed = newValue;
    if (hasChanges) this.fireEvent('style-change', { dashed: this._dashed });
  }
  get dashed() {
    return this._dashed;
  }

  showLabel(show: boolean | null) {
    const newValue = show ?? false;
    const hasChanges = newValue !== this._showLabel;
    this._showLabel = newValue;
    if (hasChanges)
      this.fireEvent('style-change', { showLabel: this._showLabel });
  }
  get isShowingLabel() {
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

  protected getLabel(): string {
    return '';
  }

  protected getStyleContextMenuItems(options: {
    stroke?: boolean;
    fill?: boolean;
    lineWidth?: boolean;
    showLabel?: boolean;
    dashed?: boolean;
  }): ContextMenuItem[] {
    const COLORS = [
      {
        label: 'Transparent',
        color: 'transparent'
      },
      {
        label: 'Black',
        color: '#111827'
      },
      {
        label: 'Red',
        color: '#dc2626'
      },
      {
        label: 'Orange',
        color: '#ea580c'
      },
      {
        label: 'Yellow',
        color: '#facc15'
      },
      {
        label: 'Lime',
        color: '#84cc16'
      },
      {
        label: 'Green',
        color: '#15803d'
      },
      {
        label: 'Cyan',
        color: '#06b6d4'
      },
      {
        label: 'Blue',
        color: '#2563eb'
      },
      {
        label: 'Violet',
        color: '#6d28d9'
      },
      {
        label: 'Pink',
        color: '#db2777'
      }
    ];
    const res: ContextMenuItem[] = [];
    if (options.stroke) {
      res.push({
        type: 'submenu',
        label: 'Stoke',
        items: COLORS.map(
          (option) =>
            ({
              type: 'checkbox',
              label: option.label,
              getChecked: () => this._stroke === option.color,
              action: () => this.setStroke(option.color),
              key: `stroke_${option.label.toLowerCase()}`
            }) as const
        )
      });
    }
    if (options.fill) {
      res.push({
        type: 'submenu',
        label: 'Fill',
        items: COLORS.map(
          (option) =>
            ({
              type: 'checkbox',
              getChecked: () => this._fill === option.color + '50',
              label: option.label,
              action: () => this.setFill(option.color + '50'),
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
    if (options.dashed) {
      res.push({
        type: 'checkbox',
        label: 'Dashed',
        getChecked: () => this._dashed,
        action: () => this.setDashed(!this._dashed),
        key: 'dashed'
      });
    }
    if (options.showLabel ?? this.getLabel() !== '') {
      res.push({
        type: 'submenu',
        label: 'Label',
        items: [
          {
            type: 'checkbox',
            label: 'Show Label',
            getChecked: () => this._showLabel,
            action: () => this.showLabel(!this._showLabel),
            key: 'show-label'
          },
          {
            type: 'submenu',
            label: 'Color',
            items: COLORS.map(
              (option) =>
                ({
                  type: 'checkbox',
                  getChecked: () => this._labelColor === option.color,
                  label: option.label,
                  action: () => this.setLabelColor(option.color),
                  key: `label_color_${option.label.toLowerCase()}}`
                }) as const
            )
          }
        ]
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
    if (this._showLabel !== DEFAULT_STYLE.showLabel)
      res.showLabel = this._showLabel;
    if (this._dashed !== DEFAULT_STYLE.dashed) res.dashed = this._dashed;

    return { ...super.export(), ...res };
  }
}
