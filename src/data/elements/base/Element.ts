import Shape from '../Shape';
import ChildrenManager from '/data/CanvasManager/ChildrenManager';
import InteractionManager from '/data/CanvasManager/InteractionManager';
import { ContextMenuItem } from '/types/ContextMenu';

export interface NamedElement {
  name?: string;
}

export default class Element {
  public name = '[unset]';
  public readonly id = ChildrenManager.getID();
  constructor(protected manager: InteractionManager) {}

  protected parent: Shape | ChildrenManager | null = null;
  private _children: Element[] = [];
  protected get children(): readonly Element[] {
    return this._children;
  }

  registerParent(element: Shape | ChildrenManager) {
    this.parent = element;
  }
  unregisterParent() {
    this.parent = null;
  }

  protected addChildAt(this: Shape, child: Element, index: number) {
    this._children.splice(index, 0, child);
    child.addEventListener('request-redraw', this.requestRedraw.bind(this));
    child.registerParent(this);
  }

  protected addChild(this: Shape, ...children: Element[]) {
    this._children.push(...children);
    children.forEach((child) => {
      child.registerParent(this);
      child.addEventListener('request-redraw', this.requestRedraw.bind(this));
    });
  }
  protected removeChild(child: Element) {
    const index = this._children.indexOf(child);
    if (index === -1) return;
    this._children.splice(index, 1);
    child.removeEventListener('request-redraw', this.requestRedraw.bind(this));
    child.unregisterParent();
  }
  protected resortChildren(sort: (children: Element[]) => Element[]) {
    this._children = sort(this._children);
  }

  public hasChild(child: Element) {
    return this._children.includes(child);
  }

  protected listeners: Map<string, ((ele: Element, ...args: any[]) => void)[]> =
    new Map();

  delete(this: Shape) {
    if (!this.parent) return;
    if (this.parent instanceof Element) this.parent.removeChild(this);
    else this.parent.removeChild(this);
    this.fireEvent('delete');
  }

  draw(ctx: CanvasRenderingContext2D) {
    this._children.forEach((child) => child.draw(ctx));
  }

  addEventListener(
    event: string,
    callback: (ele: Element, ...args: any[]) => void
  ) {
    const callbacks = this.listeners.get(event);
    if (callbacks) callbacks.push(callback);
    else this.listeners.set(event, [callback]);
  }

  removeEventListener(
    event: string,
    callback?: (ele: Element, ...args: any[]) => void
  ) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      if (callback === undefined) this.listeners.delete(event);
      else {
        const index = callbacks.indexOf(callback);
        if (index !== -1) callbacks.splice(index, 1);
      }
    }
  }

  public fireEvent(event: string, ...args: any[]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) callbacks.forEach((callback) => callback(this, ...args));
  }

  protected requestRedraw() {
    this.fireEvent('request-redraw');
  }

  public getContextMenuItems(this: Shape): ContextMenuItem[] {
    return [
      {
        key: 'delete',
        type: 'button',
        label: 'Delete',
        action: this.delete.bind(this),
        badge: 'Del/Backspace'
      }
    ];
  }

  public getChildByID(id: number): Element | null {
    if (this.id === id) return this;
    for (const child of this._children) {
      const found = child.getChildByID(id);
      if (found) return found;
    }
    return null;
  }

  public export(): {
    _type: 'element' | 'point' | 'line';
    id: number;
    children: ({ _type: 'point' | 'line' | 'element' } & Object)[];
  } {
    return {
      _type: 'element',
      id: this.id,
      children: this._children.map((child) => child.export())
    };
  }
}
