import type { MsgFn } from "@lit/localize";
import { str } from "@lit/localize";
import { LitElementWw } from '@webwriter/lit';
import { jsonData } from '@webwriter/lit/data';
import { localizer } from '@webwriter/lit/localize';
import { Permissions } from '@webwriter/lit/permissions';
import { Settings } from '@webwriter/lit/settings';
import { Shortcuts } from '@webwriter/lit/shortcuts';
import { PropertyValues, css, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { WwGeomToolbar } from '../components/toolbar/ww-geom-toolbar';
import CanvasManager, { CanvasData } from '../components/canvas-manager/canvas-manager';
import Objects from '../model/objects';
import { readFigure } from '../model/figure-json';
import { LitElement } from 'lit';

import '@shoelace-style/shoelace/dist/themes/light.css';
import { sourceLocale, targetLocales } from '../../localization/generated/locale-codes.js';

/** What a drawer text reads from the widget: its catalog. */
type Texts = { msg: MsgFn };

/**
 * The geometry cloze widgets allows for the creation and embedding of geometric
 * figures. It provides a 1000 x 700 unit wide canvas which can contain
 * arbitrary polygons, lines and points with custom styling, labels and
 * measurements.
 *
 * If the widget is `contenteditable`, the user can interactively create and
 * edit the shapes on the canvas. Otherwise, the canvas is rendered as a static
 * image.
 *
 * ### Input
 *
 * The canvas takes mouse, pen and touch input (pointer events). A long press
 * with touch does what a right click does. With the keyboard: Tab reaches the
 * toolbar and the canvas; on the canvas the arrow keys move the selection (or a
 * cursor when nothing is selected, in steps of the snapping grid, Alt for fine
 * steps), Enter or Space acts at the cursor like a click, Page Up and Page Down
 * step through the objects, and S, C, D, Shift+A, Delete and Escape work as
 * before.
 *
 * ### Theme
 *
 * The text color follows `--ww-text-color`, the font of the labels follows
 * `--ww-font-family`, and the selection and the keyboard cursor use
 * `--ww-theme-accent-1`. The colors of the drawn objects are authored data and
 * stay as they are.
 *
 * ### Conversions
 *
 * - Export `image/svg+xml`: the objects as an SVG picture of 1000 x 700 units,
 *   without grid, selection or keyboard cursor. Lossy: the picture cannot be
 *   edited again.
 * - Convert to `img`: the same SVG as a data URL.
 * - Import and export `.json`: the `elements` list of the data block
 *   (described at `elements`). Settings such as `scale` are attributes and are
 *   not part of the file. A file with the list alone is accepted too.
 *
 * ### Print
 *
 * The toolbar is hidden and the canvas prints as the picture shown on screen.
 *
 * @part canvas - The drawing area.
 */
@customElement('ww-geometry-cloze')
export class WwGeometryCloze extends Settings(LitElementWw, {
  // Lit lowercased the attribute names of these properties; documents keep them.
  hideGrid: { type: Boolean, attribute: 'hidegrid', label: (widget: Texts) => widget.msg('Hide grid') },
  disableSnapping: { type: Boolean, attribute: 'disablesnapping', label: (widget: Texts) => widget.msg('Disable snapping') },
  abstractRightAngle: { type: Boolean, attribute: 'abstractrightangle', label: (widget: Texts) => widget.msg('Abstract right angle') },
  scale: {
    type: Number, default: 1, control: 'range', min: 0.01, max: 10,
    steps: [0.01, 0.1, 0.125, 0.25, 0.75, 1, 1.5, 2, 3, 5, 10],
    label: (widget: Texts) => widget.msg('Scale'),
    description: (widget: Texts) => widget.msg('Scales labels for lengths and sizes.')
  }
}) {
  static styles = css`
    :host {
      position: relative;
      display: block;

      width: 100%;
      min-width: 300px;
      max-width: 2100px;
      min-height: 12rem;

      color: var(--ww-text-color, var(--sl-color-neutral-900));
      font-family: var(--ww-font-family, inherit);
      background-color: var(--sl-color-neutral-0);

      border: solid 1px var(--sl-color-neutral-300);
      border-radius: var(--sl-border-radius-medium);
      box-sizing: border-box;

      overflow: hidden;
      z-index: 10000000;

      outline: none;
    }
    ww-geom-toolbar {
      border-bottom: solid 1px var(--sl-color-neutral-300);
    }
    canvas {
      display: block;
      width: 100%;
      aspect-ratio: 10 / 7;
    }
    canvas:focus {
      outline: none;
    }
    canvas:focus-visible {
      outline: 2px solid var(--ww-theme-accent-1, var(--sl-focus-ring-color));
      outline-offset: -2px;
    }
    /* Only the editing canvas starts drags; a reader can scroll the page over it. */
    canvas.editing {
      touch-action: none;
    }
    .status {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    @media print {
      :host {
        min-width: 0;
        max-width: none;
        break-inside: avoid;
        z-index: auto;
      }
      ww-geom-toolbar,
      .status {
        display: none;
      }
    }
  `;

  /** @internal */
  public static get scopedElements() {
    return {
      'ww-geom-toolbar': WwGeomToolbar
    };
  }

  /** @internal */
  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true
  };

  static convertFrom = { '.json': 'importJson' };
  static convertTo = {
    'image/svg+xml': 'exportSvg',
    '.json': 'exportJson',
    img: 'toImage'
  };

  static override actions = {
    selectTool: { label: 'Select and move objects', shortcut: 'S', can: 'edit', hidden: true },
    createTool: { label: 'Create and connect objects', shortcut: 'C', can: 'edit', hidden: true },
    dividerTool: { label: 'Create divider lines', shortcut: 'D', can: 'edit', hidden: true },
    deleteSelection: { label: 'Delete selected objects', shortcut: ['Delete', 'Backspace'], can: 'edit', hidden: true },
    cancel: { label: 'Cancel the current step', shortcut: 'Escape', can: 'edit', hidden: true },
    selectAll: { label: 'Select all objects', shortcut: 'Shift+A', can: 'edit', hidden: true },
    clear: {
      label: (widget: Texts) => widget.msg('Clear canvas'),
      confirm: (widget: Texts) => widget.msg('Remove all objects from the canvas?'),
      intent: 'danger' as const,
      can: 'edit'
    }
  };

  protected localize = localizer(this, {
    sourceLocale,
    targetLocales,
    load: (locale) => import(`../../localization/generated/${locale}.ts`)
  });
  public readonly msg = this.localize.msg;

  #permissions = new Permissions(this);
  #data = jsonData(this, {
    defaults: { elements: [] as CanvasData['children'] },
    changed: () => this.syncElements()
  });
  #shortcuts = new Shortcuts(this);

  /**
   * A JSON-serialized list of all the objects that make up the canvas. Each
   * object is either a polygon element or a divider line, described below.
   *
   * ### Elements
   *
   * - Represents a drawable object on the 1000×700 canvas.
   * - Every object must include a `"_type"` field to indicate its type.
   * - Every object must provide a numeric `id` that is unique across the entire
   *   canvas.
   *
   * ### Polygon Object (`"_type": "element"`)
   *
   * - `id` (number): Unique identifier for the shape.
   * - `fill` (string, optional): `'transparent'` or a palette color with a `50`
   *   alpha suffix (for example `"#2563eb50"`).
   * - `labelColor` (string, optional): Palette color applied to any label
   *   rendered for the shape.
   * - `showArea`, `showPerimeter` (boolean, optional): Enable live area and
   *   perimeter labels respectively. When either is `true`, required child
   *   labels are shown automatically.
   * - `children` (array): Mix of point and line definitions describing the
   *   polygon.
   *
   * ### Point Child (`"_type": "point"`)
   *
   * - `id` (number): Unique identifier within the shape.
   * - `x`, `y` (number): Absolute coordinates on the canvas.
   * - `fill` (string, optional): Palette color for the point marker. When
   *   omitted, the point defaults to black.
   * - `showLabel` (boolean, optional): When `true`, renders an angle marker
   *   and label around the point.
   * - `labelColor` (string, optional): Palette color for the angle label.
   * - `labelStyle` (string, optional): `'name'` renders a fixed letter;
   *   `'value'` displays the measured angle.
   * - `labelName` (string, optional): One of `['α','β','γ','δ','ε','ζ','η','θ',
   *   'ι','κ','λ','μ','ν','ξ','ο','π','ρ','σ','τ','υ','φ','χ','ω','ϡ','ͳ','ϸ']`
   *   when `labelStyle` is `'name'`.
   * - `showOutsideAngle` (boolean, optional): When `true`, the displayed angle
   *   wraps around the exterior.
   *
   * ### Line Child (`"_type": "line"`)
   *
   * - `id` (number): Unique identifier within the shape.
   * - `start`, `end` (object): Either `{ "_type": "reference", "id": <pointId> }`
   *   to reuse a point or `{ "_type": "absolute", "x": number, "y": number }`
   *   for an independent endpoint.
   * - `lineWidth` (number, optional): Width of the line in px, should be one
   *   of `1`, `2`, `3`, `5`, `7`.
   * - `stroke` (string, optional): Palette color for the stroke.
   * - `showLabel` (boolean, optional): When `true`, renders a length label
   *   along the line.
   * - `labelColor` (string, optional): Palette color for the line label.
   * - `labelStyle` (string, optional): `'name'` renders a chosen letter;
   *   `'value'` displays the live length.
   * - `labelName` (string, optional): One of `['a','b','c','d','e','f','g','h',
   *   'i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']`
   *   when `labelStyle` is `'name'`.
   *
   * ### Divider Line (`"_type": "divider-line"`)
   *
   * - `id` (number): Unique identifier.
   * - `start`, `end` (object): Always absolute coordinate objects of the form
   *   `{ "_type": "absolute", "x": number, "y": number }`.
   * - `lineWidth`, `stroke`, `labelColor`, `showLabel`, `labelStyle`,
   *   `labelName`: Same meaning and value sets as for regular lines. Divider
   *   strokes are automatically rendered with a dashed pattern.
   *
   * ### Palette Colors
   *
   * | Color  | Hex       |
   * | ------ | --------- |
   * | Black  | `#131316` |
   * | Red    | `#dc2626` |
   * | Orange | `#ea580c` |
   * | Yellow | `#ca8a04` |
   * | Lime   | `#65a30d` |
   * | Green  | `#16a34a` |
   * | Cyan   | `#0891b2` |
   * | Blue   | `#2563eb` |
   * | Violet | `#7c3aed` |
   * | Pink   | `#db2777` |
   */
  private get elements(): CanvasData['children'] {
    const { elements } = this.#data.get();
    return Array.isArray(elements) ? elements : [];
  }

  /**
   * Active editing mode, accepting three possible values:
   * - `select`: Move and connect objects
   * - `create`: Create and connect objects
   * - `divider`: Create divider lines
   */
  @property({
    attribute: true,
    reflect: true,
    type: String
  })
  accessor mode: CanvasData['mode'] = 'select';

  @query('canvas') private accessor canvas!: HTMLCanvasElement;

  private manager: CanvasManager | null = null;

  private locale = this.localize.getLocale();

  #lifetime = new AbortController();

  @state() private accessor status = '';

  connectedCallback() {
    if (this.#lifetime.signal.aborted) this.#lifetime = new AbortController();
    super.connectedCallback();
    window.addEventListener('beforeprint', this.onBeforePrint, { signal: this.#lifetime.signal });
    window.addEventListener('afterprint', this.onAfterPrint, { signal: this.#lifetime.signal });
    // After the Shortcuts listener of the host, which skips a key that is already handled.
    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('keyup', this.onKeyUp);
    if (this.hasUpdated) this.setupCanvas();
  }

  firstUpdated() {
    this.setupCanvas();
  }

  protected updated(
    changedProperties: PropertyValues
  ): void {
    if (!this.manager) return;
    if (this.locale !== this.localize.getLocale()) {
      this.locale = this.localize.getLocale();
      this.manager.requestRedraw();
    }
    if (changedProperties.has('scale')) this.manager.setScale(this.scale ?? 1);

    if (changedProperties.has('mode') && this.mode !== this.manager.mode)
      this.manager.mode = this.mode;

    if (
      changedProperties.has('abstractRightAngle') &&
      this.abstractRightAngle !== this.manager.abstractRightAngle
    )
      this.manager.abstractRightAngle = this.abstractRightAngle;

    if (
      changedProperties.has('hideGrid') &&
      this.hideGrid !== !this.manager.showGrid
    )
      this.manager.toggleGrid(!this.hideGrid);

    if (
      changedProperties.has('disableSnapping') &&
      this.disableSnapping !== !this.manager.snapping
    )
      this.manager.toggleSnapping(!this.disableSnapping);
  }

  disconnectedCallback(): void {
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('keyup', this.onKeyUp);
    this.#lifetime.abort();
    if (this.manager) {
      this.manager.removeEventListener('dataupdate', this.onCanvasValueChange);
      this.manager.removeEventListener('selectionupdate', this.onSelectionAnnounce);
      this.manager.removeEventListener('modeupdate', this.onModeAnnounce);
      this.manager.unmount();
      this.manager = null;
    }
    super.disconnectedCallback();
  }

  private setupCanvas() {
    if (this.canvas) {
      if (this.manager) return;
      this.manager = new CanvasManager(this.canvas, this.msg);
      this.requestUpdate();
      this.manager.addEventListener('dataupdate', this.onCanvasValueChange);
      this.manager.addEventListener('selectionupdate', this.onSelectionAnnounce);
      this.manager.addEventListener('modeupdate', this.onModeAnnounce);

      this.manager.import({
        children: this.elements || [],
        mode: this.mode,
        abstractRightAngle: this.abstractRightAngle,
        showGrid: !this.hideGrid,
        snapping: !this.disableSnapping,
        scaleFactor: this.scale ?? 1
      });
    }
  }

  private syncElements() {
    if (!this.manager) return;
    const children = this.elements;
    if (!Objects.deepEqual(this.manager.export().children, children)) {
      this.manager.import({ children });
    }
  }

  selectTool() { if (this.manager) this.manager.mode = 'select'; }
  createTool() { if (this.manager) this.manager.mode = 'create'; }
  dividerTool() { if (this.manager) this.manager.mode = 'divider'; }
  deleteSelection() { this.manager?.deleteSelection(); }
  cancel() { this.manager?.cancel(); }
  selectAll() { this.manager?.selectAll(); }

  clear() {
    this.#data.set({ elements: [] });
    this.syncElements();
  }

  /** The objects as drawn now; the data block lags the canvas by a short delay. */
  private currentElements(): NonNullable<CanvasData['children']> {
    return this.manager?.export().children ?? this.elements ?? [];
  }

  exportSvg(): File | null {
    const manager = this.manager;
    if (!manager || !this.currentElements().length) return null;
    return new File([manager.toSvg()], 'geometry-cloze.svg', {
      type: 'image/svg+xml'
    });
  }

  toImage(): HTMLImageElement | null {
    const manager = this.manager;
    if (!manager || !this.currentElements().length) return null;
    const image = document.createElement('img');
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(manager.toSvg());
    image.alt = this.msg('Geometry canvas');
    image.style.maxWidth = '100%';
    image.style.height = 'auto';
    return image;
  }

  exportJson(): File {
    return new File(
      [JSON.stringify({ elements: this.currentElements() }, null, 2)],
      'geometry-cloze.json',
      { type: 'application/json' }
    );
  }

  async importJson(file: File): Promise<() => void> {
    const figure = readFigure(await file.text());
    if ('error' in figure)
      throw new Error(
        figure.error === 'syntax'
          ? this.msg('The file is not valid JSON.')
          : this.msg('The file does not describe a geometry figure.')
      );
    const elements = figure.elements as CanvasData['children'];
    if (!CanvasManager.accepts(elements, this.msg))
      throw new Error(this.msg('The file does not describe a geometry figure.'));
    return () => {
      this.#data.set({ elements });
      this.syncElements();
    };
  }

  private onCanvasValueChange: EventListener = (event: Event) => {
    const value = (event as CustomEvent<CanvasData>).detail;
    if (!Objects.deepEqual(this.elements, value.children)) {
      this.#data.set({ elements: value.children });
    }
    this.mode = value.mode;
    this.abstractRightAngle = value.abstractRightAngle;
    this.hideGrid = !value.showGrid;
    this.disableSnapping = !value.snapping;
    this.scale = value.scaleFactor as this['scale'];
  };

  private onBeforePrint = () => this.manager?.beginPrint();
  private onAfterPrint = () => this.manager?.endPrint();

  private onSelectionAnnounce: EventListener = (event: Event) => {
    const count = (event as CustomEvent<unknown[]>).detail.length;
    this.status = count ? this.msg(str`${count} objects selected`) : '';
  };

  private onModeAnnounce: EventListener = (event: Event) => {
    const texts = {
      select: this.msg('Select and move objects'),
      create: this.msg('Create and connect objects'),
      divider: this.msg('Create divider lines')
    };
    this.status = texts[(event as CustomEvent<CanvasData['mode']>).detail] ?? '';
  };

  /**
   * Keeps the modifier keys for snapping and multi-select, and keeps a key
   * that is pressed on the canvas away from the editor, as before. Tab and the
   * keys of the toolbar controls keep their own behavior. Ctrl/Cmd+Z stays
   * with the editor.
   */
  private onKeyDown = (event: KeyboardEvent) => {
    const path = event.composedPath();
    if (!path.includes(this.renderRoot)) return;
    if (event.key === 'Tab') return;
    if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey))
      return;
    event.stopPropagation();
    if (path[0] !== this.canvas) return;
    event.preventDefault();
    this.manager?.setKeys(event);
    if (this.#permissions.editing) this.manager?.handleKey(event);
  };

  private onKeyUp = (event: KeyboardEvent) => {
    if (event.composedPath().includes(this.renderRoot))
      this.manager?.setKeys(event);
  };

  render() {
    const editing = this.#permissions.editing;
    return html` ${editing
        ? html`<ww-geom-toolbar
            .manager=${this.manager}></ww-geom-toolbar>`
        : nothing}
      <canvas
        part="canvas"
        class=${editing ? 'editing' : ''}
        tabindex="0"
        role=${editing ? 'application' : 'img'}
        aria-label=${this.msg('Geometry canvas')}
        @blur=${() => this.manager?.hideKeyboardCursor()}
        data-ww-can="edit"
        data-ww-can-mode="disable"></canvas>
      <output class="status" aria-live="polite">${this.status}</output>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geometry-cloze': WwGeometryCloze;
  }
}

