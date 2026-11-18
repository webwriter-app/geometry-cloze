import type { MsgFn } from "@lit/localize";
import { msg as sourceMsg } from "@lit/localize";
import Calc, { MathPoint } from '../../model/calc';
import Draggable from '../elements/base/draggable';
import ChildrenManager from './children-manager';

export default abstract class EventManager extends ChildrenManager {
  protected wrapper: HTMLCanvasElement;

  private clickTargetEle: HTMLElement;
  /**
   * Currently selected element
   */
  private _selected: Draggable[] = [];

  private _resizeObserver = new ResizeObserver(
    this.handleCanvasResize.bind(this)
  );
  private listeners = new AbortController();
  private _currentDpr = window.devicePixelRatio || 1;

  constructor(canvas: HTMLCanvasElement, msg: MsgFn = sourceMsg) {
    super(canvas, msg);
    this.wrapper = canvas;

    this.clickTargetEle = canvas;

    const { signal } = this.listeners;
    const target = this.clickTargetEle;
    // Pointer events cover mouse, pen and touch; the canvas sets touch-action itself.
    target.addEventListener('pointerdown', this.onPointerDown, { signal });
    target.addEventListener('pointerup', this.onMouseUp, { signal });
    target.addEventListener('pointermove', this.onMouseMove, {
      passive: true,
      signal
    });
    target.addEventListener('pointercancel', this.onPointerCancel, { signal });
    target.addEventListener('contextmenu', this.onContextMenu, { signal });

    window.addEventListener('resize', this.onWindowResize.bind(this), { signal });
    this._resizeObserver.observe(this.wrapper);
  }

  unmount() {
    this.clearLongPress();
    this.listeners.abort();
    this._resizeObserver.disconnect();
  }

  private getRelativeCoordinates(event: PointerEvent) {
    const rect = this.wrapper.getBoundingClientRect();
    const absX = event.clientX - rect.left;
    const absY = event.clientY - rect.top;

    const { width: canvasWidth, height: canvasHeight } =
      this.getCanvasDimensions();
    const x = (absX / rect.width) * canvasWidth;
    const y = (absY / rect.height) * canvasHeight;

    return { x, y };
  }
  /**
   * Wether for the current mouse down event the mouse has been moved beyond the threshold
   */
  private moved: boolean = false;
  private mouseDownTarget: { element: Draggable; wasSelected: boolean } | null =
    null;
  private longPressTimer: ReturnType<typeof setTimeout> | undefined;
  private longPressed = false;
  private clearLongPress() {
    clearTimeout(this.longPressTimer);
    this.longPressTimer = undefined;
  }

  /** A long press with touch stands in for the right click. */
  private onLongPress = () => {
    this.longPressTimer = undefined;
    if (this.moved || !this.dragStart) return;
    this.longPressed = true;
    const hit = this.getElementAt(this.dragStart);
    this.handleClick({
      coords: this.dragStart,
      hit,
      alreadySelected: this.mouseDownTarget?.wasSelected ?? false,
      shiftPressed: false,
      isRightClick: true
    });
  };

  private onContextMenu = (event: Event) => {
    if (this.longPressed) event.preventDefault();
  };

  private onPointerCancel = (event: PointerEvent) => {
    this.clearLongPress();
    if (this.moved && this.dragStart) {
      this.handleDragEnd({
        from: this.dragStart,
        to: this.getRelativeCoordinates(event),
        element: this.mouseDownTarget?.element ?? null
      });
    }
    this.moved = false;
    this.longPressed = false;
    this.dragStart = null;
  };

  private onPointerDown = (event: PointerEvent) => {
    try {
      this.clickTargetEle.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic events have no active pointer to capture.
    }
    this.pointerStarted();
    this.longPressed = false;
    this.clearLongPress();
    this.onMouseDown(event);
    if (event.pointerType === 'touch')
      this.longPressTimer = setTimeout(this.onLongPress, 500);
  };

  /** Called when a pointer starts on the canvas; the keyboard cursor goes away. */
  protected pointerStarted() {}

  private onMouseDown(event: PointerEvent) {
    this.moved = false;
    const coords = this.getRelativeCoordinates(event);

    const hit = this.getElementAt(coords);

    if (hit) {
      const wasSelected = this._selected.includes(hit);

      if (!wasSelected && this.onSelect(hit))
        this.select(hit, { keepSelection: event.shiftKey });

      this.mouseDownTarget = {
        element: hit,
        wasSelected
      };
    } else {
      this.mouseDownTarget = null;
    }

    this.dragStart = {
      ...coords,
      startPositions: this._selected.map((shape) => ({
        x: shape.x,
        y: shape.y
      }))
    };
  }

  private onMouseUp = (event: PointerEvent) => {
    this.clearLongPress();
    if (this.longPressed) {
      this.longPressed = false;
      this.dragStart = null;
      return;
    }
    const isRightClick = event.button === 2;
    if (!this.dragStart) return;

    if (this.moved) {
      this.handleDragEnd({
        from: this.dragStart!,
        to: this.getRelativeCoordinates(event),
        element: this.mouseDownTarget?.element ?? null
      });
      return;
    } else {
      const hit = this.getElementAt(this.dragStart!);
      // needs to be more complicated since selected state is set in mouseDown listener
      const alreadySelected = (() => {
        if (!hit) return false;
        if (this.mouseDownTarget) return this.mouseDownTarget.wasSelected;
        return this._selected.includes(hit);
      })();

      this.handleClick({
        coords: this.getRelativeCoordinates(event),
        hit,
        alreadySelected,
        shiftPressed: event.shiftKey,
        isRightClick
      });
    }
  };

  /**
   * Information about the first click/mouse down when dragging an element
   */
  private dragStart: // position of the first click/mouse down
  | (MathPoint & {
        // positions of selected elements at the time of the first click/mouse down
        startPositions: MathPoint[];
      })
    | null = null;
  private onMouseMove = (event: PointerEvent) => {
    event.stopPropagation();
    const coords = this.getRelativeCoordinates(event);

    // when somehow the mouseup event is not fired, we still want to stop dragging -> can occur when user pressed alt+tab while dragging
    if (event.buttons !== 1) {
      this.clickTargetEle.style.cursor = this.upadateCursor(coords);
      if (this.moved) {
        this.handleDragEnd({
          from: this.dragStart!,
          to: coords,
          element: this.mouseDownTarget?.element ?? null
        });
        this.moved = false;
      }
      this.handleMouseMove({ current: coords });
      return;
    }

    // set moved to true if we moved more than threshold
    if (
      !this.moved &&
      this.dragStart &&
      Calc.distance(coords, this.dragStart) > 5
    ) {
      this.moved = true;
      this.clearLongPress();

      this.handleDragStart({
        start: this.dragStart,
        hit: this.getElementAt(this.dragStart!)
      });
    }

    this.handleDragging({
      start: this.dragStart!,
      current: coords,
      dragStart: this.dragStart!,
      element: this.mouseDownTarget?.element ?? null
    });
  };

  protected keys = {
    alt: false,
    shift: false,
    ctrl: false
  };
  /** Remembers the modifier keys of the last key event for snapping and multi-select. */
  setKeys(event: KeyboardEvent) {
    this.keys = {
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey
    };
  }

  protected abstract handleClick(_event: {
    coords: MathPoint;
    hit: Draggable | null;
    alreadySelected: boolean;
    shiftPressed: boolean;
    isRightClick: boolean;
  }): void;
  protected abstract handleMouseMove(_event: { current: MathPoint }): void;
  protected abstract handleDragStart(_event: {
    start: MathPoint;
    hit: Draggable | null;
  }): void;
  protected abstract handleDragging(_event: {
    start: MathPoint;
    current: MathPoint;
    element: Draggable | null;
    dragStart: MathPoint & { startPositions: MathPoint[] };
  }): void;
  protected abstract handleDragEnd(_event: {
    from: MathPoint;
    to: MathPoint;
    element: Draggable | null;
  }): void;
  protected upadateCursor(_coords: MathPoint): CSSStyleDeclaration['cursor'] {
    return 'default';
  }
  protected onSelect(_element: Draggable): boolean {
    return true;
  }

  private onWindowResize() {
    const dpr = window.devicePixelRatio || 1;
    if (dpr !== this._currentDpr) {
      this._currentDpr = dpr;
      this.handleCanvasResize();
    }
  }
  protected abstract handleCanvasResize(): void;

  protected get selected() {
    return this._selected;
  }

  select(
    shape: Draggable | Draggable[],
    options: { keepSelection?: boolean } = {}
  ) {
    const { keepSelection = false } = options;

    if (!keepSelection) this.blur(null, false);

    const shapes = Array.isArray(shape) ? shape : [shape];
    for (const shape of shapes) {
      if (!this._selected.includes(shape)) {
        this._selected.push(shape);
        shape.select();
      }
    }
    this.onSelectionChange();
    this.requestRedraw();
  }

  blur(element?: Draggable | null, triggerEvent: boolean = true) {
    if (element) {
      const index = this._selected.indexOf(element);
      if (index < 0) return;
      this._selected.splice(index, 1);
      element.blur();
    } else {
      this._selected.forEach((shape) => shape.blur());
      this._selected = [];
    }
    if (triggerEvent) this.onSelectionChange();
    this.requestRedraw();
  }

  private onSelectionChange() {
    this.dispatchEvent(
      new CustomEvent('selectionupdate', { detail: this._selected })
    );
  }
}
