import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "./headerToolTip";
import { faHouse } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

interface NavButtonProps {
  icon: typeof faHouse;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  ariaLabel: string;
}


export default function NavButton({
  icon,
  label,
  active = false,
  danger = false,
  onClick,
  ariaLabel,
}: NavButtonProps) {
 
  const base =
    "relative inline-flex items-center justify-center w-10 h-10 rounded-full border-none cursor-pointer outline-none transition-all duration-150 ease-out focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-1";
 
  const variant = danger
    ? "bg-gray-100 hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-950/40"
    : active
    ? "bg-gray-300 dark:bg-gray-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
    : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700";
 
  return (
    <Tooltip label={label}>
      <button
        aria-label={ariaLabel}
        className={`${base} ${variant}`}
        onClick={onClick}
      >
        <FontAwesomeIcon
          icon={icon}
          className={`w-4 h-4 transition-colors duration-150 ${
            danger
              ? "text-red-500 dark:text-red-400"
              : active
              ? "text-slate-900 dark:text-white"
              : "text-slate-600 dark:text-slate-300"
          }`}
        />
      </button>
    </Tooltip>
  );
}
 