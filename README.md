# Geometry Cloze (`@webwriter/geometry-cloze@3.1.1`)
[License: MIT](LICENSE) | Version: 3.1.1

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

### Input

The canvas takes mouse, pen and touch input (pointer events). A long press
with touch does what a right click does. With the keyboard: Tab reaches the
toolbar and the canvas; on the canvas the arrow keys move the selection (or a
cursor when nothing is selected, in steps of the snapping grid, Alt for fine
steps), Enter or Space acts at the cursor like a click, Page Up and Page Down
step through the objects, and S, C, D, Shift+A, Delete and Escape work as
before.

### Theme

The text color follows `--ww-text-color`, the font of the labels follows
`--ww-font-family`, and the selection and the keyboard cursor use
`--ww-theme-accent-1`. The colors of the drawn objects are authored data and
stay as they are.

### Conversions

- Export `image/svg+xml`: the objects as an SVG picture of 1000 x 700 units,
  without grid, selection or keyboard cursor. Lossy: the picture cannot be
  edited again.
- Convert to `img`: the same SVG as a data URL.
- Import and export `.json`: the `elements` list of the data block
  (described at `elements`). Settings such as `scale` are attributes and are
  not part of the file. A file with the list alone is accepted too.

### Print

The toolbar is hidden and the canvas prints as the picture shown on screen.

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
| `WwGeometryCloze.convertFrom` | `object` | - | `{ '.json': 'importJson' }` | ✗ |
| `WwGeometryCloze.convertTo` | `object` | - | `{ 'image/svg+xml': 'exportSvg', '.json': 'exportJson', img: 'toImage' }` | ✗ |
| `WwGeometryCloze.actions` | `object` | - | `{ selectTool: { label: 'Select and move objects', shortcut: 'S', can: 'edit', hidden: true }, createTool: { label: 'Create and connect objects', shortcut: 'C', can: 'edit', hidden: true }, dividerTool: { label: 'Create divider lines', shortcut: 'D', can: 'edit', hidden: true }, deleteSelection: { label: 'Delete selected objects', shortcut: ['Delete', 'Backspace'], can: 'edit', hidden: true }, cancel: { label: 'Cancel the current step', shortcut: 'Escape', can: 'edit', hidden: true }, selectAll: { label: 'Select all objects', shortcut: 'Shift+A', can: 'edit', hidden: true }, clear: { label: (widget: Texts) => widget.msg('Clear canvas'), confirm: (widget: Texts) => widget.msg('Remove all objects from the canvas?'), intent: 'danger' as const, can: 'edit' } }` | ✗ |
| `msg` | - | - | - | ✗ |
| `mode` (`mode`) | `CanvasData['mode']` | Active editing mode, accepting three possible values:<br>- `select`: Move and connect objects<br>- `create`: Create and connect objects<br>- `divider`: Create divider lines | `'select'` | ✓ |

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
| `clear` | - | -
| `exportSvg` | - | -
| `toImage` | - | -
| `exportJson` | - | -
| `importJson` | - | `file: File`

*[Methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions) allow programmatic access to the widget.*

## CSS parts
| Name | Description |
| :--: | :---------: |
| canvas | The drawing area. |

*[CSS parts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_shadow_parts) allow freely styling internals of the widget with CSS.*

## Editing config
| Name | Value |
| :--: | :---------: |


*The [editing config](https://webwriter.app/docs/packages/configuring/#editingconfig) defines how explorable authoring tools such as [WebWriter](https://webwriter.app) treat the widget.*

*No public slots, events, or custom CSS properties.*


---
*Generated with @webwriter/build@1.15.0*
