import Element from './Element';

export default class CanvasManager {
  protected static FRAME_RATE = 30;

  private _canvas: HTMLCanvasElement | null;
  private _ctx: CanvasRenderingContext2D | null;
  private shapes: Element[] = [];

  constructor(canvas?: HTMLCanvasElement) {
    this._canvas = canvas ?? null;
    this._ctx = this._canvas?.getContext('2d') ?? null;
  }

  addShape(shape: Element) {
    this.shapes.push(shape);
    this.requestRedraw();

    shape.addEventListener('request-redraw', this.redraw.bind(this));
  }

  redraw() {
    if (!this._ctx || !this._canvas) return;
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    // reverse order so that the first shape is on top
    for (const shape of this.shapes.map((s) => s).reverse()) {
      shape.draw();
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
    const index = this.shapes.indexOf(shape);
    if (index < 0) return;
    this.shapes.splice(index, 1);
    this.shapes.push(shape);
  }
}
