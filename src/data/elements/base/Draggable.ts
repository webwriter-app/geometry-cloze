import { MathPoint } from '../../helper/Calc';
import CanvasManager from '../../CanvasManager';
import Stylable, { StylableData } from './Stylable';

export interface DraggableData {
  selected?: boolean;
}

export default abstract class Draggable extends Stylable {
  private _selected: boolean;
  protected clickTargetSize = 0;
  protected abstract _x: number;
  protected abstract _y: number;

  constructor(
    canvas: CanvasManager,
    data: DraggableData & StylableData = {},
    protected readonly active = true
  ) {
    super(canvas, data);
    this._selected = data.selected ?? false;

    this.addEventListener('select', this.select.bind(this));
    this.addEventListener('unselect', this.blur.bind(this));
  }

  public getHit(point: MathPoint): Draggable | null {
    return this.children.reduce(
      (cur, child) => {
        if (cur) return cur;
        if (child instanceof Draggable) return child.getHit(point);
        return null;
      },
      null as Draggable | null
    );
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

  select() {
    if (!this.onSelect()) return;
    this._selected = true;
    this.overwrittenStyle = {
      fill: this.fill,
      shadow: this.shadow
    };
    this.setShadow(true);
    this.setFill('blue');
  }

  /**
   * Gets called when the element is selected
   * @returns Whether the element should be selected
   */
  onSelect(): boolean {
    return true;
  }

  blur() {
    if (!this.onBlur()) return;
    this._selected = false;
    this.setShadow(this.overwrittenStyle.shadow ?? null);
    this.setFill(this.overwrittenStyle.fill ?? null);
    this.overwrittenStyle = {};
  }

  /**
   * Gets called when the element is unselected
   * @returns Whether the element should be unselected
   */
  onBlur(): boolean {
    return true;
  }

  delete() {
    super.delete();
    this._selected = false;
    this.removeEventListener('select', this.select.bind(this));
    this.removeEventListener('unselect', this.blur.bind(this));
    // TODO: implement
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
}
