import { LitElementWw } from '@webwriter/lit';
import { css, html } from 'lit';

export default class WwKbd extends LitElementWw {
  protected render(): unknown {
    return html`<kbd><slot></slot></kbd>`;
  }

  static styles = css`
    kbd {
      display: inline-block;
      background: var(--sl-color-neutral-600);
      border: solid 1px var(--sl-color-neutral-500);
      box-shadow:
        inset 0 1px 0 0 var(--sl-color-neutral-700),
        inset 0 -1px 0 0 var(--sl-color-neutral-500);
      font-family: var(--sl-font-mono);
      font-size: 0.9125em;
      border-radius: var(--sl-border-radius-small);
      color: var(--sl-color-neutral-100);
      padding: 0.125em 0.4em;
    }
  `;
}
