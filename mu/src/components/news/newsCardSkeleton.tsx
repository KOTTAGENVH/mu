export function NewsCardSkeleton() {
  return (
    <div className="flex gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5">
      <div className="w-16 h-16 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-3/4 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        <div className="h-3 w-full rounded bg-black/5 dark:bg-white/5 animate-pulse" />
        <div className="h-3 w-16 rounded bg-black/5 dark:bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
