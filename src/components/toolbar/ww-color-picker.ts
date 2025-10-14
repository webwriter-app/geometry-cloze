import { localized, msg } from '@lit/localize';
import { LitElementWw } from '@webwriter/lit';
import { html, css } from 'lit';
import { property } from 'lit/decorators.js';

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
        color: '#111827'
      },
      {
        label: msg('Red'),
        color: '#dc2626'
      },
      {
        label: msg('Orange'),
        color: '#ea580c'
      },
      {
        label: msg('Yellow'),
        color: '#facc15'
      },
      {
        label: msg('Lime'),
        color: '#84cc16'
      },
      {
        label: msg('Green'),
        color: '#15803d'
      },
      {
        label: msg('Cyan'),
        color: '#06b6d4'
      },
      {
        label: msg('Blue'),
        color: '#2563eb'
      },
      {
        label: msg('Violet'),
        color: '#6d28d9'
      },
      {
        label: msg('Pink'),
        color: '#db2777'
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
        class="color-button"
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
      grid-template-columns: repeat(4, 1fr);
    }

    .color-button {
      border: none;
      background: none;
      cursor: pointer;
      padding: var(--sl-spacing-x-small);
      margin: 0;
    }

    .color-swatch {
      position: relative;
      width: 1.5em;
      height: 1.5em;
      border-radius: var(--sl-border-radius-circle);
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
