import CanvasManager from './CanvasManager';

export default class Element {
  protected children: Element[] = [];

  protected listeners: Map<string, ((ele: Element, ...args: any[]) => void)[]> =
    new Map();

  constructor(protected manager: CanvasManager) {}

  get ctx() {
    return this.manager.ctx;
  }

  delete() {}

  draw() {}

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
}
