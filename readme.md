# Geometry,Cloze (`@webwriter/geometry-cloze@2.0.6`)
[License: MIT](LICENSE) | Version: 2.0.6

Create and view geometry exercises with coloring, styling and labeling options.

## Snippets
[Snippets](https://webwriter.app/docs/snippets/snippets/) are examples and templates using the package's widgets.

| Name | Import Path |
| :--: | :---------: |
| Geometry Cloze | @webwriter/geometry-cloze/snippets/geometry-cloze.html |
| Polygon | @webwriter/geometry-cloze/snippets/polygon.html |
| Right Triangle | @webwriter/geometry-cloze/snippets/right-triangle.html |



## `WwGeometryCloze` (`<ww-geometry-cloze>`)
Geometry cloze widget that renders the interactive canvas and manages localization/state wiring.

### Usage

Use with a CDN (e.g. [jsdelivr](https://jsdelivr.com)):
```html
<link href="https://cdn.jsdelivr.net/npm/@webwriter/geometry-cloze/widgets/ww-geometry-cloze.css" rel="stylesheet">
<script type="module" src="https://cdn.jsdelivr.net/npm/@webwriter/geometry-cloze/widgets/ww-geometry-cloze.js"></script>
<ww-geometry-cloze></ww-geometry-cloze>
```

Or use with a bundler (e.g. [Vite](https://vite.dev)):

```
npm install @webwriter/geometry-cloze
```

```html
<link href="@webwriter/geometry-cloze/widgets/ww-geometry-cloze.css" rel="stylesheet">
<script type="module" src="@webwriter/geometry-cloze/widgets/ww-geometry-cloze.js"></script>
<ww-geometry-cloze></ww-geometry-cloze>
```

## Fields
| Name (Attribute Name) | Type | Description | Default | Reflects |
| :-------------------: | :--: | :---------: | :-----: | :------: |
| `elements` (`elements`) | `CanvasData['children']` | Serialized children describing the current canvas content provided by the host. | - | ✓ |
| `mode` (`mode`) | `CanvasData['mode']` | Active editing mode, accepting three possible values:<br>- 'select': Move and connect objects<br>- 'create': Create and connect objects<br>- 'divider': Create divider lines | `'select'` | ✓ |
| `abstractRightAngle` (`abstractRightAngle`) | `CanvasData['abstractRightAngle']` | Whether right angles will be drawn as small squares instead of arcs. | `false` | ✓ |
| `showGrid` (`showGrid`) | `CanvasData['showGrid']` | Whether the grid is shown on the canvas. | `true` | ✓ |
| `snap` (`snap`) | `CanvasData['snapping']` | Whether user interactions snap to the grid. | `true` | ✓ |

*Fields including [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) and [attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) define the current state of the widget and offer customization options.*

## Editing config
| Name | Value |
| :--: | :---------: |


*The [editing config](https://webwriter.app/docs/packages/configuring/#editingconfig) defines how explorable authoring tools such as [WebWriter](https://webwriter.app) treat the widget.*

*No public methods, slots, events, custom CSS properties, or CSS parts.*


---
*Generated with @webwriter/build@1.8.1*