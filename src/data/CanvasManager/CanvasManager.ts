import Calc, { MathPoint } from '../helper/Calc';
import Draggable from '../elements/base/Draggable';
import Element from '../elements/base/Element';
import SelectionRect from '../components/SelectionRect';
import { WwGeomContextMenu } from '/components/context-menu/ww-geom-context-menu';
import Point from '../elements/Point';
import Shape from '../elements/Shape';
import InteractionManager from './InteractionManager';

export default class CanvasManager extends InteractionManager {}
