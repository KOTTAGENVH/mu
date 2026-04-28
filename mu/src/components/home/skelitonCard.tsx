export default function SkeletonCard() {
  return (
    <div className="rounded-2xl p-4 bg-black/10 dark:bg-white/5 animate-pulse w-full min-w-[20rem]">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gray-300/50 dark:bg-gray-700/50 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300/50 dark:bg-gray-700/50 rounded-lg w-3/5" />
          <div className="h-3 bg-gray-300/30 dark:bg-gray-700/30 rounded-lg w-2/5" />
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-300/40 dark:bg-gray-700/40" />
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-gray-300/30 dark:bg-gray-700/30 w-full" />
    </div>
  );
}