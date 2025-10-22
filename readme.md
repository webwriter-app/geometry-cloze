# Geometry Cloze (`@webwriter/geometry-cloze@2.4.2`)
[License: MIT](LICENSE) | Version: 2.4.0

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
| `elements` (`elements`) | `CanvasData['children']` | A JSON-serialized list of all the objects that make up the canvas. Each<br>object is either a polygon element or a divider line, described below.<br><br>### Elements<br><br>- Represents a drawable object on the 1000×700 canvas.<br>- Every object must include a `"_type"` field to indicate its type.<br>- Every object must provide a numeric `id` that is unique across the entire<br>  canvas.<br><br>### Polygon Object (`"_type": "element"`)<br><br>- `id` (number): Unique identifier for the shape.<br>- `fill` (string, optional): `'transparent'` or a palette color with a `50`<br>  alpha suffix (for example `"#2563eb50"`).<br>- `labelColor` (string, optional): Palette color applied to any label<br>  rendered for the shape.<br>- `showArea`, `showPerimeter` (boolean, optional): Enable live area and<br>  perimeter labels respectively. When either is `true`, required child<br>  labels are shown automatically.<br>- `children` (array): Mix of point and line definitions describing the<br>  polygon.<br><br>### Point Child (`"_type": "point"`)<br><br>- `id` (number): Unique identifier within the shape.<br>- `x`, `y` (number): Absolute coordinates on the canvas.<br>- `fill` (string, optional): Palette color for the point marker. When<br>  omitted, the point defaults to black.<br>- `showLabel` (boolean, optional): When `true`, renders an angle marker<br>  and label around the point.<br>- `labelColor` (string, optional): Palette color for the angle label.<br>- `labelStyle` (string, optional): `'name'` renders a fixed letter;<br>  `'value'` displays the measured angle.<br>- `labelName` (string, optional): One of `['α','β','γ','δ','ε','ζ','η','θ',<br>  'ι','κ','λ','μ','ν','ξ','ο','π','ρ','σ','τ','υ','φ','χ','ω','ϡ','ͳ','ϸ']`<br>  when `labelStyle` is `'name'`.<br>- `showOutsideAngle` (boolean, optional): When `true`, the displayed angle<br>  wraps around the exterior.<br><br>### Line Child (`"_type": "line"`)<br><br>- `id` (number): Unique identifier within the shape.<br>- `start`, `end` (object): Either `{ "_type": "reference", "id": <pointId> }`<br>  to reuse a point or `{ "_type": "absolute", "x": number, "y": number }`<br>  for an independent endpoint.<br>- `lineWidth` (number, optional): Width of the line in px, should be one<br>  of `1`, `2`, `3`, `5`, `7`.<br>- `stroke` (string, optional): Palette color for the stroke.<br>- `showLabel` (boolean, optional): When `true`, renders a length label<br>  along the line.<br>- `labelColor` (string, optional): Palette color for the line label.<br>- `labelStyle` (string, optional): `'name'` renders a chosen letter;<br>  `'value'` displays the live length.<br>- `labelName` (string, optional): One of `['a','b','c','d','e','f','g','h',<br>  'i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']`<br>  when `labelStyle` is `'name'`.<br><br>### Divider Line (`"_type": "divider-line"`)<br><br>- `id` (number): Unique identifier.<br>- `start`, `end` (object): Always absolute coordinate objects of the form<br>  `{ "_type": "absolute", "x": number, "y": number }`.<br>- `lineWidth`, `stroke`, `labelColor`, `showLabel`, `labelStyle`,<br>  `labelName`: Same meaning and value sets as for regular lines. Divider<br>  strokes are automatically rendered with a dashed pattern.<br><br>### Palette Colors<br><br>\| Color  \| Hex       \|<br>\| ------ \| --------- \|<br>\| Black  \| `#131316` \|<br>\| Red    \| `#dc2626` \|<br>\| Orange \| `#ea580c` \|<br>\| Yellow \| `#ca8a04` \|<br>\| Lime   \| `#65a30d` \|<br>\| Green  \| `#16a34a` \|<br>\| Cyan   \| `#0891b2` \|<br>\| Blue   \| `#2563eb` \|<br>\| Violet \| `#7c3aed` \|<br>\| Pink   \| `#db2777` \| | - | ✓ |
| `mode` (`mode`) | `CanvasData['mode']` | Active editing mode, accepting three possible values:<br>- `select`: Move and connect objects<br>- `create`: Create and connect objects<br>- `divider`: Create divider lines | `'select'` | ✓ |
| `abstractRightAngle` (`abstractRightAngle`) | `CanvasData['abstractRightAngle']` | If set, right angles will be rendered as a square instead of a curved arc. | `false` | ✓ |
| `hideGrid` (`hideGrid`) | `CanvasData['showGrid']` | If set, the grid will not be rendered. | `false` | ✓ |
| `disableSnapping` (`disableSnapping`) | `CanvasData['snapping']` | If set, user interactions will not snap to the grid.<br>Does not depend on whether the grid is visible or hidden. | `false` | ✓ |
| `scale` (`scale`) | `number` | Global scale factor for the entire canvas.<br>Importantly, this does not effect the rendering of the shapes themselves, only the labels showing lengths and sizes. | `1` | ✓ |

*Fields including [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) and [attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) define the current state of the widget and offer customization options.*

## Editing config
| Name | Value |
| :--: | :---------: |


*The [editing config](https://webwriter.app/docs/packages/configuring/#editingconfig) defines how explorable authoring tools such as [WebWriter](https://webwriter.app) treat the widget.*

*No public methods, slots, events, custom CSS properties, or CSS parts.*


---
*Generated with @webwriter/build@1.9.0*