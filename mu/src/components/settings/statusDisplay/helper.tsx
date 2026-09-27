import { formatBytes, pill, UsageState, usageTone } from "../statusDisplay";

export function Card({
  title,
  icon: Icon,
  meta,
  className = "",
  children,
}: {
  title: string;
  icon: React.ElementType;
  meta?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`flex min-w-0 flex-col rounded-2xl bg-white p-4 ring-1 ring-slate-200
        dark:bg-[#0e1628] dark:ring-white/[0.07] sm:p-5 ${className}`}
    >
      <header className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        {meta}
      </header>
      {children}
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="truncate font-medium tabular-nums text-slate-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}

export function UsageRing({
  percent,
  colorClass,
}: {
  percent: number;
  colorClass: string;
}) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          className="stroke-slate-200 dark:stroke-white/10"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap={clamped > 0 ? "round" : "butt"}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className={`${colorClass} transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
          {clamped.toFixed(clamped < 10 ? 1 : 0)}%
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">used</span>
      </div>
    </div>
  );
}

export function StorageSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex animate-pulse flex-col items-center gap-4 motion-reduce:animate-none min-[400px]:flex-row"
    >
      <div className="h-28 w-28 shrink-0 rounded-full bg-slate-200 dark:bg-white/[0.07] sm:h-32 sm:w-32" />
      <div className="w-full flex-1 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-3.5 rounded bg-slate-200 dark:bg-white/[0.07]"
          />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse space-y-2 motion-reduce:animate-none"
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-14 rounded-xl bg-slate-100 dark:bg-white/[0.05]"
        />
      ))}
    </div>
  );
}

export function CardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full border-none bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 transition-colors cursor-pointer
          hover:bg-slate-200 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.14]"
      >
        Try again
      </button>
    </div>
  );
}

export function StorageCard({
  title,
  icon,
  state,
  ringClass,
  countLabel,
  avgLabel,
  onRetry,
}: {
  title: string;
  icon: React.ElementType;
  state: UsageState;
  ringClass: string;
  countLabel: string;
  avgLabel: string;
  onRetry: () => void;
}) {
  const pct =
    state.totalBytes > 0 ? (state.usedBytes / state.totalBytes) * 100 : 0;
  const tone = usageTone(pct);
  const free = Math.max(0, state.totalBytes - state.usedBytes);
  const avg = state.count > 0 ? state.usedBytes / state.count : 0;
  const ready = !state.loading && !state.error;

  return (
    <Card
      title={title}
      icon={icon}
      meta={
        ready ? (
          <span className={`${pill} ${tone.cls}`}>{tone.label}</span>
        ) : null
      }
    >
      {state.loading ? (
        <StorageSkeleton />
      ) : state.error ? (
        <CardError
          message={`Couldn't load ${title.toLowerCase()} usage.`}
          onRetry={onRetry}
        />
      ) : (
        <div className="flex flex-col items-center gap-4 min-[400px]:flex-row sm:gap-6">
          <UsageRing percent={pct} colorClass={ringClass} />
          <dl className="grid w-full min-w-0 flex-1 gap-2 text-sm">
            <Stat label="Used" value={formatBytes(state.usedBytes)} />
            <Stat label="Free" value={formatBytes(free)} />
            <Stat label="Total" value={formatBytes(state.totalBytes)} />
            <Stat label={countLabel} value={state.count.toLocaleString()} />
            <Stat label={avgLabel} value={formatBytes(avg)} />
          </dl>
        </div>
      )}
    </Card>
  );
}

export function Switch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200
        ${on ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 motion-reduce:transition-none
          ${on ? "translate-x-[22px]" : "translate-x-0.5"}`}
      />
    </span>
  );
}

export function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-blue-500"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function MiniStat({
  label,
  value,
  dot,
}: {
  label: string;
  value: number;
  dot?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/[0.04]">
      <dt className="flex items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
        {dot && (
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${dot}`}
            aria-hidden="true"
          />
        )}
        {label}
      </dt>
      <dd className="mt-0.5 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
        {value.toLocaleString()}
      </dd>
    </div>
  );
}

export const tabClass = (active: boolean) =>
  `rounded-lg border-none px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer
     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
     ${
       active
         ? "bg-white text-slate-900 shadow-sm dark:bg-white/[0.12] dark:text-white"
         : "bg-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
     }`;
