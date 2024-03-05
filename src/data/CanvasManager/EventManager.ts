import Calc, { MathPoint } from '../helper/Calc';
import Draggable from '../elements/base/Draggable';
import ChildrenManager from './ChildrenManager';
import { WwGeomContextMenu } from '../../components/context-menu/ww-geom-context-menu';

export default abstract class EventManager extends ChildrenManager {
  private wrapper: HTMLElement;

  private clickTargetEle: HTMLElement;
  private contextMenu: WwGeomContextMenu;
  /**
   * Currently selected element
   */
  private _selected: Draggable[] = [];

  constructor(canvas: HTMLCanvasElement, contextMenu: WwGeomContextMenu) {
    super(canvas);
    this.wrapper = canvas;
    this.contextMenu = contextMenu;

    this.clickTargetEle = canvas;

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

    this.clickTargetEle.addEventListener(
      'contextmenu',
      this.handleContextMenu.bind(this)
    );
    document.addEventListener('keydown', this._handleKeyboardEvent.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
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
    this.clickTargetEle.removeEventListener(
      'touchmove',
      this.preventTouchScroll
    );
    this.clickTargetEle.removeEventListener(
      'contextmenu',
      this.handleContextMenu.bind(this)
    );
    document.removeEventListener(
      'keydown',
      this._handleKeyboardEvent.bind(this)
    );
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private preventTouchScroll(event: TouchEvent) {
    event.preventDefault();
  }

  private getRelativeCoordinates(event: MouseEvent | TouchEvent) {
    const rect = this.wrapper.getBoundingClientRect();
    const absX =
      ('clientX' in event ? event.clientX : event.touches[0].clientX) -
      rect.left;
    const absY =
      ('clientX' in event ? event.clientY : event.touches[0].clientY) -
      rect.top;

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
  private onMouseDown(event: MouseEvent | TouchEvent) {
    event.stopPropagation();
    this.moved = false;
    const coords = this.getRelativeCoordinates(event);

    const hit = this.getElementAt(coords);

    if (hit) {
      const wasSelected = this._selected.includes(hit);

      if (!wasSelected && this.onSelect(hit))
        this.select(hit, { keepSelection: event.ctrlKey });

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

  private onMouseUp(event: MouseEvent | TouchEvent) {
    event.stopPropagation();
    const isRightClick = 'button' in event && event.button === 2;

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
        ctrlPressed: event.ctrlKey,
        isRightClick
      });
    }
  }

  /**
   * Information about the first click/mouse down when dragging an element
   */
  private dragStart: // position of the first click/mouse down
  | (MathPoint & {
        // positions of selected elements at the time of the first click/mouse down
        startPositions: MathPoint[];
      })
    | null = null;
  private onMouseMove(event: MouseEvent | TouchEvent) {
    event.stopPropagation();
    const coords = this.getRelativeCoordinates(event);

    // when somehow the mouseup event is not fired, we still want to stop dragging -> can occur when user pressed alt+tab while dragging
    if ('buttons' in event && event.buttons !== 1) {
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
  }

  private handleContextMenu(event: MouseEvent) {
    event.stopPropagation();
    const coords = this.getRelativeCoordinates(event);
    const hit = this.getElementAt(coords);
    if (hit) {
      event.preventDefault();
      const menuitems = hit.getContextMenuItems();
      if (menuitems.length) {
        const localX =
          event.clientX - this.wrapper.getBoundingClientRect().left;
        const localY = event.clientY - this.wrapper.getBoundingClientRect().top;
        this.contextMenu.items = menuitems;
        this.contextMenu.open(localX, localY);
      }
    }
  }
  protected keys = {
    alt: false,
    shift: false,
    ctrl: false
  };
  private _handleKeyboardEvent(event: KeyboardEvent) {
    // ctrl+z is bubbled up to be handle outside this widget
    if (event.key.toLowerCase() === 'z' && event.ctrlKey) return;
    event.stopPropagation();
    event.preventDefault();
    this.keys = {
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey
    };
    this.handleKeyboardEvent(event.key);
  }
  private handleKeyUp(event: KeyboardEvent) {
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
    ctrlPressed: boolean;
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
  protected abstract handleKeyboardEvent(key: string): void;
  protected upadateCursor(_coords: MathPoint): CSSStyleDeclaration['cursor'] {
    return 'default';
  }
  protected onSelect(element: Draggable): boolean {
    return true;
  }

  protected get selected() {
    return this._selected;
  }

  select(
    shape: Draggable | Draggable[],
    options: { keepSelection?: boolean } = {}
  ) {
    const { keepSelection = false } = options;

    if (!keepSelection) this.blur();

    const shapes = Array.isArray(shape) ? shape : [shape];
    for (const shape of shapes) {
      if (!this._selected.includes(shape)) {
        this._selected.push(shape);
        shape.select();
      }
    }
  }

  blur(element?: Draggable | null) {
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
}
