const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value);

const isEnd = (value: unknown) =>
  isRecord(value) &&
  (value._type === 'reference'
    ? isNumber(value.id)
    : value._type === 'absolute' && isNumber(value.x) && isNumber(value.y));

const isChild = (value: unknown) =>
  isRecord(value) &&
  isNumber(value.id) &&
  (value._type === 'point'
    ? isNumber(value.x) && isNumber(value.y)
    : value._type === 'line' && isEnd(value.start) && isEnd(value.end));

const isObject = (value: unknown) =>
  isRecord(value) &&
  isNumber(value.id) &&
  (value._type === 'element'
    ? Array.isArray(value.children) && value.children.every(isChild)
    : value._type === 'divider-line' && isEnd(value.start) && isEnd(value.end));

export type FigureRead =
  | { elements: unknown[] }
  | { error: 'syntax' | 'shape' };

/**
 * Reads the text of a figure file: the `elements` list of the data block, or
 * the list alone. Only the structure is checked, not the geometry.
 */
export function readFigure(text: string): FigureRead {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { error: 'syntax' };
  }
  const elements = Array.isArray(value)
    ? value
    : isRecord(value)
      ? value.elements
      : undefined;
  if (!Array.isArray(elements) || !elements.every(isObject))
    return { error: 'shape' };
  return { elements };
}
