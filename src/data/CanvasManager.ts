import Draggable from './Draggable';
import Element from './Element';

interface MountedElement<El extends Element = Element> {
  element: El;
  draggable: boolean;
  selectable: boolean;
}

export default class CanvasManager {
  protected static FRAME_RATE = 60;

  private clickTargetEle: HTMLDivElement;
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;
  private shapes: MountedElement[] = [];

  /**
   * Element that is currently being dragged \
   * Is reset to null when mouse is released
   */
  private dragTarget: Draggable | null = null;
  /**
   * Information about the first click/mouse down when dragging an element
   */
  private dragStart: {
    // position of the first click/mouse down
    x: number;
    y: number;
    // store how much the first click/mouse down is offset from the origin of the selected element
    elementOffsetX: number;
    elementOffsetY: number;
  } | null = null;
  /**
   * Currently selected element
   */
  private _selected: Draggable | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._ctx = this._canvas.getContext('2d')!;

    this.clickTargetEle = canvas.parentElement?.querySelector('.click-target')!;

    // this.clickTarget.addEventListener('click', this.onClick.bind(this));
    this.clickTargetEle.addEventListener(
      'mousedown',
      this.onMouseDown.bind(this)
    );
    this.clickTargetEle.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.clickTargetEle.addEventListener(
      'mousemove',
      this.onMouseMove.bind(this),
      {
        passive: true,
        capture: false
      }
    );
  }

  private findHitElement(point: { x: number; y: number }): Draggable | null {
    const hit = this.shapes.reduce(
      (cur, shape) => {
        if (cur || !shape.selectable) return cur;
        if (shape.element instanceof Draggable)
          return shape.element.getHit(point);
        return null;
      },
      null as Draggable | null
    );
    return hit;
  }

  private getRelativeCoordinates(event: MouseEvent) {
    const rect = this._canvas.getBoundingClientRect();
    const absX = event.clientX - rect.left;
    const absY = event.clientY - rect.top;

    const x = (absX / rect.width) * this._canvas.width;
    const y = (absY / rect.height) * this._canvas.height;

    return { x, y };
  }

  private onClick(event: MouseEvent) {
    const coords = this.getRelativeCoordinates(event);

    const hit = this.findHitElement(coords);
    if (hit) this.select(hit);
    else this.blur();
  }

  private onMouseDown(event: MouseEvent) {
    const coords = this.getRelativeCoordinates(event);

    const hit = this.findHitElement(coords);
    if (!hit) {
      this.blur();
      return;
    }

    this.dragTarget = hit;
    this.dragStart = {
      ...coords,
      elementOffsetX: coords.x - hit.x,
      elementOffsetY: coords.y - hit.y
    };

    this.select(hit);
  }

  private onMouseUp() {
    this.dragTarget = null;
  }

  private onMouseMove(event: MouseEvent) {
    // when somehow the mouseup event is not fired, we still want to stop dragging -> can occur when user pressed alt+tab while dragging
    if (event.buttons !== 1) this.dragTarget = null;

    const coords = this.getRelativeCoordinates(event);
    if (this.dragTarget) {
      // drag currently selected element
      coords.x -= this.dragStart!.elementOffsetX;
      coords.y -= this.dragStart!.elementOffsetY;
      this.dragTarget.move({ ...coords, relative: false });

      if (!this.dragTarget.selected) this.select(this.dragTarget, true);

      this.requestRedraw();
    } else {
      // check if we're hovering over a draggable element and change cursor accordingly
      const hit = this.findHitElement(coords);
      this.clickTargetEle.style.cursor = hit ? 'pointer' : 'default';
    }
  }

  unmount() {
    this.clickTargetEle.removeEventListener('click', this.onClick.bind(this));
    this.clickTargetEle.removeEventListener(
      'mousedown',
      this.onMouseDown.bind(this)
    );
    this.clickTargetEle.removeEventListener(
      'mouseup',
      this.onMouseUp.bind(this)
    );
    this.clickTargetEle.removeEventListener(
      'mousemove',
      this.onMouseMove.bind(this)
    );
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

  select(shape: Draggable, force?: boolean) {
    const isSame = shape === this._selected;

    if (isSame && !force) shape.blur();

    if (!isSame || force) {
      this._selected?.blur();
      this._selected = shape;
      shape.select();
    }
  }

  blur() {
    this._selected?.blur();
    this._selected = null;
  }

  get ctx() {
    return this._ctx;
  }

  get selected() {
    return this._selected;
  }
}
