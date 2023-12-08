import Draggable from './Draggable';
import Element from './Element';

interface MountedElement {
  element: Element;
  draggable: boolean;
  selectable: boolean;
}

export default class CanvasManager {
  protected static FRAME_RATE = 30;

  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;
  private shapes: MountedElement[] = [];

  private _selected: Draggable | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._ctx = this._canvas.getContext('2d')!;

    canvas.addEventListener('mousedown', this.onClick.bind(this));
  }

  private findHitElement(point: { x: number; y: number }): Draggable | null {
    const hit = this.shapes.find((shape) => {
      if (!shape.selectable) return false;
      if (shape.element instanceof Draggable) return shape.element.isHit(point);
      return false;
    });
    return (hit?.element as Draggable | undefined) ?? null;
  }

  private onClick(event: MouseEvent) {
    if (!this._canvas) return;
    const rect = this._canvas.getBoundingClientRect();
    const absX = event.clientX - rect.left;
    const absY = event.clientY - rect.top;

    const x = (absX / rect.width) * this._canvas.width;
    const y = (absY / rect.height) * this._canvas.height;

    const hit = this.findHitElement({ x, y });
    const oldSelected = this._selected;
    this._selected = hit;

    oldSelected?.fireEvent('unselect');
    if (hit !== oldSelected) hit?.fireEvent('select');
  }

  unmount() {
    this._canvas.removeEventListener('mousedown', this.onClick.bind(this));
  }

  addShape(shape: Element) {
    this.shapes.push({
      draggable: shape instanceof Draggable,
      selectable: shape instanceof Draggable,
      element: shape
    });
    this.requestRedraw();

    shape.addEventListener('request-redraw', this.redraw.bind(this));
  }

  redraw() {
    if (!this._ctx || !this._canvas) return;
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    // reverse order so that the first shape is on top
    for (const shape of this.shapes.map((s) => s).reverse()) {
      shape.element.draw();
    }
  }

  setCanvas(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d')!;
  }

  /**
   * first timestamp where we requested a redraw for current batch
   */
  private firstRequestTimestamp: number | null = null;
  /**
   * last timestamp where we actually redrew
   */
  private lastRedrawTimestamp: number = 0;
  requestRedraw(originallyScheduledAt?: number) {
    const now = performance.now();
    if (!originallyScheduledAt) originallyScheduledAt = now;

    // check if we've already redrawn since this was scheduled
    if (originallyScheduledAt < this.lastRedrawTimestamp) return;

    if (!this.firstRequestTimestamp)
      this.firstRequestTimestamp = performance.now();

    if (now - this.firstRequestTimestamp > 1000 / CanvasManager.FRAME_RATE) {
      this.lastRedrawTimestamp = now;
      this.redraw();
      this.firstRequestTimestamp = null;
    } else
      requestAnimationFrame(
        this.requestRedraw.bind(this, originallyScheduledAt)
      );
  }

  moveToTop(shape: Element) {
    const index = this.shapes.findIndex((ele) => ele.element === shape);
    if (index < 0) return;
    const ele = this.shapes.splice(index, 1);
    this.shapes.push(...ele);
  }

  get ctx() {
    return this._ctx;
  }

  get selected() {
    return this._selected;
  }
}
