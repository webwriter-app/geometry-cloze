import { localized } from '@lit/localize';
import { LitElementWw } from '@webwriter/lit';
import { css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import NoneIcon from '../icons/none';

@localized()
export default class WwLetterPicker extends LitElementWw {
  @property({ type: String, attribute: true })
  accessor value: string | null = null;

  @property({ type: String, attribute: true })
  accessor alphabet: keyof typeof WwLetterPicker.LETTERS = 'latin-lowercase';

  @property({ type: String, attribute: 'special' })
  accessor special: string | null = null;

  public static LETTERS = {
    'latin-lowercase': 'abcdefghijklmnopqrstuvwxyz'.split(''),
    'latin-uppercase': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    'greek-lowercase': 'αβγδεζηθικλμνξοπρστυφχωϡͳϸ'.split(''),
    'greek-uppercase': 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΩϠϢϷ'.split('')
  };

  render() {
    const onClick = (letter: string | null) =>
      this.dispatchEvent(new CustomEvent('input', { detail: letter }));

    return html`
      <button
        class=${classMap({ current: this.value === 'none' })}
        @click=${onClick.bind(this, 'none')}
        title="No letter">
        ${NoneIcon}
      </button>
      ${this.special
        ? html`
            <button
              class=${classMap({ current: this.value === 'special' })}
              @click=${onClick.bind(this, 'special')}
              title=${this.special}>
              <slot></slot>
            </button>
          `
        : nothing}
      ${WwLetterPicker.LETTERS[this.alphabet].map((letter) => {
        return html`
          <button
            class=${classMap({ current: this.value === letter })}
            @click=${onClick.bind(this, letter)}>
            ${letter}
          </button>
        `;
      })}
    `;
  }

  static styles = css`
    :host {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
    }

    button {
      display: flex;
      align-items: center;
      justify-content: center;

      width: 2.5em;
      height: 2em;
      margin: 0;
      padding: 0;

      border: none;
      background: none;
      font: inherit;
      color: inherit;

      border-radius: var(--sl-border-radius-medium);
      cursor: pointer;
    }

    button:not(.current):hover {
      color: var(--sl-color-primary-700);
    }

    .current {
      background-color: var(--sl-color-primary-600);
      color: var(--sl-color-neutral-0);
    }

    svg {
      display: block;
      width: 1.5em;
      height: 1.5em;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-letter-picker': WwLetterPicker;
  }
}
