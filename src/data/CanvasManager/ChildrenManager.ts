import Shape from '../elements/Shape';
import Draggable from '../elements/base/Draggable';
import Element from '../elements/base/Element';

export default class ChildrenManager {
  private static FRAME_RATE = 60;

  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;

  private children: Shape[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._ctx = this._canvas.getContext('2d')!;
  }

  // pass ctx here since this method can be overwritten by super classes and can be used to render additional elements
  protected redraw(ctx: CanvasRenderingContext2D) {
    if (!ctx || !this._canvas) return;
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    // reverse order so that the first shape is on top
    for (const shape of this.children.map((s) => s).reverse()) {
      shape.draw(ctx);
    }
  }

  protected getElementAt(point: { x: number; y: number }): Draggable | null {
    const hit = this.children.reduce(
      (cur, shape) => {
        if (cur) return cur;
        if (shape instanceof Draggable) return shape.getHit(point)[0] ?? null;
        return null;
      },
      null as Draggable | null
    );
    return hit;
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

    if (now - this.firstRequestTimestamp > 1000 / ChildrenManager.FRAME_RATE) {
      this.lastRedrawTimestamp = now;
      this.redraw(this._ctx);
      this.firstRequestTimestamp = null;
    } else
      requestAnimationFrame(
        this.requestRedraw.bind(this, originallyScheduledAt)
      );
  }

  public addShape(shape: Shape) {
    this.children.push(shape);
    this.requestRedraw();

    shape.registerParent(this);
    shape.addEventListener('request-redraw', this.redraw.bind(this, this._ctx));
  }

  public removeChild(element: Shape) {
    const index = this.children.indexOf(element);
    if (index < 0) return;
    this.children.splice(index, 1);
    this.requestRedraw();
  }

  public moveToTop(shape: Shape) {
    const index = this.children.indexOf(shape);
    if (index < 0) return;
    const ele = this.children.splice(index, 1);
    this.children.push(...ele);
  }

  public getChildren() {
    return this.children;
  }

  public getCanvasDimensions(): { width: number; height: number } {
    return {
      width: this._canvas.width,
      height: this._canvas.height
    };
  }

  protected getChildByID(id: number) {
    return this.children.reduce<Element | null>(
      (cur, child) => cur ?? child.getChildByID(id),
      null
    );
  }

  public export() {
    return {
      children: this.children.map((child) => child.export())
    };
  }

  public import(data: ReturnType<this['export']>) {
    const children = data.children.map((child) =>
      Shape.import(child, this as any)
    );
    this.getChildren().forEach((child) => this.removeChild(child));
    this.children = [];
    children.forEach((child) => this.addShape(child));
  }

  private static idCounter = 1;
  public static getID() {
    return ChildrenManager.idCounter++;
  }
}
