/**
 * Boundary helpers for admin money <input> fields.
 *
 * Money is stored everywhere as integer minor units (e.g. 4000 = 40.00 in the
 * store's currency). Admin forms display and accept the major-unit value
 * (what a human types, e.g. "40" or "40.50") and must convert at the form
 * boundary before calling a server action — server actions still receive
 * integer minor units.
 */

/** Converts stored minor units to the string shown in a money <input>. */
export function minorToInput(minor: number): string {
  return (minor / 100).toString();
}

/** Converts a money <input> string back to integer minor units. Returns 0 for NaN/empty input. */
export function inputToMinor(value: string): number {
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
}
