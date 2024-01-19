import CanvasManager from '../../CanvasManager';
import { ContextMenuItem } from '/types/ContextMenu';

export interface NamedElement {
  name?: string;
}

export default class Element {
  public name = '[unset]';
  constructor(protected manager: CanvasManager) {}

  protected parent: Element | CanvasManager | null = null;
  private _children: Element[] = [];
  protected get children(): readonly Element[] {
    return this._children;
  }

  registerParent(element: Element | CanvasManager) {
    this.parent = element;
  }
  unregisterParent() {
    this.parent = null;
  }

  protected addChildAt(child: Element, index: number) {
    this._children.splice(index, 0, child);
    child.addEventListener('request-redraw', this.requestRedraw.bind(this));
    child.registerParent(this);
  }

  protected addChild(...children: Element[]) {
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

  protected listeners: Map<string, ((ele: Element, ...args: any[]) => void)[]> =
    new Map();

  get ctx() {
    return this.manager.ctx;
  }

  delete() {
    if (!this.parent) return;
    if (this.parent instanceof Element) this.parent.removeChild(this);
    else this.parent.removeChild(this);
    this.fireEvent('delete');
  }

  draw() {
    this._children.forEach((child) => child.draw());
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

  public getContextMenuItems(): ContextMenuItem[] {
    return [
      {
        key: 'delete',
        type: 'button',
        label: 'Delete',
        action: () => {
          this.delete();
        }
      }
    ];
  }
}
