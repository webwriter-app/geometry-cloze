import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
// init shoelace
import './misc/shoelaceSetup';

/**
 * A widget to create and view geometry exercises.
 */
@customElement('ww-geometry-cloze')
export class WwGeometryCloze extends LitElement {
  render() {
    return html` <h1>Geometry cloze goes here</h1> `;
  }

  static styles = css``;
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geometry-cloze': WwGeometryCloze;
  }
}
