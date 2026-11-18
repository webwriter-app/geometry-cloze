import Debouncer from '../../model/debouncer';
import type { MsgFn } from '@lit/localize';
import SvgContext from '../../model/svg-context';
import InteractionManager from './interaction-manager';

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

  /** The figure as an SVG document, drawn by a detached manager so that this one keeps its selection. */
  public toSvg(): string {
    const canvas = document.createElement('canvas');
    const manager = new CanvasManager(canvas, this.msg);
    const { children, abstractRightAngle, scaleFactor } = this.export();
    manager.fontFamilyOverride = this.fontFamily;
    manager.import({ children, abstractRightAngle, scaleFactor });
    const measurer = document.createElement('canvas').getContext('2d')!;
    const { width, height } = this.getCanvasDimensions();
    const svg = new SvgContext(
      (text, font) => {
        measurer.font = font;
        return measurer.measureText(text);
      },
      width,
      height
    );
    manager.drawFigure(svg as unknown as CanvasRenderingContext2D);
    manager.unmount();
    return svg.toString();
  }

  /** Whether the objects can be built; a detached manager tries it, so that nothing visible changes. */
  public static accepts(children: CanvasData['children'], msg: MsgFn): boolean {
    const manager = new CanvasManager(document.createElement('canvas'), msg);
    try {
      manager.import({ children });
      manager.drawFigure(
        new SvgContext(
          () => ({ width: 0 }) as TextMetrics,
          1000,
          700
        ) as unknown as CanvasRenderingContext2D
      );
      return true;
    } catch {
      return false;
    } finally {
      manager.unmount();
    }
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
