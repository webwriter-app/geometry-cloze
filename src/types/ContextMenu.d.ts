export type ContextMenuItemType = 'button' | 'checkbox' | 'submenu' | 'divider';

interface GeneralContextMenuItem<Type extends ContextMenuItemType> {
  type: Type;
  label: string;
  key: string;
}

export interface ContextMenuButton extends GeneralContextMenuItem<'button'> {
  badge?: string;
  isDisabled?: () => boolean;
  disabled?: boolean;
  action: () => void;
}

export interface ContextMenuCheckbox
  extends GeneralContextMenuItem<'checkbox'> {
  disabled?: boolean;
  getChecked: () => boolean;
  action: (checked: boolean) => void;
}

export interface ContextMenuSubmenu extends GeneralContextMenuItem<'submenu'> {
  items: ContextMenuItem[];
}

export interface ContextMenuDivider
  extends Omit<GeneralContextMenuItem<'divider'>, 'label' | 'key'> {}

export type ContextMenuItem =
  | ContextMenuButton
  | ContextMenuCheckbox
  | ContextMenuSubmenu
  | ContextMenuDivider;
