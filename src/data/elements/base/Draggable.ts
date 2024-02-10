import { MathPoint } from '../../helper/Calc';
import Stylable, { StylableData } from './Stylable';
import Element from './Element';
import InteractionManager from '/data/CanvasManager/InteractionManager';

export interface DraggableData {
  selected?: boolean;
}

export default abstract class Draggable extends Stylable {
  private _selected: boolean;
  protected clickTargetSize = 0;
  protected abstract _x: number;
  protected abstract _y: number;

  constructor(
    canvas: InteractionManager,
    data: DraggableData & StylableData = {}
  ) {
    super(canvas, data);
    this._selected = data.selected ?? false;

    this.addEventListener('select', this.select.bind(this));
    this.addEventListener('unselect', this.blur.bind(this));
    this.addEventListener('style-change', this.styleChangeListener.bind(this));
  }

  public getHit(point: MathPoint, point2?: MathPoint): Draggable[] {
    return this.children.flatMap((child) => {
      if (child instanceof Draggable) return child.getHit(point, point2);
      return [];
    });
  }

  public move(coords: { x?: number; y?: number; relative: boolean }): void {
    const change = coords.relative
      ? coords
      : {
          x: coords.x ? coords.x - this.x : 0,
          y: coords.y ? coords.y - this.y : 0,
          relative: true
        };

    this._x += change.x ?? 0;
    this._y += change.y ?? 0;

    this.children.forEach((child) => {
      if (child instanceof Draggable) child.move(change);
    });

    this.fireEvent('move', this);
    this.requestRedraw();
  }

  private overwrittenStyle: Partial<StylableData> = {};

  // boolean to not store style changes when setting the style for signaling that the element is selected
  private isSettingStyle = false;
  private setSelectedStyle() {
    this.isSettingStyle = true;
    this.setShadow(true);
    // this.setFill('blue');
    this.isSettingStyle = false;
  }

  private styleChangeListener(_: Element, style: Partial<StylableData>) {
    if (this.isSettingStyle || !this.selected) return;
    this.overwrittenStyle = {
      ...this.overwrittenStyle,
      ...style
    };
    this.setSelectedStyle();
  }

  select() {
    if (!this.onSelect()) return;
    this._selected = true;
    this.overwrittenStyle = {
      fill: this.fill,
      shadow: this.shadow
    };
    this.setSelectedStyle();
  }

  /**
   * Gets called when the element is selected
   * @returns Whether the element should be selected
   */
  protected onSelect(): boolean {
    return true;
  }

  blur() {
    if (!this.onBlur()) return;
    this._selected = false;
    this.isSettingStyle = true;
    this.setShadow(this.overwrittenStyle.shadow ?? null);
    // this.setFill(this.overwrittenStyle.fill ?? null);
    this.isSettingStyle = false;
    this.overwrittenStyle = {};
  }

  /**
   * Gets called when the element is unselected
   * @returns Whether the element should be unselected
   */
  protected onBlur(): boolean {
    return true;
  }

  delete() {
    super.delete();
    this._selected = false;
    this.removeEventListener('select', this.select.bind(this));
    this.removeEventListener('unselect', this.blur.bind(this));
  }

  get selected() {
    return this._selected;
  }

  get x() {
    return this._x;
  }
  get y() {
    return this._y;
  }

  public export() {
    return {
      ...super.export(),
      selected: this.selected
    };
  }
}
