import Stylable, { StylableData } from './Stylable';

export interface SelectableData {
  selected?: boolean;
}

export default class Selectable extends Stylable {
  private _selected: boolean;

  constructor(
    canvas: HTMLCanvasElement,
    data: SelectableData & StylableData = {}
  ) {
    super(canvas, data);
    this._selected = data.selected ?? false;

    this.canvas.addEventListener('click', this.onClick.bind(this));
  }

  private onClick(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.ctx.isPointInPath(x, y)) {
      this._selected = !this._selected;
    }
  }

  delete() {
    this._selected = false;
    this.canvas.removeEventListener('click', this.onClick);
  }

  get selected() {
    return this._selected;
  }
}
