import { motion } from "framer-motion";
import { Newspaper } from "lucide-react";

export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint: string;
  icon?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "backOut" }}
      className="min-h-[30vh] flex flex-col items-center justify-center text-center py-10 gap-3"
    >
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-1">
        {icon ?? (
          <Newspaper className="w-7 h-7 text-gray-400 dark:text-gray-500" />
        )}
      </div>
      <p className="text-black dark:text-white text-lg font-medium">{title}</p>
      <span className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        {hint}
      </span>
    </motion.div>
  );
}
