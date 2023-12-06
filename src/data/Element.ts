export default class Element {
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;

  protected listeners: Map<
    string,
    ((ele: typeof this, ...args: any[]) => void)[]
  > = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No canvas context');
    this._ctx = ctx;
  }

  get ctx() {
    return this._ctx;
  }

  get canvas() {
    return this._canvas;
  }

  delete() {}

  addEventListener(
    event: string,
    callback: (ele: typeof this, ...args: any[]) => void
  ) {
    const callbacks = this.listeners.get(event);
    if (callbacks) callbacks.push(callback);
    else this.listeners.set(event, [callback]);
  }

  protected fireEvent(event: string, ...args: any[]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) callbacks.forEach((callback) => callback(this, ...args));
  }
}
