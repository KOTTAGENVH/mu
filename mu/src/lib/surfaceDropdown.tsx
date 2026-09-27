const glass =
  "backdrop-blur-xl backdrop-saturate-150 [-webkit-backdrop-filter:blur(24px)_saturate(150%)]";

export const panelSurface = (
  _isAppleWebkit: boolean,
  shadow: string = "shadow-2xl",
) =>
  `bg-transparent ${glass} border-none ${shadow}`;

export const cardSurface = (_isAppleWebkit: boolean) =>
  `bg-white/50 dark:bg-slate-900/40 ${glass} border border-black/5 dark:border-white/10`;
