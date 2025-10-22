import Element from '../elements/base/Element';
import Draggable from '../elements/base/Draggable';
import DividerLine from '../elements/DividerLine';
import Shape from '../elements/Shape';
import { Child } from './ChildrenTypes';
import InteractionManager from './InteractionManager';
import Point from '../elements/Point';
import Line from '../elements/Line';

export default abstract class ChildrenManager extends EventTarget {
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;

  private _canvasScale = 1;

  private children: Child[] = [];

  constructor(canvas: HTMLCanvasElement) {
    super();
    this._canvas = canvas;
    this._ctx = this._canvas.getContext('2d')!;
  }

  // pass ctx here since this method can be overwritten by super classes and can be used to render additional elements
  protected redraw(ctx: CanvasRenderingContext2D) {
    if (!ctx || !this._canvas) return;

    ctx.resetTransform();
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    ctx.scale(this._canvasScale, this._canvasScale);
  }

  protected getElementAt(point: { x: number; y: number }): Draggable | null {
    const scoreElement = (element: Draggable) => {
      if (element instanceof Shape) return 1;
      if (element instanceof Line) return 2;
      if (element instanceof Point) return 3;
      return 0;
    };

    const hit = this.children.reduce<Draggable | null>((cur, shape) => {
      if (shape instanceof Draggable) {
        const hit = shape.getHit(point)[0] ?? null;
        if (hit && this instanceof InteractionManager && this.canSelect(hit)) {
          if (!cur) return hit;
          // return the element with the highest score
          return scoreElement(hit) > scoreElement(cur) ? hit : cur;
        }
      }
      return cur;
    }, null);
    return hit;
  }

  /** Request a redraw on the next animation frame */
  private needsRender = false;
  /** Whether the redraw loop is currently running */
  private running = false;

  private _renderLoop = () => {
    if (this.needsRender) {
      this.needsRender = false;
      this.redraw(this._ctx);
      requestAnimationFrame(this._renderLoop);
    } else {
      this.running = false;
    }
  };

  requestRedraw() {
    this.needsRender = true;
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(this._renderLoop);
    }
  }

  public addChild(ele: Child, preventRedraw?: boolean) {
    this.children.push(ele);
    if (!preventRedraw) this.requestRedraw();

    ele.registerParent(this as any);
    ele.addEventListener('request-redraw', this.redraw.bind(this, this._ctx));
  }

  public removeChild(element: Child) {
    const index = this.children.indexOf(element);
    if (index < 0) return;
    this.children.splice(index, 1);
    this.requestRedraw();
  }

  public moveToTop(shape: Child) {
    const index = this.children.indexOf(shape);
    if (index < 0) return;
    const ele = this.children.splice(index, 1);
    this.children.push(...ele);
  }

  public getChildren(filter?: (child: Child) => boolean) {
    if (filter) return this.children.filter(filter);
    return this.children.slice(0);
  }

  public getCanvasDimensions(): { width: number; height: number } {
    return { width: 1000, height: 700 };
  }

  public resizeCanvas(width: number, height: number, scale: number) {
    this._canvas.width = width;
    this._canvas.height = height;
    this._canvasScale = scale;
  }

  protected getChildByID(id: number) {
    return this.children.reduce<Element | null>(
      (cur, child) => cur ?? child.getChildByID(id),
      null
    );
  }

  public export() {
    if (this.children.length)
      return {
        children: this.children.map((child) => child.export())
      };
    return {};
  }

  public import(data: Partial<ReturnType<this['export']>>) {
    const children =
      data.children?.map((child) =>
        child._type === 'divider-line'
          ? DividerLine.import(child as any, this as any)
          : Shape.import(child, this as any)
      ) ?? [];
    this.children = [];
    children.forEach((child) => this.addChild(child, true));
    this.requestRedraw();
  }
}
