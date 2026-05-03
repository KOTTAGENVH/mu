export default function ControlBtn({
  children,
  label,
  title,
  disabled,
  active,
  onClick,
  small,
  ...rest
}: {
  children: React.ReactNode;
  label: string;
  title?: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
  small?: boolean;
  [key: string]: unknown;
}) {
  return (
    <button
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={onClick}
      {...rest}
      className={[
        "relative inline-flex items-center justify-center w-10 h-10 rounded-full border-none cursor-pointer outline-none transition-all duration-150 ease-out focus-none",
        disabled
          ? "opacity-30 cursor-not-allowed text-white/50"
          : active
            ? "text-blue-400 bg-gray-300 dark:bg-gray-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
            : "text-black/70 dark:text-white/70 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
      ].join(" ")}
    >
      {children}
    </button>
  );
}