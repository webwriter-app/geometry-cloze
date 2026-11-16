# Geometry Cloze (`@webwriter/geometry-cloze@3.0.0`)
[License: MIT](LICENSE) | Version: 3.0.0

Create and view geometry exercises with coloring, styling and labeling options.

## Snippets
[Snippets](https://webwriter.app/docs/snippets/snippets/) are examples and templates using the package's widgets.

| Name | Import Path |
| :--: | :---------: |
| Geometry Cloze | `@webwriter/geometry-cloze/snippets/geometry-cloze.html` |
| Polygon | `@webwriter/geometry-cloze/snippets/polygon.html` |
| Right Triangle | `@webwriter/geometry-cloze/snippets/right-triangle.html` |



## `WwGeometryCloze` (`<ww-geometry-cloze>`)
The geometry cloze widgets allows for the creation and embedding of geometric
figures. It provides a 1000 x 700 unit wide canvas which can contain
arbitrary polygons, lines and points with custom styling, labels and
measurements.

If the widget is `contenteditable`, the user can interactively create and
edit the shapes on the canvas. Otherwise, the canvas is rendered as a static
image.

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
| `WwGeometryCloze.actions` | `object` | - | `{ selectTool: { label: 'Select and move objects', shortcut: 'S', can: 'edit', hidden: true }, createTool: { label: 'Create and connect objects', shortcut: 'C', can: 'edit', hidden: true }, dividerTool: { label: 'Create divider lines', shortcut: 'D', can: 'edit', hidden: true }, deleteSelection: { label: 'Delete selected objects', shortcut: ['Delete', 'Backspace'], can: 'edit', hidden: true }, cancel: { label: 'Cancel the current step', shortcut: 'Escape', can: 'edit', hidden: true }, selectAll: { label: 'Select all objects', shortcut: 'Shift+A', can: 'edit', hidden: true } }` | ✗ |
| `msg` | - | - | - | ✗ |
| `mode` (`mode`) | `CanvasData['mode']` | Active editing mode, accepting three possible values:<br>- `select`: Move and connect objects<br>- `create`: Create and connect objects<br>- `divider`: Create divider lines | `'select'` | ✓ |
| `WwGeometryCloze.settings` | - | - | `declarations` | ✗ |
| `settingsCore` | - | - | `new SettingsCore(this, { ...options, root: () => this.renderRoot, rendered: () => this.updateComplete })` | ✗ |
| `options` | - | - | - | ✗ |

*Fields including [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) and [attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) define the current state of the widget and offer customization options.*

## Methods
| Name | Description | Parameters |
| :--: | :---------: | :-------: |
| `selectTool` | - | -
| `createTool` | - | -
| `dividerTool` | - | -
| `deleteSelection` | - | -
| `cancel` | - | -
| `selectAll` | - | -
| `finalize` | - | -

*[Methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions) allow programmatic access to the widget.*

## Editing config
| Name | Value |
| :--: | :---------: |


*The [editing config](https://webwriter.app/docs/packages/configuring/#editingconfig) defines how explorable authoring tools such as [WebWriter](https://webwriter.app) treat the widget.*

*No public slots, events, custom CSS properties, or CSS parts.*


---
*Generated with @webwriter/build@1.9.1*