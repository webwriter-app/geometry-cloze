import Calc, { MathPoint } from './Calc';
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
  private children: MountedElement[] = [];
  /**
   * Information about the first click/mouse down when dragging an element
   */
  private dragStart: {
    // position of the first click/mouse down
    x: number;
    y: number;
    // positions of selected elements at the time of the first click/mouse down
    startPositions: { x: number; y: number }[];
  } | null = null;
  /**
   * Wether for the current mouse down event the mouse has been moved beyond the threshold
   */
  private moved: boolean = false;
  private mouseDownTarget: { element: Draggable; wasSelected: boolean } | null =
    null;
  /**
   * Currently selected element
   */
  private _selected: Draggable[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._ctx = this._canvas.getContext('2d')!;

    this.clickTargetEle = canvas.parentElement?.querySelector('.click-target')!;

    this.clickTargetEle.addEventListener(
      'mousedown',
      this.onMouseDown.bind(this)
    );
    this.clickTargetEle.addEventListener(
      'touchstart',
      this.onMouseDown.bind(this)
    );
    this.clickTargetEle.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.clickTargetEle.addEventListener('touchend', this.onMouseUp.bind(this));
    this.clickTargetEle.addEventListener(
      'mousemove',
      this.onMouseMove.bind(this),
      {
        passive: true,
        capture: false
      }
    );
    this.clickTargetEle.addEventListener(
      'touchmove',
      this.onMouseMove.bind(this),
      {
        passive: true,
        capture: false
      }
    );
    this.clickTargetEle.addEventListener('touchmove', this.preventTouchScroll, {
      passive: false,
      capture: false
    });
  }

  private findHitElement(point: { x: number; y: number }): Draggable | null {
    const hit = this.children.reduce(
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

  private preventTouchScroll(event: TouchEvent) {
    event.preventDefault();
  }

  private canSelectMultiple(event: MouseEvent | TouchEvent) {
    return event.ctrlKey || event.shiftKey;
  }

  private getRelativeCoordinates(event: MouseEvent | TouchEvent) {
    const rect = this._canvas.getBoundingClientRect();
    const absX =
      ('clientX' in event ? event.clientX : event.touches[0].clientX) -
      rect.left;
    const absY =
      ('clientX' in event ? event.clientY : event.touches[0].clientY) -
      rect.top;

    const x = (absX / rect.width) * this._canvas.width;
    const y = (absY / rect.height) * this._canvas.height;

    return { x, y };
  }

  private onMouseDown(event: MouseEvent | TouchEvent) {
    this.moved = false;
    const coords = this.getRelativeCoordinates(event);

    const hit = this.findHitElement(coords);

    if (hit) {
      const wasSelected = this._selected.includes(hit);

      if (!wasSelected)
        this.select(hit, { keepSelection: this.canSelectMultiple(event) });

      this.mouseDownTarget = {
        element: hit,
        wasSelected
      };
    }

    this.dragStart = {
      ...coords,
      startPositions: this._selected.map((shape) => ({
        x: shape.x,
        y: shape.y
      }))
    };
  }

  private onMouseUp(event: MouseEvent | TouchEvent) {
    // when the user dragged the mouse, we don't want to select anything
    if (this.moved) return;
    const hit = this.findHitElement(this.dragStart!);
    // needs to be more complicated since selected state is set in mouseDown listener
    const alreadySelected = (() => {
      if (!hit) return false;
      if (this.mouseDownTarget) {
        if (this.mouseDownTarget.wasSelected) return true;
        else return false;
      }
      return this.selected.includes(hit);
    })();
    const canSelectMultiple = this.canSelectMultiple(event);

    if (hit) {
      if (alreadySelected) {
        if (canSelectMultiple) {
          // when clicking on a selected element while holding ctrl, we want to deselect it
          this.blur(hit);
        } else {
          if (this.selected.length > 1) {
            // when clicking on a selected element while many elements are selected, we want to select only that element
            this.select(hit, { keepSelection: false });
          } else {
            // when clicking on a selected element while only one element is selected, we want to deselect it
            this.blur();
          }
        }
      } else {
        if (canSelectMultiple) {
          // when clicking on an unselected element while holding ctrl, we want to select it and keep the other elements selected
          this.select(hit, { keepSelection: true });
        } else {
          // when clicking on an unselected element while not holding ctrl, we want to select it and deselect the other elements
          this.select(hit, { keepSelection: false });
        }
      }
    } else {
      if (!canSelectMultiple) {
        // when clicking on nothing while not holding ctrl, we want to deselect all elements
        this.blur();
      }
      // click clicking nothing while holding ctrl, we want to keep the current selection
    }
  }

  private upadateCursor(coords: MathPoint) {
    // check if we're hovering over a draggable element and change cursor accordingly
    const hit = this.findHitElement(coords);
    this.clickTargetEle.style.cursor = hit ? 'pointer' : 'default';
  }

  private onMouseMove(event: MouseEvent | TouchEvent) {
    const coords = this.getRelativeCoordinates(event);

    // when somehow the mouseup event is not fired, we still want to stop dragging -> can occur when user pressed alt+tab while dragging
    if ('buttons' in event && event.buttons !== 1) {
      this.upadateCursor(coords);
      return;
    }

    // set moved to true if we moved more than threshold
    if (!this.moved && Calc.distance(coords, this.dragStart!) > 5)
      this.moved = true;

    if (this._selected.length > 0) {
      // drag currently selected element
      coords.x -= this.dragStart!.x;
      coords.y -= this.dragStart!.y;

      this._selected.forEach((shape, index) => {
        const startCoords = this.dragStart!.startPositions[index];
        const x = startCoords.x + coords.x;
        const y = startCoords.y + coords.y;
        shape.move({ x, y, relative: false });
      });

      this.requestRedraw();
    } else {
      this.upadateCursor(coords);
    }
  }

  select(shape: Draggable, options: { keepSelection?: boolean } = {}) {
    const { keepSelection = false } = options;

    if (!keepSelection) this.blur();

    if (!this._selected.includes(shape)) {
      this._selected.push(shape);
      shape.select();
    }
  }

  blur(element?: Draggable) {
    if (element) {
      const index = this._selected.indexOf(element);
      if (index < 0) return;
      this._selected.splice(index, 1);
      element.blur();
    } else {
      this._selected.forEach((shape) => shape.blur());
      this._selected = [];
    }
  }

  unmount() {
    this.clickTargetEle.removeEventListener(
      'mousedown',
      this.onMouseDown.bind(this)
    );
    this.clickTargetEle.removeEventListener(
      'touchstart',
      this.onMouseDown.bind(this)
    );
    this.clickTargetEle.removeEventListener(
      'mouseup',
      this.onMouseUp.bind(this)
    );
    this.clickTargetEle.removeEventListener(
      'touchend',
      this.onMouseUp.bind(this)
    );
    this.clickTargetEle.removeEventListener(
      'mousemove',
      this.onMouseMove.bind(this)
    );
    this.clickTargetEle.removeEventListener(
      'touchmove',
      this.onMouseMove.bind(this)
    );
  }

  addShape(shape: Element) {
    this.children.push({
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
    for (const shape of this.children.map((s) => s).reverse()) {
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
    const index = this.children.findIndex((ele) => ele.element === shape);
    if (index < 0) return;
    const ele = this.children.splice(index, 1);
    this.children.push(...ele);
  }

  get ctx() {
    return this._ctx;
  }

  get selected() {
    return this._selected;
  }
}
