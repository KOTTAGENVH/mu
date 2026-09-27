import { inputClass } from "../audioFilterPanel";

export function Section({
  title,
  error,
  className = "",
  children,
}: {
  title: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={className}>
      <h3 className="mb-2.5 text-sm font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      {children}
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}

export function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-xl border-none px-3.5 py-2.5 text-left text-sm leading-tight transition-colors duration-150 cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:py-2
        ${
          active
            ? "bg-blue-100 font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
            : "bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
        }`}
    >
      {children}
    </button>
  );
}


export function RangeInputs({
  label,
  min,
  max,
  onMin,
  onMax,
}: {
  label: string;
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
}) {
  const clean = (v: string) => v.replace(/\D/g, "").slice(0, 7);
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="block">
        <span className="sr-only">Minimum {label}</span>
        <input
          inputMode="numeric"
          placeholder="Min"
          value={min}
          onChange={(e) => onMin(clean(e.target.value))}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="sr-only">Maximum {label}</span>
        <input
          inputMode="numeric"
          placeholder="Max"
          value={max}
          onChange={(e) => onMax(clean(e.target.value))}
          className={inputClass}
        />
      </label>
    </div>
  );
}
