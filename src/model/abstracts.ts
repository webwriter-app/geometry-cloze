import type { MsgFn } from "@lit/localize";
import { Child } from './children-types';

export default interface Manager {
  msg: MsgFn;
  getChildren(): Child[];
  addChild(ele: Child): void;
  removeChild(ele: Child): void;
  export(): unknown;
  import(data: unknown): void;
  mode: InteractionMode;
  scale: number;
  abstractRightAngle: boolean;
}
