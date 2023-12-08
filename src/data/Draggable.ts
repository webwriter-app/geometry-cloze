import { MathPoint } from './Calc';
import CanvasManager from './CanvasManager';
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

  public abstract isHit(point: MathPoint): boolean;
  public abstract move(coords: {
    x?: number;
    y?: number;
    relative: boolean;
  }): void;

  private overwrittenStyle: Partial<StylableData> = {};

  select() {
    this._selected = true;
    this.overwrittenStyle = {
      fill: this.fill,
      shadow: this.shadow
    };
    this.setShadow(true);
    this.setFill('blue');
  }

  blur() {
    this._selected = false;
    this.setShadow(this.overwrittenStyle.shadow ?? null);
    this.setFill(this.overwrittenStyle.fill ?? null);
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
