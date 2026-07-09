export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        <div className="aspect-square animate-pulse rounded-2xl bg-border" />
        <div className="flex flex-col gap-4">
          <div className="h-8 w-3/4 animate-pulse rounded-full bg-border" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-border" />
          <div className="h-24 animate-pulse rounded-xl bg-border" />
          <div className="h-12 w-40 animate-pulse rounded-full bg-border" />
        </div>
      </div>
    </div>
  );
}
