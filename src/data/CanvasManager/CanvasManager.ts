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

  private updateListeners: ((exportedData: any) => void)[] = [];
  public addUpdateListener(listener: (exportedData: any) => void) {
    this.updateListeners.push(listener);
  }
  public removeUpdateListener(listener: (exportedData: any) => void) {
    const index = this.updateListeners.indexOf(listener);
    if (index < 0) return;
    this.updateListeners.splice(index, 1);
  }
}
