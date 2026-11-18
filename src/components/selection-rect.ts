import Draggable from './elements/base/draggable';
import Element from './elements/base/element';
import SHOELACE from './shoelace';

export const SELECTION_STYLE = {
  alpha: 0.25,
  strokeOffset: 4,
  fillOverlay: 'rgba(0, 0, 0, 0.1)'
};

export default class SelectionRect {
  constructor(private coords: { x: number; y: number }) {}

  draw(ctx: CanvasRenderingContext2D, color: string = SHOELACE.focus.ringColor) {
    const { x, y } = this.coords;
    const width = this.secondCoords.x - x;
    const height = this.secondCoords.y - y;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.1;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1;
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
  }

  private secondCoords: { x: number; y: number } = { x: 0, y: 0 };
  setSecondCoords(coords: { x: number; y: number }) {
    this.secondCoords = coords;
  }

  getSelectedElements(elements: Element[]): Draggable[] {
    const lowerCoords = {
      x: Math.min(this.coords.x, this.secondCoords.x),
      y: Math.min(this.coords.y, this.secondCoords.y)
    };
    const higherCoords = {
      x: Math.max(this.coords.x, this.secondCoords.x),
      y: Math.max(this.coords.y, this.secondCoords.y)
    };
    return elements.flatMap((element) =>
      element instanceof Draggable
        ? element.getHit(lowerCoords, higherCoords)
        : []
    );
  }
}
