import SelectionRect from '../components/SelectionRect';
import Point from '../elements/Point';
import Shape from '../elements/Shape';
import Draggable from '../elements/base/Draggable';
import Calc, { MathPoint } from '../helper/Calc';
import ChildrenManager from './ChildrenManager';
import { WwGeomContextMenu } from '/components/context-menu/ww-geom-context-menu';

export type InteractionMode = 'drag' | 'connect';

export default class InteractionManager extends ChildrenManager {
  private wrapper: HTMLElement;
  private _mode: InteractionMode = 'drag';

  private clickTargetEle: HTMLDivElement;
  private contextMenu: WwGeomContextMenu;

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
  private selectionRect: SelectionRect | null = null;
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

  constructor(canvas: HTMLCanvasElement, contextMenu: WwGeomContextMenu) {
    super(canvas);
    this.wrapper = canvas;
    this.contextMenu = contextMenu;

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
    return this._mode === 'drag';
  }

  protected redraw(ctx: CanvasRenderingContext2D): void {
    super.redraw(ctx);
    this.selectionRect?.draw(ctx);
  }

  private preventTouchScroll(event: TouchEvent) {
    event.preventDefault();
  }

  private canSelectMultiple(event: MouseEvent | TouchEvent) {
    return event.ctrlKey;
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

  private onMouseDown(event: MouseEvent | TouchEvent) {
    this.moved = false;
    const coords = this.getRelativeCoordinates(event);

    const hit = this.getElementAt(coords);

    if (hit) {
      const wasSelected = this._selected.includes(hit);

      if (!wasSelected)
        this.select(hit, { keepSelection: this.canSelectMultiple(event) });

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

    const canSelectMultiple = this.canSelectMultiple(event);

    if (!this.canUseSelectRect()) this.selectionRect = null;
    if (this.selectionRect) {
      const newSelections = this.selectionRect.getSelectedElements(
        this.getChildren()
      );
      this.select(newSelections, { keepSelection: canSelectMultiple });
      this.selectionRect = null;
      this.requestRedraw();
      return;
    }

    // when the user dragged the mouse, we don't want to select anything
    if (this.moved) return;

    const hit = this.getElementAt(this.dragStart!);

    // click on hit element

    // clicked on nothing
    if (!hit) {
      if (!canSelectMultiple) this.blur();
      return;
    }

    // needs to be more complicated since selected state is set in mouseDown listener
    const alreadySelected = (() => {
      if (this.mouseDownTarget) return this.mouseDownTarget.wasSelected;
      return this._selected.includes(hit);
    })();

    // do not unselect on context menu
    if (isRightClick && alreadySelected) return;

    if (this._mode === 'drag') {
      if (alreadySelected) {
        if (canSelectMultiple) {
          // when clicking on a selected element while holding ctrl, we want to deselect it
          this.blur(hit);
        } else {
          if (this._selected.length > 1) {
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
    } else if (this._mode === 'connect') {
      // TODO: rewrite - no more points only shapes
      if (hit instanceof Point) {
        if (this._selected.length === 0) {
          this.select(hit);
        } else {
          if (alreadySelected) this.blur();
          else {
            const point1 = this._selected[0];
            const line = new Shape(this, [
              point1,
              {
                start: point1,
                end: hit
              },
              hit
            ]);
            point1.delete();
            hit.delete();
            this.addShape(line);
          }
        }
      }
    }
  }

  private onMouseMove(event: MouseEvent | TouchEvent) {
    const coords = this.getRelativeCoordinates(event);

    // when somehow the mouseup event is not fired, we still want to stop dragging -> can occur when user pressed alt+tab while dragging
    if ('buttons' in event && event.buttons !== 1) {
      this.upadateCursor(coords);
      return;
    }

    // set moved to true if we moved more than threshold
    if (
      !this.moved &&
      this.dragStart &&
      Calc.distance(coords, this.dragStart) > 5
    ) {
      this.moved = true;

      // only draw selection rect if we're not dragging an element
      if (!this.mouseDownTarget) {
        if (!this.canSelectMultiple(event)) this.blur();
        if (this._mode === 'drag')
          this.selectionRect = new SelectionRect({
            x: this.dragStart!.x,
            y: this.dragStart!.y
          });
      }
    }

    if (this._selected.length > 0 && this.mouseDownTarget) {
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
      // draw selection rect
      if (this.selectionRect) {
        this.selectionRect.setSecondCoords(coords);
        this.requestRedraw();
      }
    }
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

  private upadateCursor(coords: MathPoint) {
    // check if we're hovering over a draggable element and change cursor accordingly
    const hit = this.getElementAt(coords);
    this.clickTargetEle.style.cursor = hit ? 'pointer' : 'default';
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

  public get mode() {
    return this._mode;
  }

  public set mode(mode: typeof this._mode) {
    this._mode = mode;
  }
}
