/** Minecraft legacy formatting codes (§0–§f, §l/§o/§n/§m, §r). */

export const MINECRAFT_COLORS: Record<string, string> = {
  '0': '#000000',
  '1': '#0000AA',
  '2': '#00AA00',
  '3': '#00AAAA',
  '4': '#AA0000',
  '5': '#AA00AA',
  '6': '#FFAA00',
  '7': '#AAAAAA',
  '8': '#555555',
  '9': '#5555FF',
  a: '#55FF55',
  b: '#55FFFF',
  c: '#FF5555',
  d: '#FF55FF',
  e: '#FFFF55',
  f: '#FFFFFF',
};

interface McStyle {
  color: string | null;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
}

const DEFAULT_STYLE: McStyle = {
  color: null,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
};

function cloneStyle(style: McStyle): McStyle {
  return { ...style };
}

function applyStyle(span: HTMLSpanElement, style: McStyle) {
  if (style.color) span.classList.add(`mc-${style.color}`);
  if (style.bold) span.classList.add('mc-bold');
  if (style.italic) span.classList.add('mc-italic');
  const deco: string[] = [];
  if (style.underline) deco.push('underline');
  if (style.strikethrough) deco.push('line-through');
  if (deco.length) span.style.textDecoration = deco.join(' ');
}

function appendSegment(parent: HTMLElement, text: string, style: McStyle) {
  if (!text) return;
  const span = document.createElement('span');
  span.textContent = text;
  applyStyle(span, style);
  parent.appendChild(span);
}

function applyFormattingCode(code: string, style: McStyle) {
  const key = code.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(MINECRAFT_COLORS, key)) {
    style.color = key;
    style.bold = false;
    style.italic = false;
    style.underline = false;
    style.strikethrough = false;
    return;
  }
  switch (key) {
    case 'r':
      style.color = null;
      style.bold = false;
      style.italic = false;
      style.underline = false;
      style.strikethrough = false;
      break;
    case 'l':
      style.bold = true;
      break;
    case 'o':
      style.italic = true;
      break;
    case 'n':
      style.underline = true;
      break;
    case 'm':
      style.strikethrough = true;
      break;
    default:
      break;
  }
}

/**
 * Render Minecraft §-formatted text into an element using CSS classes
 * instead of inline styles, so colors can be overridden by theme CSS.
 */
export function applyMinecraftFormattedClasses(element: HTMLElement, text: string) {
  element.replaceChildren();
  const str = String(text ?? '');
  if (!str) return;

  const style = cloneStyle(DEFAULT_STYLE);
  let buf = '';
  for (let i = 0; i < str.length; i += 1) {
    if (str[i] === '§' && i + 1 < str.length) {
      appendSegment(element, buf, style);
      buf = '';
      applyFormattingCode(str[i + 1], style);
      i += 1;
      continue;
    }
    buf += str[i];
  }
  appendSegment(element, buf, style);
}

export function stripMinecraftFormatting(text: string): string {
  return String(text ?? '').replace(/§./g, '');
}

export function hasMinecraftFormatting(text: string): boolean {
  return /§./.test(String(text ?? ''));
}
