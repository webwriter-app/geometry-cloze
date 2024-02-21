import { MathPoint } from '../../helper/Calc';
import Stylable, { StylableData } from './Stylable';
import Element from './Element';
import InteractionManager from '../../CanvasManager/InteractionManager';

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
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    if (this.selected) {
      ctx.lineWidth = this.lineWidth + 2;
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#000000b0';
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
    }
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

  select() {
    if (!this.onSelect()) return;
    this._selected = true;
    this.requestRedraw();
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
    this.requestRedraw();
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
