export const Stat: React.FC<{ label: string; value: number; tone?: "good" }> = ({
  label,
  value,
  tone,
}) => (
  <div className="rounded-2xl px-3 py-2 bg-gray-100 dark:bg-gray-800">
    <p
      className={`m-0 font-mono text-base ${
        tone === "good"
          ? "text-green-700 dark:text-green-400"
          : value > 0
            ? "text-amber-700 dark:text-amber-400"
            : "text-slate-500 dark:text-slate-400"
      }`}
    >
      {value.toLocaleString()}
    </p>
    <p className="m-0 text-[11px] text-slate-500 dark:text-slate-400">
      {label}
    </p>
  </div>
);

export const btn =
  "inline-flex items-center justify-center px-4 py-2.5 rounded-2xl border-none cursor-pointer bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
