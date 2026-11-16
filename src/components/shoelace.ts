const computedStyle = getComputedStyle(document.documentElement);
const cssVar = (name: string, unit?: string): string => {
  let value = computedStyle.getPropertyValue(name).trim();

  if (value.startsWith('var(')) return cssVar(value.slice(4, -1));
  if (unit && value.endsWith(unit)) value = value.slice(0, -unit.length).trim();

  return value;
};

const conversionCtx = document.createElement('canvas').getContext('2d')!;
export function hslToHex(hsl: string) {
  conversionCtx.fillStyle = hsl;
  return conversionCtx.fillStyle;
}

// A selection of Shoelace design tokens used in the app
// See https://shoelace.style/tokens/typography
const SHOELACE = {
  font: {
    sans: cssVar('--sl-font-sans')
  },
  focus: {
    ringColor: cssVar('--sl-focus-ring-color'),
    ringWidthPx: +cssVar('--sl-focus-ring-width', 'px')
  },
  color: {
    neutral: {
      300: cssVar('--sl-color-neutral-300')
    },
    gray: {
      950: cssVar('--sl-color-gray-950')
    },
    red: {
      500: cssVar('--sl-color-red-600')
    },
    orange: {
      500: cssVar('--sl-color-orange-600')
    },
    yellow: {
      500: cssVar('--sl-color-yellow-600')
    },
    lime: {
      500: cssVar('--sl-color-lime-600')
    },
    green: {
      500: cssVar('--sl-color-green-600')
    },
    teal: {
      500: cssVar('--sl-color-teal-600')
    },
    cyan: {
      500: cssVar('--sl-color-cyan-600')
    },
    blue: {
      500: cssVar('--sl-color-blue-600')
    },
    violet: {
      500: cssVar('--sl-color-violet-600')
    },
    purple: {
      500: cssVar('--sl-color-purple-600')
    },
    pink: {
      500: cssVar('--sl-color-pink-600')
    }
  }
};

export default SHOELACE;
