import SelectionRect from '../components/SelectionRect';
import Line from '../elements/Line';
import Point from '../elements/Point';
import Shape from '../elements/Shape';
import Draggable from '../elements/base/Draggable';
import Calc, { MathPoint } from '../helper/Calc';
import ChildrenManager from './ChildrenManager';
import { WwGeomContextMenu } from '/components/context-menu/ww-geom-context-menu';

export type InteractionMode = 'select' | 'create';

export default class InteractionManager extends ChildrenManager {
  private wrapper: HTMLElement;
  private _mode: InteractionMode = 'select';

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
  }

  private canUseSelectRect() {
    return this._mode === 'select';
  }

  protected redraw(ctx: CanvasRenderingContext2D): void {
    super.redraw(ctx);
    this.selectionRect?.draw(ctx);
    this.ghostLine?.draw(ctx);
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
    this.moved = false;
    const coords = this.getRelativeCoordinates(event);

    const hit = this.getElementAt(coords);

    if (hit) {
      const wasSelected = this._selected.includes(hit);

      if (!wasSelected) this.select(hit, { keepSelection: event.ctrlKey });

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
    const isRightClick = 'button' in event && event.button === 2;

    if (this.moved) {
      this.handleDragEnd({
        from: this.dragStart!,
        to: this.getRelativeCoordinates(event),
        ctrlKeyPressed: event.ctrlKey
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
  private dragStart: {
    // position of the first click/mouse down
    x: number;
    y: number;
    // positions of selected elements at the time of the first click/mouse down
    startPositions: { x: number; y: number }[];
  } | null = null;
  private onMouseMove(event: MouseEvent | TouchEvent) {
    const coords = this.getRelativeCoordinates(event);

    // when somehow the mouseup event is not fired, we still want to stop dragging -> can occur when user pressed alt+tab while dragging
    if ('buttons' in event && event.buttons !== 1) {
      this.upadateCursor(coords);
      if (this.moved) {
        this.handleDragEnd({
          from: this.dragStart!,
          to: coords,
          ctrlKeyPressed: event.ctrlKey
        });
        this.moved = false;
      }
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
        ctrlKeyPressed: event.ctrlKey,
        hit: this.getElementAt(this.dragStart!)
      });
    }

    this.handleDragging({
      start: this.dragStart!,
      current: coords
    });
  }

  private handleContextMenu(event: MouseEvent) {
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

  private handleClick({
    hit,
    alreadySelected,
    ctrlPressed,
    isRightClick,
    coords
  }: {
    coords: MathPoint;
    hit: Draggable | null;
    alreadySelected: boolean;
    ctrlPressed: boolean;
    isRightClick: boolean;
  }) {
    switch (this._mode) {
      case 'select':
        if (!this.canUseSelectRect()) this.selectionRect = null;
        if (this.selectionRect) {
          const newSelections = this.selectionRect.getSelectedElements(
            this.getChildren()
          );
          this.select(newSelections, { keepSelection: ctrlPressed });
          this.selectionRect = null;
          this.requestRedraw();
          return;
        }

        // do not unselect on context menu
        if (isRightClick && alreadySelected) break;

        if (hit) {
          if (alreadySelected) {
            if (ctrlPressed) {
              // when clicking on a selected element while holding ctrl, we want to deselect it
              this.blur(hit);
            } else {
              // blur clicked element / blur everything
              this.blur(hit);
            }
          } else {
            if (ctrlPressed) {
              // when clicking on an unselected element while holding ctrl, we want to select it and keep the other elements selected
              this.select(hit, { keepSelection: true });
            } else {
              // when clicking on an unselected element while not holding ctrl, we want to select it and deselect the other elements
              this.select(hit, { keepSelection: false });
            }
          }
        } else {
          if (!ctrlPressed) this.blur();
        }
        break;
      case 'create':
        if (!hit) {
          // create new point
          const shape = Shape.createPoint(this, coords);
          this.addShape(shape);
        } else if (hit instanceof Line) {
          // create new point in line
          const shape = this.getChildren().find((shape) => shape.hasChild(hit));
          if (!shape) {
            console.log('no shape');
            break;
          }
          const point = new Point(this, coords);
          shape.addPoint(point);
          this.requestRedraw();
        }
        break;
    }
  }

  private ghostLine: Line | null = null;
  private selectionRect: SelectionRect | null = null;
  private handleDragStart({
    ctrlKeyPressed,
    start,
    hit
  }: {
    start: MathPoint;
    ctrlKeyPressed: boolean;
    hit: Draggable | null;
  }) {
    switch (this._mode) {
      case 'select':
        // only draw selection rect if we're not dragging an element
        if (!this.mouseDownTarget) {
          if (!ctrlKeyPressed) this.blur();
          this.selectionRect = new SelectionRect({
            x: this.dragStart!.x,
            y: this.dragStart!.y
          });
        }
        break;
      case 'create':
        // if dragging point -> create line starting at point
        if (hit) {
          this.ghostLine = new Line(this, {
            start: {
              x: hit.x,
              y: hit.y
            },
            end: start
          });
          this.ghostLine.setStroke('#000000b0');
        }
    }
  }

  private handleDragging({
    start,
    current
  }: {
    start: MathPoint;
    current: MathPoint;
  }) {
    switch (this._mode) {
      case 'select':
        if (this._selected.length > 0 && this.mouseDownTarget) {
          // drag currently selected element
          const change = {
            x: current.x - start.x,
            y: current.y - start.y
          };

          this._selected.forEach((shape, index) => {
            const startCoords = this.dragStart!.startPositions[index];
            const x = startCoords.x + change.x;
            const y = startCoords.y + change.y;
            // prevent moving element twice (move element and its parent)
            if (!this._selected.some((child) => child.hasChild(shape)))
              shape.move({ x, y, relative: false });
          });

          this.requestRedraw();
        } else {
          // draw selection rect
          if (this.selectionRect) {
            this.selectionRect.setSecondCoords(current);
            this.requestRedraw();
          }
        }
        break;
      case 'create':
        if (this.ghostLine) this.ghostLine.setEnd(current);
        this.requestRedraw();
        break;
    }
  }

  private handleDragEnd({
    from,
    to,
    ctrlKeyPressed
  }: {
    from: MathPoint;
    to: MathPoint;
    ctrlKeyPressed: boolean;
  }) {
    switch (this._mode) {
      case 'select':
        if (this.selectionRect) {
          const newSelections = this.selectionRect.getSelectedElements(
            this.getChildren()
          );
          this.select(newSelections, { keepSelection: ctrlKeyPressed });
          this.selectionRect = null;
        }
        break;
      case 'create':
        if (this.ghostLine && this.mouseDownTarget) {
          // create new line from point -> check if lands on point -> end on point + merge shapes
          const end = this.getElementAt(to) ?? Shape.createPoint(this, to);
          const start = this.mouseDownTarget;
        }
        break;
    }
    this.ghostLine = null;
    this.selectionRect = null;
    this.requestRedraw();
  }

  private upadateCursor(coords: MathPoint) {
    // check if we're hovering over a draggable element and change cursor accordingly
    const hit = this.getElementAt(coords);
    switch (this.mode) {
      case 'select':
        this.clickTargetEle.style.cursor = hit ? 'grab' : 'default';
        break;
      case 'create':
        this.clickTargetEle.style.cursor = hit ? 'crosshair' : 'pointer';
        break;
    }
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

  public get mode() {
    return this._mode;
  }

  public set mode(mode: typeof this._mode) {
    this._mode = mode;
  }
}
