import { useState } from "react";

interface TooltipProps {
  label: string;
  children: React.ReactNode;
}
 
export function Tooltip({ label, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
 
  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <span
        role="tooltip"
        className={`
          pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2
          whitespace-nowrap rounded-md px-2.5 py-1
          text-[11px] font-medium tracking-wide
          bg-slate-800 text-slate-100 dark:bg-slate-700 dark:text-slate-200
          shadow-lg ring-1 ring-slate-700/60
          transition-all duration-150
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}
        `}
      >
        {label}
      </span>
    </div>
  );
}