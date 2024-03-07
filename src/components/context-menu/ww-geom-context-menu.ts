import { LitElementWw } from '@webwriter/lit';
import { TemplateResult, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { ContextMenuItem } from '../../types/ContextMenu';
import type { SlSelectEvent } from '@shoelace-style/shoelace';

import '@shoelace-style/shoelace/dist/themes/light.css';

import SlMenu from '@shoelace-style/shoelace/dist/components/menu/menu.component.js';
import SlMenuItem from '@shoelace-style/shoelace/dist/components/menu-item/menu-item.component.js';
import SlDivider from '@shoelace-style/shoelace/dist/components/divider/divider.component.js';
import SlBadge from '@shoelace-style/shoelace/dist/components/badge/badge.component.js';
import Debouncer from '../../data/helper/Debouncer';

/**
 *
 */
@customElement('ww-geom-context-menu')
export class WwGeomContextMenu extends LitElementWw {
  @property({ type: Array, attribute: true }) items: ContextMenuItem[] = [];
  @property({ type: Boolean, attribute: 'open' }) _open = false;
  @property({ type: Number, attribute: true }) x = 0;
  @property({ type: Number, attribute: true }) y = 0;

  @query('sl-menu.menu') menu!: SlMenu;

  public open(x: number, y: number) {
    this._open = true;
    this.x = x;
    this.y = y;
    this.menu?.focus();
  }
  public close() {
    this._open = false;
    this.menu?.blur();
  }

  private getContextMenuItem(item: ContextMenuItem): TemplateResult {
    switch (item.type) {
      case 'button':
        return html`<sl-menu-item
          value="${item.key}"
          .disabled=${item.disabled ?? false}>
          ${item.label}
          ${item.badge
            ? html`<sl-badge slot="suffix" variant="neutral">
                ${item.badge}
              </sl-badge>`
            : ''}
        </sl-menu-item>`;
      case 'checkbox':
        return html`<sl-menu-item
          value="${item.key}"
          type="checkbox"
          .checked=${item.getChecked()}
          .disabled=${item.disabled ?? false}>
          ${item.label}
        </sl-menu-item>`;
      case 'submenu':
        return html`<sl-menu-item>
          ${item.label}
          <sl-menu slot="submenu">
            ${item.items.map((item) => this.getContextMenuItem(item))}
          </sl-menu>
        </sl-menu-item>`;
      case 'divider':
        return html`<sl-divider></sl-divider>`;
      default:
        return html``;
    }
  }

  private lastTimestamp = -1;
  private handleClick(e: SlSelectEvent, items = this.items) {
    // prevent double fired events
    if (items === this.items && e.timeStamp - this.lastTimestamp < 50) return;
    this.lastTimestamp = e.timeStamp;
    e.stopPropagation();
    e.preventDefault();
    const key = e.detail.item.value;
    if (!key) return;
    const item = items.find((item) => 'key' in item && item.key === key);
    if (!item) {
      items.forEach((item) => {
        if (item.type === 'submenu') this.handleClick(e, item.items);
      });
    } else {
      if (item.type !== 'button' && item.type !== 'checkbox') return;

      if (item.type === 'checkbox') {
        item.action(e.detail.item.checked);
        e.detail.item.checked = item.getChecked();
      } else item.action();
    }
  }

  private onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') this.close();
  }

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this.onKeydown.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.onKeydown);
  }

  render() {
    return html`<sl-menu
      class="menu${this._open ? ' open' : ''}"
      style="left: ${this.x}px; top: ${this.y}px"
      @sl-select="${this.handleClick.bind(this)}">
      ${this.items.map((item) => this.getContextMenuItem(item))}
    </sl-menu> `;
  }

  static styles = css`
    .menu {
      position: absolute;
      z-index: 1000;
    }
    .menu:not(.open) {
      display: none;
    }
    sl-menu:not(.menu) {
      top: 0;
      bottom: 0;
      overflow: auto;
      max-height: 50vh;
    }
  `;

  public static get scopedElements() {
    return {
      'sl-menu': SlMenu,
      'sl-menu-item': SlMenuItem,
      'sl-divider': SlDivider,
      'sl-badge': SlBadge
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geom-context-menu': WwGeomContextMenu;
  }
}
