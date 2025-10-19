// @ts-ignore
import LOCALIZE from '../localization/generated/index.js';
import '@webcomponents/scoped-custom-element-registry';
import { LitElementWw } from '@webwriter/lit';
import { PropertyValueMap, css, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { localized } from '@lit/localize';
import { WwGeomToolbar } from './components/toolbar/ww-geom-toolbar';
import Shape from './data/elements/Shape';
import CanvasManager, { CanvasData } from './data/CanvasManager/CanvasManager';
import Objects from './data/helper/Objects';
import { LitElement } from 'lit';

import '@shoelace-style/shoelace/dist/themes/light.css';
import { WwGeomOptions } from './components/options/ww-geom-options';

/**
 * Geometry cloze widget that renders the interactive canvas and manages localization/state wiring.
 */
@localized()
@customElement('ww-geometry-cloze')
export class WwGeometryCloze extends LitElementWw {
  @query('canvas') private accessor canvas!: HTMLCanvasElement;

  private manager: CanvasManager | null = null;

  protected localize = LOCALIZE;

  private appliedLocale: string | null = null;
  private pendingLocale: string | null = null;

  /**
   * Serialized children describing the current canvas content provided by the host.
   */
  @property({
    attribute: true,
    reflect: true,
    type: Array
  })
  accessor elements: CanvasData['children'];

  /**
   * Active editing mode, accepting three possible values:
   * - 'select': Move and connect objects
   * - 'create': Create and connect objects
   * - 'divider': Create divider lines
   */
  @property({
    attribute: true,
    reflect: true,
    type: String
  })
  accessor mode: CanvasData['mode'] = 'select';

  /**
   * Whether right angles will be drawn as small squares instead of arcs.
   */
  @property({
    attribute: true,
    reflect: true,
    type: Boolean
  })
  accessor abstractRightAngle: CanvasData['abstractRightAngle'] = false;

  /**
   * Whether the grid is shown on the canvas.
   */
  @property({
    attribute: true,
    reflect: true,
    type: Boolean
  })
  accessor showGrid: CanvasData['showGrid'] = true;

  /**
   * Whether user interactions snap to the grid.
   */
  @property({
    attribute: true,
    reflect: true,
    type: Boolean
  })
  accessor snap: CanvasData['snapping'] = true;

  static override get observedAttributes() {
    const attributes = super.observedAttributes ?? [];
    return attributes.includes('lang') ? attributes : [...attributes, 'lang'];
  }

  override attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ) {
    super.attributeChangedCallback(name, oldValue, newValue);
    if (name === 'lang' && oldValue !== newValue) {
      this.applyLocale(newValue);
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    const initialLocale =
      this.getAttribute('lang') ||
      document.documentElement.lang ||
      navigator.language ||
      null;
    this.applyLocale(initialLocale);
  }

  private async applyLocale(locale: string | null) {
    const normalized = this.normalizeLocale(locale);
    if (!normalized) return;
    if (normalized === this.appliedLocale && !this.pendingLocale) return;
    this.pendingLocale = normalized;
    try {
      await LOCALIZE.setLocale(normalized);
      if (this.pendingLocale === normalized) {
        this.appliedLocale = normalized;
        this.pendingLocale = null;
      }
    } catch (error) {
      console.warn(
        `Failed to load locale "${normalized}" – falling back to default locale.`,
        error
      );
      if (normalized !== 'en') {
        try {
          await LOCALIZE.setLocale('en');
          if (this.pendingLocale === normalized) {
            this.appliedLocale = 'en';
            this.pendingLocale = null;
          }
        } catch (fallbackError) {
          console.error('Failed to load fallback locale "en".', fallbackError);
        }
      }
    } finally {
      if (this.pendingLocale === normalized) {
        this.pendingLocale = null;
      }
    }
  }

  private normalizeLocale(locale: string | null): string {
    if (!locale) return 'en';
    const trimmed = locale.trim();
    if (!trimmed) return 'en';
    return trimmed;
  }

  render() {
    return html` ${this.isContentEditable
        ? html`<ww-geom-toolbar
            .manager=${this.manager as any}></ww-geom-toolbar>`
        : nothing}
      <canvas tabindex="0"></canvas>
      <ww-geom-options
        part="options"
        .manager=${this.manager as any}></ww-geom-options>`;
  }

  protected updated(
    changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    if (changedProperties.has('elements')) {
      if (!this.manager || !this.elements) return;
      const exportData = this.manager.export();
      if (!Objects.deepEqual(exportData.children, this.elements))
        this.manager.import({
          children: this.elements
        });
    } else if (changedProperties.has('mode')) {
      if (this.manager) this.manager.mode = this.mode;
    } else if (changedProperties.has('abstractRightAngle'.toLowerCase())) {
      if (this.manager)
        this.manager.abstractRightAngle = this.abstractRightAngle;
    } else if (changedProperties.has('showGrid'.toLowerCase())) {
      if (this.manager) this.manager.toggleGrid(this.showGrid);
    } else if (changedProperties.has('snap')) {
      if (this.manager) this.manager.toggleSnapping(this.snap);
    }
  }

  private onCanvasValueChange: EventListener = (event: Event) => {
    const value = (event as CustomEvent<CanvasData>).detail;
    this.elements = value.children;
    this.mode = value.mode;
    this.abstractRightAngle = value.abstractRightAngle;
    this.showGrid = value.showGrid;
    this.snap = value.snapping;
  };

  firstUpdated() {
    if (this.canvas) {
      if (this.manager) {
        console.warn('Prevented creating multiple CanvasManager');
        return;
      }
      this.manager = new CanvasManager(
        this.canvas,
        this.renderRoot as HTMLElement
      );
      this.manager.addEventListener('dataupdate', this.onCanvasValueChange);

      if (this.elements) {
        this.manager.import({
          children: this.elements,
          mode: this.mode
        });
      } else {
        const polygon = Shape.createPolygon(this.manager, [
          { x: 200, y: 200, name: 'top left' },
          { x: 500, y: 200, name: 'top right' },
          {
            x: 600,
            y: 300,
            name: 'middle right'
          },
          { x: 500, y: 500, name: 'bottom right' },
          { x: 200, y: 500, name: 'bottom left' }
        ]);

        this.manager.addChild(polygon);
      }
    } else console.warn('No canvas context');
  }

  disconnectedCallback(): void {
    if (this.manager) {
      this.manager.removeEventListener('dataupdate', this.onCanvasValueChange);
      this.manager.unmount();
    }
    super.disconnectedCallback();
  }

  /** @internal */
  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true
  };

  /** @internal */
  public static get scopedElements() {
    return {
      'ww-geom-toolbar': WwGeomToolbar,
      'ww-geom-options': WwGeomOptions
    };
  }

  static styles = css`
    :host {
      position: relative;
      display: block;

      width: 100%;

      color: var(--sl-color-neutral-900);
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
      outline: none !important;
    }
    :host(:not([contenteditable='true']):not([contenteditable=''])) canvas {
      pointer-events: none;
    }
    :host(:not([contenteditable='true']):not([contenteditable='']))
      ww-geom-options {
      display: none;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geometry-cloze': WwGeometryCloze;
  }
}
