import { ContextMenuItem } from '../../../types/ContextMenu';
import Shape from '../Shape';
import InteractionManager from '../../CanvasManager/InteractionManager';
import IDManager from '../../CanvasManager/IDManager';
import Manager from '../../CanvasManager/Abstracts';

export interface NamedElement {
  name?: string;
  id?: number;
}

export default class Element {
  public name = '[unset]';
  private _id = IDManager.getID();
  public get id() {
    return this._id;
  }
  constructor(
    protected manager: InteractionManager,
    data?: NamedElement
  ) {
    if (data?.name) this.name = data.name;
    if (data?.id) this._id = data.id;
  }

  private _hidden = false;
  public get hidden() {
    return this._hidden;
  }
  public hide(value: boolean = true) {
    this._hidden = value;
    this.requestRedraw();
  }

  protected parent: Shape | Manager | null = null;
  private _children: Element[] = [];
  protected get children(): readonly Element[] {
    return this._children;
  }

  registerParent(element: Shape | Manager) {
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

  protected addChild(...children: Element[]) {
    this._children.push(...children);
    children.forEach((child) => {
      if (this instanceof Shape) child.registerParent(this);
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
    if (this._hidden) return;
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
    if (this._id === id) return this;
    for (const child of this._children) {
      const found = child.getChildByID(id);
      if (found) return found;
    }
    return null;
  }

  public export(): {
    _type: 'element' | 'point' | 'line';
    id: number;
    children?: ({ _type: 'point' | 'line' | 'element' } & Object)[];
  } {
    if (this.children.length)
      return {
        _type: 'element',
        id: this.id,
        children: this._children.map((child) => child.export())
      };
    return {
      _type: 'element',
      id: this.id
    };
  }
}
