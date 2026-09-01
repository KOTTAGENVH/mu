export const panelSurface = (
  isAppleWebkit: boolean,
  shadow: string = "shadow-2xl",
) =>
  isAppleWebkit
    ? `bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 ${shadow}`
    : `bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 ${shadow}`;


export const cardSurface = (isAppleWebkit: boolean) =>
  isAppleWebkit
    ? "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
    : "bg-white/5 dark:bg-black/10 backdrop-blur-2xl border border-white/20 dark:border-white/10";