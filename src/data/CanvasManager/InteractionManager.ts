import SelectionRect from '../components/SelectionRect';
import Line from '../elements/Line';
import Point from '../elements/Point';
import Shape from '../elements/Shape';
import Draggable from '../elements/base/Draggable';
import { MathPoint } from '../helper/Calc';
import EventManager from './EventManager';

export default class InteractionManager extends EventManager {
  private _mode: InteractionMode = 'select';
  private snapSpacing: number | null = 50;

  protected redraw(ctx: CanvasRenderingContext2D): void {
    super.redraw(ctx);
    this.selectionRect?.draw(ctx);
    this.ghostLine?.draw(ctx);
  }

  /**
   * When creating a shape in create mode
   */
  private creatingShape: { shape: Shape; lastPoint: Point } | null = null;
  protected handleClick({
    hit,
    ctrlPressed,
    alreadySelected,
    isRightClick,
    coords
  }: {
    coords: MathPoint;
    hit: Draggable | null;
    alreadySelected: boolean;
    ctrlPressed: boolean;
    isRightClick: boolean;
  }) {
    console.log('click');
    switch (this._mode) {
      case 'select':
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
              this.addShape(shape);
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
          const shape = this.getChildren().find((shape) => shape.hasChild(hit));
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
              const shape = this.getChildren().find((shape) =>
                shape.hasChild(hit)
              );
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
  private selectionRect: SelectionRect | null = null;
  protected handleDragStart({
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
        if (!hit) {
          if (!ctrlKeyPressed) this.blur();
          this.selectionRect = new SelectionRect({
            x: start.x,
            y: start.y
          });
        }
        break;
      case 'create':
        // if dragging point -> create line starting at point
        if (hit && hit instanceof Point) {
          const shape = this.getChildren().find((shape) => shape.hasChild(hit));
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
        if (this.selected.length > 0 && element) {
          // drag currently selected element
          const change = {
            x: current.x - start.x,
            y: current.y - start.y
          };

          this.selected.forEach((shape, index) => {
            const startCoords = dragStart.startPositions[index];
            const x = startCoords.x + change.x;
            const y = startCoords.y + change.y;
            // prevent moving element twice (move element and its parent)
            if (!this.selected.some((child) => child.hasChild(shape)))
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

  protected handleDragEnd({
    from,
    to,
    ctrlKeyPressed,
    element
  }: {
    from: MathPoint;
    to: MathPoint;
    ctrlKeyPressed: boolean;
    element: Draggable | null;
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
        if (element && this.snapSpacing) {
          // snap to grid
          const snap = (value: number) =>
            Math.round(value / this.snapSpacing!) * this.snapSpacing!;
          element.move({
            relative: false,
            x: snap(element.x),
            y: snap(element.y)
          });
        }
        break;
      case 'create':
        if (this.ghostLine && element) {
          // create new line from point -> check if lands on point -> end on point + merge shapes
          const hitElement = this.getElementAt(to);
          if (!(hitElement instanceof Point)) break;
          const end = hitElement ?? Shape.createPoint(this, to);
          const start = element;

          const children = this.getChildren();
          const shape1 = children.find((shape) => shape.hasChild(start));
          const shape2 =
            end instanceof Shape
              ? end
              : children.find((shape) => shape.hasChild(end));

          if (!shape1 || !shape2) {
            console.error("Couldn't find shapes for merging");
          } else shape1.connect(shape2, element as Point, end);
          this.ghostLine = null;
        }
        break;
    }
    this.selectionRect = null;
    this.requestRedraw();
  }

  protected upadateCursor(coords: MathPoint): CSSStyleDeclaration['cursor'] {
    // check if we're hovering over a draggable element and change cursor accordingly
    const hit = this.getElementAt(coords);
    switch (this.mode) {
      case 'select':
        return hit ? 'grab' : 'default';
      case 'create':
        if (hit && hit instanceof Point) {
          const shape = this.getChildren().find((shape) => shape.hasChild(hit));
          const isEndPoint = shape?.isEndPoint(hit);
          return isEndPoint ? 'crosshair' : 'default';
        } else return 'pointer';
      default:
        return 'default';
    }
  }

  protected handleKeyboardEvent(event: KeyboardEvent) {
    switch (this.mode) {
      case 'select':
        switch (event.key) {
          case 'c':
          case 'C':
            this.mode = 'create';
            break;
          case 'Escape':
            this.blur();
            break;
          case 'Delete':
          case 'Backspace':
            this.selected.forEach((shape) => shape.delete());
            this.blur();
            break;
        }
        break;
      case 'create':
        switch (event.key) {
          case 's':
          case 'S':
            this.mode = 'select';
            break;
          case 'Escape':
            this.ghostLine = null;
            this.creatingShape = null;
            this.mode = 'select';
            this.requestRedraw();
            break;
        }
        break;
    }
  }

  public get mode() {
    return this._mode;
  }

  public set mode(mode: typeof this._mode) {
    this._mode = mode;
    this.modeListeners(this._mode);
    this.ghostLine = null;
    this.creatingShape = null;
    this.requestRedraw();
  }

  private modeListeners: (mode: InteractionMode) => void = () => {};
  public listenForModeChange(
    listener: (mode: InteractionMode) => void
  ): () => void {
    this.modeListeners = listener;
    return () => {
      this.modeListeners = () => {};
    };
  }

  public export() {
    return {
      ...super.export(),
      mode: this._mode,
      creatingShape: this.creatingShape
        ? {
            shape: this.creatingShape.shape.id,
            lastPoint: this.creatingShape.lastPoint.id
          }
        : null,
      ghostLine: this.ghostLine?.export() ?? null
    };
  }

  public import(data: ReturnType<this['export']>) {
    super.import(data);
    this.mode = data.mode;

    if (data.creatingShape) {
      const shape = this.getChildByID(data.creatingShape.shape);
      const lastPoint = this.getChildByID(data.creatingShape.lastPoint);
      if (shape instanceof Shape && lastPoint instanceof Point) {
        this.creatingShape = { shape, lastPoint };
      } else this.creatingShape = null;
    } else this.creatingShape = null;

    this.ghostLine = data.ghostLine ? Line.import(data.ghostLine, this) : null;
  }
}
