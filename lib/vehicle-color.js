import { CAR_WHITE_SVG } from './car-white-svg';

/**
 * Vehicle colours for the shared ride page. This mirrors
 * fluxgo-frontend/src/lib/vehicleColor.ts so the website car matches the app.
 */
export const VEHICLE_COLOR_FALLBACK = '#77786F';

const COMMON_VEHICLE_COLORS = {
  black: '#202124', charcoal: '#353735', graphite: '#3E4445', grey: '#77786F', gray: '#77786F',
  'dark grey': '#555750', 'dark gray': '#555750', 'light grey': '#A5A79F', 'light gray': '#A5A79F',
  silver: '#A7ADB4', 'metallic silver': '#A7ADB4', white: '#F4F4EF', 'pearl white': '#F3F0E5', pearl: '#F3F0E5',
  ivory: '#F2E9D2', cream: '#F2E5C5', beige: '#D4BE9A', red: '#C9362F', maroon: '#7A2026', burgundy: '#6F1D2B',
  blue: '#2867B2', navy: '#1E3B67', 'dark blue': '#1E3B67', 'light blue': '#5FA9D8', sky: '#5FA9D8', cyan: '#1F9FB0',
  teal: '#267F76', green: '#378447', 'dark green': '#236337', 'light green': '#66A653', olive: '#6B7A2D',
  yellow: '#D7A817', gold: '#C28B1A', orange: '#D9761F', brown: '#774B32', purple: '#7050A3', violet: '#7050A3', pink: '#BE5A7E'
};

const SAFE_HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function namedColor(value) {
  const normalized = value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (COMMON_VEHICLE_COLORS[normalized]) return COMMON_VEHICLE_COLORS[normalized];
  return Object.entries(COMMON_VEHICLE_COLORS)
    .map(([name, color]) => ({ name, color, index: normalized.indexOf(name) }))
    .filter((entry) => entry.index >= 0)
    .sort((left, right) => left.index - right.index || right.name.length - left.name.length)[0]?.color;
}

function toRgb(hex) {
  if (!SAFE_HEX.test(hex)) return null;
  const raw = hex.slice(1);
  const full = raw.length <= 4 ? raw.slice(0, 3).split('').map((part) => part + part).join('') : raw.slice(0, 6);
  return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16) };
}

function toHex({ r, g, b }) {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

/** Resolve provider colour text to a safe hex value. Unknown names use a neutral grey. */
export function vehicleColorToHex(value) {
  const input = String(value ?? '').trim();
  if (!input) return VEHICLE_COLOR_FALLBACK;
  const named = namedColor(input);
  if (named) return named;
  const rgb = toRgb(input);
  return rgb ? toHex(rgb) : VEHICLE_COLOR_FALLBACK;
}

/** Lighten (positive) or darken (negative) a safe colour. */
export function adjustVehicleColor(hex, amount) {
  const rgb = toRgb(hex) ?? toRgb(VEHICLE_COLOR_FALLBACK);
  const adjust = (channel) => Math.round(amount >= 0 ? channel + (255 - channel) * amount : channel * (1 + amount));
  return toHex({ r: adjust(rgb.r), g: adjust(rgb.g), b: adjust(rgb.b) });
}

const CAR_VIEW_BOX = '120 140 980 620';

/** The app's car artwork, painted in the vehicle colour. Browsers support its filters, so they stay. */
export function colorizedCarSvg(color) {
  const body = vehicleColorToHex(color);
  const highlight = adjustVehicleColor(body, 0.45);
  const shadow = adjustVehicleColor(body, -0.2);
  const deep = adjustVehicleColor(body, -0.42);
  return CAR_WHITE_SVG
    .replace(/<\?xml[^>]*\?>/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<linearGradient id="paint4_linear_3_8"[\s\S]*?<\/linearGradient>)/, (gradient) => gradient
      .replace('#D8D8D8', shadow)
      .replace('stop-color="white"', `stop-color="${highlight}"`))
    .replace('viewBox="0 -96 1226 1226"', `viewBox="${CAR_VIEW_BOX}"`)
    .replace(/width="800px" height="800px"/, 'width="100%" height="100%" aria-hidden="true" focusable="false"')
    .replace(/#E8EAE9/gi, highlight)
    .replace(/#707072/gi, body)
    .replace(/#2F3032/gi, deep)
    .replace(/#C4C4C4/gi, highlight)
    .replace(/#ECEAEA/gi, highlight)
    .replace(/#999999/gi, shadow)
    .trim();
}
