export type ContextMenuItemType = 'button' | 'checkbox' | 'submenu' | 'divider';

interface GeneralContextMenuItem<Type extends ContextMenuItemType> {
  type: Type;
  label: string;
  keepOpenAfterClick?: boolean;
}

export interface ContextMenuButton extends GeneralContextMenuItem<'button'> {
  key: string;
  isDisabled?: () => boolean;
  disabled?: boolean;
  action: () => void;
}

export interface ContextMenuCheckbox
  extends GeneralContextMenuItem<'checkbox'> {
  key: string;
  disabled?: boolean;
  getChecked: () => boolean;
  action: (checked: boolean) => void;
}

export interface ContextMenuSubmenu extends GeneralContextMenuItem<'submenu'> {
  items: ContextMenuItem[];
}

export interface ContextMenuDivider
  extends Omit<
    GeneralContextMenuItem<'divider'>,
    'label' | 'keepOpenAfterClick'
  > {}

export type ContextMenuItem =
  | ContextMenuButton
  | ContextMenuCheckbox
  | ContextMenuSubmenu
  | ContextMenuDivider;
