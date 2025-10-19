import { localized, msg } from '@lit/localize';
import { LitElementWw } from '@webwriter/lit';
import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import SHOELACE, { hslToHex } from '../../data/helper/Shoelace';

/**
 * A simple color picker component that displays a grid of color options.
 * Emits an `input` event with the selected color when a color is clicked.
 */
@localized()
export default class WwColorPicker extends LitElementWw {
  public static get COLORS() {
    return [
      {
        label: msg('Black'),
        color: hslToHex(SHOELACE.color.gray[950])
      },
      {
        label: msg('Red'),
        color: hslToHex(SHOELACE.color.red[500])
      },
      {
        label: msg('Orange'),
        color: hslToHex(SHOELACE.color.orange[500])
      },
      {
        label: msg('Yellow'),
        color: hslToHex(SHOELACE.color.yellow[500])
      },
      {
        label: msg('Lime'),
        color: hslToHex(SHOELACE.color.lime[500])
      },
      {
        label: msg('Green'),
        color: hslToHex(SHOELACE.color.green[500])
      },
      {
        label: msg('Cyan'),
        color: hslToHex(SHOELACE.color.cyan[500])
      },
      {
        label: msg('Blue'),
        color: hslToHex(SHOELACE.color.blue[500])
      },
      {
        label: msg('Violet'),
        color: hslToHex(SHOELACE.color.violet[500])
      },
      {
        label: msg('Pink'),
        color: hslToHex(SHOELACE.color.pink[500])
      }
    ] as const;
  }

  public static get COLORS_WITH_TRANSPARENT() {
    return [
      {
        label: msg('Transparent'),
        color: 'transparent'
      },
      ...WwColorPicker.COLORS
    ] as const;
  }

  @property({ type: String, attribute: true })
  accessor value = '';

  /**
   * If true, includes a "transparent" color option at the start of the list.
   */
  @property({ type: Boolean, attribute: 'include-transparent' })
  accessor includeTransparent = false;

  render() {
    const colors = this.includeTransparent
      ? WwColorPicker.COLORS_WITH_TRANSPARENT
      : WwColorPicker.COLORS;

    return html`${colors.map(({ label, color }) => {
      return html`<button
        class=${classMap({ current: this.value === color })}
        title="${label}"
        @click=${() => {
          this.dispatchEvent(
            new CustomEvent('input', {
              detail: color,
              bubbles: true,
              composed: true
            })
          );
        }}>
        ${color === 'transparent'
          ? html`<div class="color-swatch color-swatch__transparent"></div>`
          : html`<div
              class="color-swatch"
              style="background-color: ${color};"></div>`}
      </button>`;
    })}`;
  }

  static styles = css`
    :host {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
    }

    button {
      border: none;
      background: none;
      cursor: pointer;
      padding: var(--sl-spacing-x-small);
      margin: 0;
      border-radius: var(--sl-border-radius-medium);
    }

    .color-swatch {
      position: relative;
      width: 1.5em;
      height: 1.5em;
      border-radius: var(--sl-border-radius-circle);
    }

    .current .color-swatch {
      outline: 4px solid var(--sl-color-primary-200);
    }

    .color-swatch__transparent {
      background: repeating-conic-gradient(
          var(--sl-color-neutral-300) 0 25%,
          transparent 0 50%
        )
        0 0 / 10px 10px;
      background-position: center;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-color-picker': WwColorPicker;
  }
}
