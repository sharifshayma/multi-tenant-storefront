/** Builds a URL-safe slug from a title, keeping only the ASCII/English portion (book titles are bilingual, e.g. "محمد صلاح | Mo Salah"). */
export function slugify(input: string): string {
  const ascii = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x00-\x7F]/g, "");
  const slug = ascii
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  return slug || `book-${Date.now().toString(36)}`;
}
