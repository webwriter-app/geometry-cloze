import { ContextMenuItem } from '/types/ContextMenu';

export default class ContextMenu {
  constructor(private items: ContextMenuItem[]) {}

  private resolveContextMenuItems(items: ContextMenuItem[]): ContextMenuItem[] {
    return items.map((item) => {
      if (item.type === 'submenu')
        item.items = this.resolveContextMenuItems(item.items);
      if (item.type === 'button') item.disabled = item.isDisabled?.() ?? false;
      return item;
    });
  }

  open(x: number, y: number) {
    const items = this.resolveContextMenuItems(this.items);
    console.log(x, y);
  }

  private createMenuItem(item: ContextMenuItem): HTMLElement {
    // TODO: implement
    return document.createElement('div');
  }
}
