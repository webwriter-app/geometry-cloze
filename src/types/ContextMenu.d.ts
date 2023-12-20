export type ContextMenuItemType = 'button' | 'checkbox' | 'submenu' | 'divider';

interface GeneralContextMenuItem<Type extends ContextMenuItemType> {
  type: Type;
  label: string;
}

export interface ContextMenuButton extends GeneralContextMenuItem<'button'> {
  isDisabled?: () => boolean;
  disabled?: boolean;
  action: () => void;
}

export interface ContextMenuCheckbox
  extends GeneralContextMenuItem<'checkbox'> {
  checked: boolean;
  action: (checked: boolean) => boolean;
}

export interface ContextMenuSubmenu extends GeneralContextMenuItem<'submenu'> {
  items: ContextMenuItem[];
}

export interface ContextMenuDivider extends GeneralContextMenuItem<'divider'> {}

export type ContextMenuItem =
  | ContextMenuButton
  | ContextMenuCheckbox
  | ContextMenuSubmenu
  | ContextMenuDivider;
