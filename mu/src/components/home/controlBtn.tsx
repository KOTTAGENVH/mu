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
        small ? "w-7 h-7 sm:w-8 sm:h-8" : "w-8 h-8 sm:w-9 sm:h-9",
        "rounded-full flex items-center justify-center",
        "transition-all duration-150 active:scale-90",
        "focus:outline-none border-none",
        disabled
          ? "opacity-30 cursor-not-allowed text-white/50"
          : active
            ? "text-blue-400 bg-blue-400/10 hover:bg-blue-400/20"
            : "text-white/70 bg-white/5 hover:bg-white/15 hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}