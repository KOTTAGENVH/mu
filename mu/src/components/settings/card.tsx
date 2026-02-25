import { useSearch } from "@/contextApi/sematicSearch";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

interface SettingCardProps {
  id: number;
  title: string;
  icon: IconDefinition;
  onClick: (id: number) => void;
}

function SettingCard({ id, title, icon, onClick }: SettingCardProps) {
  const { sematicSearch } = useSearch();

  const baseBtnClass =
    "relative flex flex-col items-center justify-center gap-2 h-32 w-32 p-3 rounded-2xl border-none cursor-pointer";
  const defaultBtnClass =
    "bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 transition-colors duration-150";

  return (
    <button
      title={`Select setting: ${title}`}
      aria-label={`Select setting: ${title}`}
      onClick={() => onClick(id)}
      className={`${baseBtnClass} ${defaultBtnClass}`}
    >
      <FontAwesomeIcon icon={icon} className="w-5 h-5" />
      <span className="text-sm font-medium text-gray-800 dark:text-white text-center leading-tight">
        {title}
      </span>
      {id === 3 && (
        <span
          className={`${sematicSearch ? "bg-green-500 dark:bg-green-700" : "bg-red-500 dark:bg-red-700"} absolute top-2 right-2 text-xs font-mono text-white rounded-full px-2 py-0.5`}
        ></span>
      )}
    </button>
  );
}

export default SettingCard;
