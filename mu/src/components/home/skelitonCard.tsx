export default function SkeletonCard() {
  const block = "rounded bg-gray-200 dark:bg-white/[0.07]";

  return (
    <div
      aria-hidden="true"
      className="w-full animate-pulse rounded-2xl p-4 sm:p-5 motion-reduce:animate-none
        bg-white dark:bg-[#0e1628] ring-1 ring-slate-200 dark:ring-white/[0.07]"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`h-11 w-11 shrink-0 rounded-xl sm:h-12 sm:w-12 ${block}`}
        />
        <div className="min-w-0 flex-1 space-y-2 pt-1">
          <div className={`h-4 w-4/5 ${block}`} />
          <div className={`h-3 w-1/3 ${block}`} />
        </div>
        <div className={`h-5 w-5 shrink-0 rounded-full ${block}`} />
      </div>

      <div className={`mt-4 h-1.5 w-full rounded-full sm:mt-5 ${block}`} />
      <div className={`mt-2 h-3 w-1/2 ${block}`} />
      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3.5 dark:border-white/[0.07]">
        <div className={`h-6 w-16 rounded-full ${block}`} />
        <div className={`h-3 w-14 ${block}`} />
        <div className={`ml-auto h-3 w-12 ${block}`} />
      </div>
    </div>
  );
}
