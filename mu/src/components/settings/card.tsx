import { useAudioEq } from "@/contextApi/audioEnhance";
import { useVisualizer, VisualizerMode } from "@/contextApi/audioVizualizer";
import { useMask } from "@/contextApi/mask";
import { useSearch } from "@/contextApi/sematicSearch";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface SettingCardProps {
  id: number;
  title: string;
  icon: IconDefinition;
  busy?: boolean;
  onClick: (id: number) => void;
}

function SettingCard({
  id,
  title,
  icon,
  busy = false,
  onClick,
}: SettingCardProps) {
  const { sematicSearch } = useSearch();
  const { maskStatus } = useMask();
  const { useCompressor } = useAudioEq();
  const { mode } = useVisualizer();

  const baseBtnClass =
    "relative flex flex-col items-center justify-center gap-2 h-32 w-32 p-3 rounded-2xl border-none cursor-pointer";
  const defaultBtnClass =
    "bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 transition-colors duration-150";

  return (
    <button
      title={`Select setting: ${title}`}
      aria-label={`Select setting: ${title}`}
      disabled={busy}
      onClick={() => onClick(id)}
      className={`${baseBtnClass} ${defaultBtnClass}`}
    >
      <FontAwesomeIcon
        icon={icon}
        className={`w-5 h-5 ${busy ? "animate-pulse" : ""}`}
      />
      <span className="text-sm font-medium text-gray-800 dark:text-white text-center leading-tight">
        {title}
      </span>
      {id === 3 && (
        <span
          className={`${sematicSearch ? "bg-green-500 dark:bg-green-700" : "bg-red-500 dark:bg-red-700"} absolute top-2 right-2 text-xs font-mono text-white rounded-full px-2 py-0.5`}
        ></span>
      )}
      {id === 6 && (
        <span
          className={`${maskStatus ? "bg-green-500 dark:bg-green-700" : "bg-red-500 dark:bg-red-700"} absolute top-2 right-2 text-xs font-mono text-white rounded-full px-2 py-0.5`}
        ></span>
      )}
      {id === 8 && (
        <span
          className={`${useCompressor ? "bg-green-500 dark:bg-green-700" : "bg-red-500 dark:bg-red-700"} absolute top-2 right-2 text-xs font-mono text-white rounded-full px-2 py-0.5`}
        ></span>
      )}

      {id === 9 && (
        <span
          className={`
    absolute top-2 right-2
    text-xs font-mono text-white rounded-full px-2 py-0.5
    ${
      {
        [VisualizerMode.Off]: "bg-red-500 dark:bg-red-700",
        [VisualizerMode.Matrix]: "bg-green-500 dark:bg-green-700",
        [VisualizerMode.Bars]: "bg-cyan-500 dark:bg-cyan-700",
        [VisualizerMode.Spiral]: "bg-pink-500 dark:bg-pink-700",
      }[mode]
    }
  `}
        />
      )}
    </button>
  );
}

export default SettingCard;
