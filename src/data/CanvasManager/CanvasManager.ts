import Debouncer from '../helper/Debouncer';
import InteractionManager from './InteractionManager';

export default class CanvasManager extends InteractionManager {
  private updateDebouncer = new Debouncer(
    this.sendUpdate.bind(this),
    500,
    2000
  );
  requestRedraw(originallyScheduledAt?: number) {
    super.requestRedraw(originallyScheduledAt);
    this.updateDebouncer.call();
  }

  private sendUpdate() {
    const exportedData = this.export();
    this.updateListeners.forEach((listener) => listener(exportedData));
  }

  private updateListeners: ((exportedData: CanvasData) => void)[] = [];
  public addUpdateListener(listener: (exportedData: any) => void) {
    this.updateListeners.push(listener);
  }
  public removeUpdateListener(listener: (exportedData: CanvasData) => void) {
    const index = this.updateListeners.indexOf(listener);
    if (index < 0) return;
    this.updateListeners.splice(index, 1);
  }

  private _abstractRightAngle = false;
  public get abstractRightAngle() {
    return this._abstractRightAngle;
  }
  public set abstractRightAngle(value: boolean) {
    this._abstractRightAngle = value;
    this.requestRedraw();
  }

  public export() {
    return {
      ...super.export(),
      abstractRightAngle: this.abstractRightAngle
    };
  }

  public import(data: Partial<ReturnType<this['export']>>) {
    super.import(data);
    if (data.abstractRightAngle !== undefined) {
      this.abstractRightAngle = data.abstractRightAngle;
    }
  }
}

export type CanvasData = ReturnType<CanvasManager['export']>;
