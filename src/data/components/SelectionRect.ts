import Draggable from '../elements/base/Draggable';
import Element from '../elements/base/Element';

export default class SelectionRect {
  constructor(private coords: { x: number; y: number }) {}

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.rect(
      this.coords.x,
      this.coords.y,
      this.secondCoords.x - this.coords.x,
      this.secondCoords.y - this.coords.y
    );
    ctx.stroke();
    ctx.fill();
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
