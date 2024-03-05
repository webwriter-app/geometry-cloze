import { Child } from './ChildrenTypes';

export default interface Manager {
  getChildren(): Child[];
  addChild(ele: Child): void;
  removeChild(ele: Child): void;
  export(): any;
  import(data: any): void;
  mode: InteractionMode;
  scale: number;
}
