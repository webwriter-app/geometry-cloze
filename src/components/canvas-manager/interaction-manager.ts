import { MathPoint } from '../../model/calc';
import Draggable from '../elements/base/draggable';
import Line from '../elements/line';
import Point from '../elements/point';
import Shape from '../elements/shape';
import SelectionRect from '../selection-rect';
import EventManager from './event-manager';
import DividerLine from '../elements/divider-line';
import CanvasManager from './canvas-manager';
import SHOELACE from '../shoelace';

const SNAP_SPACING = 50;

export default class InteractionManager extends EventManager {
  private _mode: InteractionMode = 'select';
  protected _snapSpacing: number | null = SNAP_SPACING;
  private snap<Value extends number | MathPoint>(value: Value): Value {
    if (this._snapSpacing === null || this.keys.alt) return value;
    if (typeof value === 'object') {
      return {
        ...value,
        x: this.snap(value.x),
        y: this.snap(value.y)
      } as Value;
    } else
      return (Math.round((value as number) / this._snapSpacing) *
        this._snapSpacing) as Value;
  }
  public get snapping() {
    return this._snapSpacing !== null;
  }
  public toggleSnapping(snapping = !this.snapping, rerender = true) {
    this._snapSpacing = snapping ? SNAP_SPACING : null;
    // request redraw is not neccessary but requestRedraw also triggers an update (-> updates the attributes of the webcomponent)
    if (rerender) this.requestRedraw();
  }

  private _showGrid = true;
  public get showGrid() {
    return this._showGrid;
  }
  public toggleGrid(show = !this.showGrid) {
    this._showGrid = show;
    this.requestRedraw();
  }

  protected baseScale = 1 / 50;
  protected _scale: number = 1;
  public get scale() {
    return this._scale * this.baseScale;
  }
  public get scaleFactor() {
    return this._scale;
  }
  public setScale(scale: number | null) {
    this._scale = scale || 1;
    this.requestRedraw();
  }

  /** The font of the labels and the accent of selection and cursor follow the document theme. */
  private themeValue(name: string) {
    return getComputedStyle(this.wrapper).getPropertyValue(name).trim();
  }
  /** Set by an export, whose detached canvas has no computed style. */
  public fontFamilyOverride = '';
  public get fontFamily() {
    return (
      this.fontFamilyOverride ||
      this.themeValue('--ww-font-family') ||
      SHOELACE.font.sans
    );
  }
  public get accentColor() {
    return (
      this.themeValue('--ww-theme-accent-1') ||
      this.themeValue('--sl-focus-ring-color') ||
      SHOELACE.focus.ringColor
    );
  }

  protected redraw(ctx: CanvasRenderingContext2D): void {
    super.redraw(ctx);
    if (this.showGrid) {
      const spacing = SNAP_SPACING;
      ctx.strokeStyle = SHOELACE.color.neutral[300];
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      const { width, height } = this.getCanvasDimensions();
      // Skip first lines to not draw right on the edge of the canvas and interfere with border
      for (let x = spacing; x < width; x += spacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = spacing; y < height; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }
    if (!this.printing) this.selectionRect?.draw(ctx, this.accentColor);
    this.ghostLine?.draw(ctx);
    this.ghostDividerLine?.draw(ctx);

    // reverse order so that the first shape is on top
    for (const shape of this.getChildren().reverse()) {
      if (shape.hidden) continue;
      shape.draw(ctx);
    }
    if (!this.printing) this.drawKeyboardCursor(ctx);
  }

  private printing = false;
  private printedSelection: Draggable[] = [];

  /** Draws the figure once without selection and cursor, synchronously, because paper cannot wait for a frame. */
  public beginPrint() {
    if (this.printing) return;
    this.printing = true;
    this.printedSelection = [...this.selected];
    this.printedSelection.forEach((shape) => shape.blur());
    this.redraw(this._ctx);
  }

  public endPrint() {
    if (!this.printing) return;
    this.printing = false;
    this.printedSelection.forEach((shape) => {
      if (this.selected.includes(shape)) shape.select();
    });
    this.printedSelection = [];
    this.requestRedraw();
  }

  /** Draws the objects only, without grid, selection or cursor. */
  public drawFigure(ctx: CanvasRenderingContext2D) {
    for (const shape of this.getChildren().reverse()) {
      if (!shape.hidden) shape.draw(ctx);
    }
  }

  /** Where Enter acts when the canvas is used with the keyboard; null while the pointer is in use. */
  private cursor: MathPoint | null = null;

  private drawKeyboardCursor(ctx: CanvasRenderingContext2D) {
    if (!this.cursor) return;
    const { x, y } = this.cursor;
    ctx.save();
    ctx.strokeStyle = this.accentColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x - 14, y);
    ctx.lineTo(x + 14, y);
    ctx.moveTo(x, y - 14);
    ctx.lineTo(x, y + 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  protected pointerStarted() {
    this.hideKeyboardCursor();
  }

  public hideKeyboardCursor() {
    if (!this.cursor) return;
    this.cursor = null;
    this.requestRedraw();
  }

  /** Selectable objects in a fixed order: each shape, its points, then its lines. */
  private selectableObjects(): Draggable[] {
    return this.getChildren()
      .flatMap((child): Draggable[] =>
        child instanceof Shape
          ? [child, ...child.getPoints(), ...child.getLines()]
          : child instanceof Draggable
            ? [child]
            : []
      )
      .filter((object) => this.canSelect(object));
  }

  /** Moves the selection to the next or previous object. */
  public selectNeighbor(step: 1 | -1) {
    const objects = this.selectableObjects();
    if (!objects.length) return;
    const current = this.selected.length === 1 ? objects.indexOf(this.selected[0]) : -1;
    const index = current < 0 ? (step > 0 ? 0 : objects.length - 1) : (current + step + objects.length) % objects.length;
    this.hideKeyboardCursor();
    this.select(objects[index]);
  }

  private moveCursor(dx: number, dy: number) {
    const { width, height } = this.getCanvasDimensions();
    const from = this.cursor ?? { x: width / 2, y: height / 2 };
    const next = this.cursor ? { x: from.x + dx, y: from.y + dy } : from;
    const snapped = this._snapSpacing && !this.keys.alt ? this.snap(next) : next;
    this.cursor = {
      x: Math.min(width, Math.max(0, snapped.x)),
      y: Math.min(height, Math.max(0, snapped.y))
    };
    this.ghostLine?.setEnd(this.cursor);
    this.ghostDividerLine?.setEnd(this.cursor);
    this.requestRedraw();
  }

  private nudgeSelection(dx: number, dy: number) {
    const moveToken = Symbol('nudge');
    this.selected.forEach((shape) => {
      if (!this.selected.some((other) => other.hasChild(shape)))
        shape.move({ x: dx, y: dy, relative: true, moveToken });
    });
    this.requestRedraw();
  }

  /** Does what a click at the keyboard cursor does. */
  private activateCursor(shiftPressed: boolean) {
    if (!this.cursor) {
      this.moveCursor(0, 0);
      return;
    }
    const coords = this.cursor;
    if (this._mode === 'divider') {
      if (this.ghostDividerLine) {
        this.ghostDividerLine.setEnd(coords);
        this.addChild(this.ghostDividerLine);
        this.ghostDividerLine = null;
      } else {
        this.ghostDividerLine = new DividerLine(this as unknown as CanvasManager, { start: coords, end: coords });
      }
      this.requestRedraw();
      return;
    }
    const hit = this.getElementAt(coords);
    (this as unknown as CanvasManager).handleClick({
      coords,
      hit,
      alreadySelected: hit ? this.selected.includes(hit) : false,
      shiftPressed,
      isRightClick: false
    });
  }

  /**
   * Keyboard control of the canvas: arrows move the selection, or the cursor
   * when nothing is selected; Enter or Space acts at the cursor; Page Up and
   * Page Down step through the objects. Returns whether the key was used.
   */
  public handleKey(event: KeyboardEvent): boolean {
    if (event.ctrlKey || event.metaKey) return false;
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1]
    };
    const direction = arrows[event.key];
    if (direction) {
      const base = this._snapSpacing ?? 10;
      const step = event.altKey ? (this._snapSpacing ? 10 : 1) : base;
      const [dx, dy] = [direction[0] * step, direction[1] * step];
      if (this.selected.length && this._mode === 'select') this.nudgeSelection(dx, dy);
      else this.moveCursor(dx, dy);
      return true;
    }
    switch (event.key) {
      case 'Enter':
      case ' ':
        this.activateCursor(event.shiftKey);
        return true;
      case 'PageDown':
      case 'PageUp':
        this.selectNeighbor(event.key === 'PageDown' ? 1 : -1);
        return true;
    }
    return false;
  }

  /**
   * When creating a shape in create mode
   */
  private creatingShape: { shape: Shape; lastPoint: Point } | null = null;
  protected handleClick(
    this: CanvasManager,
    {
      hit,
      shiftPressed,
      alreadySelected,
      isRightClick,
      coords
    }: {
      coords: MathPoint;
      hit: Draggable | null;
      alreadySelected: boolean;
      shiftPressed: boolean;
      isRightClick: boolean;
    }
  ) {
    coords = this.snap(coords);
    switch (this._mode) {
      case 'select':
      case 'divider':
        if (this.selectionRect) {
          const newSelections = this.selectionRect.getSelectedElements(
            this.getChildren()
          );
          this.select(newSelections, { keepSelection: shiftPressed });
          this.selectionRect = null;
          this.requestRedraw();
          return;
        }

        // do not unselect on context menu
        if (isRightClick && alreadySelected) break;

        // do not select certain objects
        if (hit && !this.canSelect(hit)) break;

        if (hit) {
          if (alreadySelected) {
            if (shiftPressed) {
              // when clicking on a selected element while holding shift, we want to deselect it
              this.blur(hit);
            } else {
              // blur clicked element / blur everything
              this.blur(hit);
            }
          } else {
            if (shiftPressed) {
              // when clicking on an unselected element while holding shift, we want to select it and keep the other elements selected
              this.select(hit, { keepSelection: true });
            } else {
              // when clicking on an unselected element while not holding shift, we want to select it and deselect the other elements
              this.select(hit, { keepSelection: false });
            }
          }
        } else {
          if (!shiftPressed) this.blur();
        }
        break;
      case 'create':
        if (!hit) {
          if (isRightClick) {
            this.ghostLine = null;
            this.creatingShape = null;
          } else {
            if (this.creatingShape) {
              // add point to creating shape
              const point = this.creatingShape.shape.addPoint(
                coords,
                this.creatingShape.lastPoint
              );
              if (point) this.creatingShape.lastPoint = point;

              this.requestRedraw();
            } else {
              // create new point
              const shape = Shape.createPoint(this, coords);
              this.addChild(shape);
              this.creatingShape = {
                shape,
                lastPoint: shape.getPoints()[0]
              };
            }
            this.ghostLine = new Line(this, {
              start: coords,
              end: coords
            });
            this.ghostLine.setStroke('#000000b0');
          }
        } else if (hit instanceof Line) {
          // create new point in line
          const shape = (
            this.getChildren((s) => s instanceof Shape) as Shape[]
          ).find((shape) => shape.hasChild(hit));
          if (!shape) break;
          const point = new Point(this, coords);
          shape.addPoint(point);
          this.requestRedraw();
        } else if (hit instanceof Point) {
          if (this.creatingShape) {
            const isLastPoint = hit === this.creatingShape.lastPoint;
            const isEndpoint = this.creatingShape.shape.isEndPoint(hit);
            const isChild = this.creatingShape.shape.hasChild(hit);
            // when clicking on other endpoint -> connect
            if (!isLastPoint && isEndpoint) {
              this.creatingShape.shape.connectPoints(
                hit,
                this.creatingShape.lastPoint
              );
              this.ghostLine = null;
              this.creatingShape = null;
            } else if (isChild) {
              // when clicking on any other point of same shape -> end creating shape
              this.ghostLine = null;
              this.creatingShape = null;
            } else {
              // when clicking on an endpoint of another shape -> connect
              const shape = (
                this.getChildren((s) => s instanceof Shape) as Shape[]
              ).find((shape) => shape.hasChild(hit));
              if (!shape || !shape.isEndPoint(hit)) break;
              this.creatingShape.shape.connect(
                shape,
                this.creatingShape.lastPoint,
                hit
              );
              this.ghostLine = null;
              this.creatingShape = null;
            }
          }
        }
        break;
    }
  }

  protected handleMouseMove({ current }: { current: MathPoint }) {
    switch (this.mode) {
      case 'create':
        if (this.ghostLine) this.ghostLine.setEnd(current);
        this.requestRedraw();
        break;
    }
  }

  private ghostLine: Line | null = null;
  private ghostDividerLine: DividerLine | null = null;
  private selectionRect: SelectionRect | null = null;
  protected handleDragStart(
    this: CanvasManager,
    {
      start,
      hit
    }: {
      start: MathPoint;
      hit: Draggable | null;
    }
  ) {
    switch (this._mode) {
      case 'select':
        // only draw selection rect if we're not dragging an element
        if (!hit) {
          if (!this.keys.shift) this.blur();
          this.selectionRect = new SelectionRect({
            x: start.x,
            y: start.y
          });
        }
        break;
      case 'create':
        // if dragging point -> create line starting at point
        if (hit && hit instanceof Point) {
          const shape = (
            this.getChildren((s) => s instanceof Shape) as Shape[]
          ).find((shape) => shape.hasChild(hit));
          if (!shape || !shape.isEndPoint(hit)) break;
          this.ghostLine = new Line(this, {
            start: {
              x: hit.x,
              y: hit.y
            },
            end: start
          });
          this.ghostLine.setStroke('#000000b0');
        }
        break;
      case 'divider':
        if (!hit || !this.canSelect(hit))
          // create line from startPoint
          this.ghostDividerLine = new DividerLine(this, {
            start: this.snap(start),
            end: this.snap(start)
          });
        break;
    }
  }

  protected handleDragging({
    start,
    current,
    element,
    dragStart
  }: {
    start: MathPoint;
    current: MathPoint;
    element: Draggable | null;
    dragStart: MathPoint & { startPositions: MathPoint[] };
  }) {
    switch (this._mode) {
      case 'select':
      case 'divider':
        if (this.ghostDividerLine) {
          this.ghostDividerLine.setEnd(this.snap(current));
          this.requestRedraw();
        }

        if (this.selected.length > 0 && element) {
          // drag currently selected element
          const change = {
            x: current.x - start.x,
            y: current.y - start.y
          };

          const moveToken = Symbol('dragging-step');
          this.selected.forEach((shape, index) => {
            const startCoords = dragStart.startPositions[index];
            const x = this.snap(startCoords.x + change.x);
            const y = this.snap(startCoords.y + change.y);

            // prevent moving element twice (move element and its parent)
            if (!this.selected.some((child) => child.hasChild(shape)))
              shape.move({ x, y, relative: false, moveToken });
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
        if (this.ghostLine) {
          this.ghostLine.setEnd(current);
          this.requestRedraw();
        }
        break;
    }
  }

  protected handleDragEnd(
    this: CanvasManager,
    {
      to,
      element
    }: {
      from: MathPoint;
      to: MathPoint;
      element: Draggable | null;
    }
  ) {
    switch (this._mode) {
      case 'select':
        if (this.selectionRect) {
          const newSelections = this.selectionRect.getSelectedElements(
            this.getChildren()
          );
          this.select(newSelections, { keepSelection: this.keys.shift });
          this.selectionRect = null;
        }
        if (element) {
          // snap to grid
          element.move({
            relative: false,
            x: this.snap(element.x),
            y: this.snap(element.y)
          });
        }
        break;
      case 'create':
        if (this.ghostLine && element) {
          // create new line from point -> check if lands on point -> end on point + merge shapes
          const hitElement = this.getElementAt(to);
          if (hitElement instanceof Point) {
            const end = hitElement;
            const start = element;

            const children = this.getChildren(
              (s) => s instanceof Shape
            ) as Shape[];
            const shape1 = children.find((shape) => shape.hasChild(start));
            const shape2 =
              end instanceof Shape
                ? end
                : children.find((shape) => shape.hasChild(end));

            if (shape1 && shape2) shape1.connect(shape2, element as Point, end);
          }
        }
        this.ghostLine = null;
        break;
      case 'divider':
        if (this.ghostDividerLine) {
          this.addChild(this.ghostDividerLine);
          this.ghostDividerLine = null;
        }
    }
    this.selectionRect = null;
    this.requestRedraw();
  }

  protected upadateCursor(coords: MathPoint): CSSStyleDeclaration['cursor'] {
    // check if we're hovering over a draggable element and change cursor accordingly
    const hit = this.getElementAt(coords);
    const canSelect = Boolean(hit && this.canSelect(hit));
    switch (this.mode) {
      case 'select':
        return hit && canSelect ? 'grab' : 'default';
      case 'create':
        if (hit && hit instanceof Point) {
          const shape = (
            this.getChildren((s) => s instanceof Shape) as Shape[]
          ).find((shape) => shape.hasChild(hit));
          const isEndPoint = shape?.isEndPoint(hit);
          return isEndPoint ? 'crosshair' : 'default';
        } else return 'pointer';
      case 'divider':
        return canSelect ? 'grab' : 'pointer';
      default:
        return 'default';
    }
  }

  /** Deletes the selected elements. */
  deleteSelection() {
    this.selected.forEach((shape) => shape.delete());
    this.blur();
  }

  /** Leaves the current tool step: clears the selection, or the half-made shape or line. */
  cancel() {
    switch (this.mode) {
      case 'select':
        this.blur();
        break;
      case 'create':
        this.ghostLine = null;
        this.creatingShape = null;
        this.mode = 'select';
        this.requestRedraw();
        break;
      case 'divider':
        this.ghostDividerLine = null;
        this.mode = 'select';
        this.requestRedraw();
        break;
    }
  }

  /** Selects everything that can be selected, in select mode. */
  selectAll() {
    if (this.mode !== 'select') return;
    this.select(this.getChildren((child) => this.canSelect(child)));
  }

  public canSelect(element: Draggable): boolean {
    if (this.mode === 'divider') {
      if (element instanceof DividerLine) return true;
      if (
        this.getChildren((child) => child instanceof DividerLine).some((line) =>
          line.hasChild(element)
        )
      )
        return true;
      return false;
    }
    return true;
  }

  protected handleCanvasResize(): void {
    const elementBounds = this.wrapper.getBoundingClientRect();
    const canvasDimensions = this.getCanvasDimensions();
    const scale =
      (elementBounds.width / canvasDimensions.width) * window.devicePixelRatio;
    this.resizeCanvas(
      elementBounds.width * window.devicePixelRatio,
      elementBounds.height * window.devicePixelRatio,
      scale
    );
    this.requestRedraw();
  }

  public get mode() {
    return this._mode;
  }

  public set mode(mode: typeof this._mode) {
    this._mode = mode;
    this.ghostLine = null;
    this.creatingShape = null;
    this.ghostDividerLine = null;
    if (mode === 'divider') this.blur();
    else {
      this.getChildren((child) => child instanceof DividerLine).forEach(
        (line) => this.blur(line)
      );
    }
    this.dispatchEvent(new CustomEvent('modeupdate', { detail: mode }));
    this.requestRedraw();
  }

  public export() {
    return {
      ...super.export(),
      mode: this.mode,
      showGrid: this.showGrid,
      snapping: this.snapping,
      scaleFactor: this._scale
    };
  }

  public import(data: Partial<ReturnType<this['export']>>) {
    if (data.mode) this._mode = data.mode;
    if (data.showGrid !== undefined) this._showGrid = data.showGrid;
    if (data.snapping !== undefined) this.toggleSnapping(data.snapping, false);
    if (data.scaleFactor !== undefined) this._scale = data.scaleFactor;
    super.import(data);
  }
}
