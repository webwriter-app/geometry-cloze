import CanvasManager from '../../CanvasManager';
import ContextMenu from '/data/components/ContextMenu';
import { ContextMenuItem } from '/types/ContextMenu';

export default class Element {
  public name = '[unset]';
  constructor(protected manager: CanvasManager) {}

  // TODO: keep track of parent to bubble up events
  private _children: Element[] = [];
  protected get children(): readonly Element[] {
    return this._children;
  }

  protected addChildAt(child: Element, index: number) {
    this._children.splice(index, 0, child);
    child.addEventListener('request-redraw', this.requestRedraw.bind(this));
  }

  protected addChild(...children: Element[]) {
    this._children.push(...children);
    children.forEach((child) =>
      child.addEventListener('request-redraw', this.requestRedraw.bind(this))
    );
  }
  protected removeChild(child: Element) {
    const index = this._children.indexOf(child);
    if (index === -1) return;
    this._children.splice(index, 1);
    child.removeEventListener('request-redraw', this.requestRedraw.bind(this));
  }

  protected listeners: Map<string, ((ele: Element, ...args: any[]) => void)[]> =
    new Map();

  get ctx() {
    return this.manager.ctx;
  }

  delete() {}

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

  protected _contextMenuItems: ContextMenuItem[] = [
    {
      type: 'button',
      label: 'Delete',
      action: () => {
        this.delete();
      }
    }
  ];
  getContextMenu(): ContextMenu | null {
    if (this._contextMenuItems.length === 0) return null;
    return new ContextMenu(this._contextMenuItems);
  }
}
