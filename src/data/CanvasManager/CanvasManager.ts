import Debouncer from '../helper/Debouncer';
import InteractionManager from './InteractionManager';

export default class CanvasManager extends InteractionManager {
  private updateDebouncer = new Debouncer(
    this.sendUpdate.bind(this),
    500,
    2000
  );
  requestRedraw() {
    super.requestRedraw();
    this.updateDebouncer.call();
  }

  private sendUpdate() {
    const exportedData = this.export();
    this.dispatchEvent(new CustomEvent('dataupdate', { detail: exportedData }));
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
    if (data.abstractRightAngle !== undefined)
      this._abstractRightAngle = data.abstractRightAngle;
    super.import(data);
  }
}

export type CanvasData = ReturnType<CanvasManager['export']>;
