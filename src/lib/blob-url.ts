// True iff `value` is an https URL on Vercel Blob's public host — the only
// image origin next.config's remotePatterns allows. Guarding on this before
// persisting an image URL keeps a bad value from making <Image src> 500 at
// request time. Seeded covers are static `/images/...` paths (not URLs), so
// they correctly return false here and must never be passed to blob `del()`.
export function isVercelBlobUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return (
      u.protocol === "https:" &&
      u.hostname.endsWith(".public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}
