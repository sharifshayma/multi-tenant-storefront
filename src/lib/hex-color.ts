/** True only for a full `#rrggbb` hex color (leading #, exactly 6 hex digits). */
export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
