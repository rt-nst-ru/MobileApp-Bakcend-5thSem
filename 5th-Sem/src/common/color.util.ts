/**
 * Curated high-contrast ANSI colors for deterministic user coloring.
 * Consistent across restarts and Docker environments.
 */
const ANSI_COLORS = [
  '\x1b[38;5;196m', // Vibrant Red
  '\x1b[38;5;46m',  // Vibrant Green
  '\x1b[38;5;220m', // Gold / Amber
  '\x1b[38;5;39m',  // Sky Blue
  '\x1b[38;5;201m', // Magenta / Hot Pink
  '\x1b[38;5;51m',  // Cyan
  '\x1b[38;5;208m', // Neon Orange
  '\x1b[38;5;118m', // Bright Lime
  '\x1b[38;5;141m', // Soft Purple
  '\x1b[38;5;45m',  // Electric Turquoise
  '\x1b[38;5;213m', // Rose Pink
  '\x1b[38;5;75m',  // Cornflower Blue
];

const ANSI_RESET = '\x1b[0m';
const ANSI_BOLD = '\x1b[1m';
const ANSI_DIM = '\x1b[2m';

/**
 * Deterministic djb2 hash.
 * Always produces identical number for identical input string.
 */
export function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash >>> 0);
}

/**
 * Colorizes a user name deterministically.
 * The same username will always render in the exact same color.
 */
export function colorizeName(name: string): string {
  if (!name) return `${ANSI_DIM}Unknown${ANSI_RESET}`;
  const index = hashString(name) % ANSI_COLORS.length;
  const color = ANSI_COLORS[index];
  return `${color}${ANSI_BOLD}${name}${ANSI_RESET}`;
}
