import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import './components/canvas/ww-geom-canvas';
// init shoelace
import './misc/shoelaceSetup';

/**
 * A widget to create and view geometry exercises.
 */
@customElement('ww-geometry-cloze')
export class WwGeometryCloze extends LitElement {
  render() {
    return html`<div>
      <ww-geom-canvas></ww-geom-canvas>
    </div>`;
  }

  static styles = css``;
}

declare global {
  interface HTMLElementTagNameMap {
    'ww-geometry-cloze': WwGeometryCloze;
  }
}
