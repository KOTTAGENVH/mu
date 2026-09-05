"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Globe2, MapPin, MapPinned, X } from "lucide-react";
import { inter, roboto } from "@/app/fonts";
import {
  getUnNews,
  getDestinationGuide,
  getAdaDerana,
  type UnRegion,
} from "../../app/api/client/services/news/latest_news/api";
import {
  local_country,
  regionForCountry,
  region_colors,
  region_labels,
  type Region,
} from "../../lib/news/geography";
import { NewsCard, type NewsCardData } from "./newsCard";
import { NewsCardSkeleton } from "./newsCardSkeleton";
import { EmptyState } from "./emptyStateCard";

interface Guide {
  title: string;
  description: string | null;
  image: string | null;
  source: string | null;
}

type Mode = "country" | "continent";

function toArticles(content: unknown): NewsCardData[] {
  if (Array.isArray(content)) return content as NewsCardData[];
  if (content && typeof content === "object") {
    const record = content as Record<string, unknown>;
    for (const key of ["all", "items", "articles", "results", "latest"]) {
      if (Array.isArray(record[key])) return record[key] as NewsCardData[];
    }
    const first = Object.values(record).find(Array.isArray);
    if (first) return first as NewsCardData[];
  }
  return [];
}

const extra_terms: Record<string, string[]> = {
  "United States": [
    "us",
    "u.s.",
    "usa",
    "american",
    "americans",
    "washington",
    "white house",
  ],
  "United Kingdom": ["uk", "u.k.", "britain", "british", "london"],
  "United Arab Emirates": ["uae", "emirati", "abu dhabi", "dubai"],
  "Democratic Republic of the Congo": [
    "drc",
    "dr congo",
    "dem. rep. congo",
    "congolese",
    "kinshasa",
    "goma",
  ],
  "Republic of the Congo": ["congo-brazzaville", "brazzaville"],
  "Central African Republic": ["car", "central african", "bangui"],

  // Europe
  Russia: ["russian", "russians", "moscow", "kremlin"],
  Ukraine: ["ukrainian", "ukrainians", "kyiv", "kiev", "donbas"],
  France: ["french", "paris"],
  Germany: ["german", "germans", "berlin"],
  Italy: ["italian", "rome"],
  Spain: ["spanish", "madrid"],
  Poland: ["polish", "warsaw"],
  Netherlands: ["dutch", "the hague", "amsterdam"],
  Switzerland: ["swiss", "geneva", "bern"],
  Turkey: ["turkish", "türkiye", "turkiye", "ankara", "istanbul"],
  Greece: ["greek", "athens"],
  Belarus: ["belarusian", "minsk"],
  Serbia: ["serbian", "belgrade"],
  Kosovo: ["kosovar", "pristina"],
  Moldova: ["moldovan", "chisinau"],
  Armenia: ["armenian", "yerevan", "nagorno-karabakh"],
  Azerbaijan: ["azerbaijani", "azeri", "baku"],
  Georgia: ["georgian", "tbilisi"],

  // Asia Pacific
  China: ["chinese", "beijing", "prc"],
  India: ["indian", "indians", "new delhi", "delhi"],
  Japan: ["japanese", "tokyo"],
  "South Korea": ["korean", "seoul", "republic of korea", "rok"],
  "North Korea": ["dprk", "pyongyang"],
  Indonesia: ["indonesian", "jakarta"],
  Pakistan: ["pakistani", "islamabad", "karachi"],
  Bangladesh: ["bangladeshi", "dhaka", "rohingya"],
  "Sri Lanka": ["sri lankan", "colombo"],
  Myanmar: ["burma", "burmese", "naypyidaw", "yangon", "rakhine"],
  Afghanistan: ["afghan", "afghans", "kabul", "taliban"],
  Philippines: ["filipino", "philippine", "manila"],
  Vietnam: ["vietnamese", "hanoi"],
  Thailand: ["thai", "bangkok"],
  Nepal: ["nepali", "nepalese", "kathmandu"],
  Australia: ["australian", "canberra", "sydney"],
  "New Zealand": ["new zealander", "wellington", "auckland"],
  "Papua New Guinea": ["png", "port moresby"],
  "East Timor": ["timor-leste", "timorese", "dili"],

  // Middle East
  Israel: ["israeli", "israelis", "tel aviv", "jerusalem"],
  Palestine: [
    "palestinian",
    "palestinians",
    "gaza",
    "west bank",
    "rafah",
    "opt",
  ],
  Iran: ["iranian", "tehran"],
  Iraq: ["iraqi", "baghdad"],
  Syria: ["syrian", "damascus", "aleppo"],
  Lebanon: ["lebanese", "beirut", "hezbollah"],
  Yemen: ["yemeni", "sanaa", "aden", "houthi", "houthis"],
  "Saudi Arabia": ["saudi", "saudis", "riyadh"],
  Jordan: ["jordanian", "amman"],
  Qatar: ["qatari", "doha"],
  Kuwait: ["kuwaiti"],
  Bahrain: ["bahraini", "manama"],
  Oman: ["omani", "muscat"],

  // Africa
  Egypt: ["egyptian", "cairo"],
  Nigeria: ["nigerian", "abuja", "lagos"],
  "South Africa": ["south african", "pretoria", "johannesburg"],
  Ethiopia: ["ethiopian", "addis ababa", "tigray"],
  Kenya: ["kenyan", "nairobi"],
  Sudan: ["sudanese", "khartoum", "darfur"],
  "South Sudan": ["south sudanese", "juba"],
  Somalia: ["somali", "mogadishu", "al-shabaab"],
  Libya: ["libyan", "tripoli"],
  Morocco: ["moroccan", "rabat"],
  Algeria: ["algerian", "algiers"],
  Tunisia: ["tunisian", "tunis"],
  Mali: ["malian", "bamako", "sahel"],
  "Burkina Faso": ["burkinabe", "ouagadougou"],
  Niger: ["nigerien", "niamey"],
  Chad: ["chadian", "n'djamena"],
  Zimbabwe: ["zimbabwean", "harare"],
  Uganda: ["ugandan", "kampala"],
  Tanzania: ["tanzanian", "dodoma", "dar es salaam"],
  Ghana: ["ghanaian", "accra"],
  Mozambique: ["mozambican", "maputo", "cabo delgado"],
  "Ivory Coast": ["ivorian", "côte d'ivoire", "cote d'ivoire", "abidjan"],
  Cameroon: ["cameroonian", "yaounde", "yaoundé"],
  Madagascar: ["malagasy", "antananarivo"],

  // Americas
  Canada: ["canadian", "ottawa"],
  Mexico: ["mexican", "mexico city"],
  Brazil: ["brazilian", "brasilia", "amazon"],
  Argentina: ["argentine", "argentinian", "buenos aires"],
  Colombia: ["colombian", "bogota", "bogotá"],
  Venezuela: ["venezuelan", "caracas"],
  Peru: ["peruvian", "lima"],
  Chile: ["chilean", "santiago"],
  Cuba: ["cuban", "havana"],
  Haiti: ["haitian", "port-au-prince"],
  Nicaragua: ["nicaraguan", "managua"],
  Honduras: ["honduran", "tegucigalpa"],
  Guatemala: ["guatemalan", "guatemala city"],
  "El Salvador": ["salvadoran", "san salvador"],
  Ecuador: ["ecuadorian", "quito"],
  Bolivia: ["bolivian", "la paz", "sucre"],
  Paraguay: ["paraguayan", "asuncion", "asunción"],
  Uruguay: ["uruguayan", "montevideo"],
  Panama: ["panamanian", "panama city"],
  "Costa Rica": ["costa rican", "san jose", "san josé"],
  "Dominican Republic": ["dominican", "santo domingo"],
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const re_cache = new Map<string, RegExp>();
function termRe(term: string): RegExp {
  let re = re_cache.get(term);
  if (!re) {
    re = new RegExp(
      `(^|[^\\p{L}\\p{N}])${escapeRe(term)}(?![\\p{L}\\p{N}])`,
      "iu",
    );
    re_cache.set(term, re);
  }
  return re;
}

function mentions(item: NewsCardData, country: string): boolean {
  const haystack = `${item.title ?? ""} ${item.description ?? ""}`;
  if (!haystack.trim()) return false;
  if (termRe(country).test(haystack)) return true;
  return (extra_terms[country] ?? []).some((term) =>
    termRe(term).test(haystack),
  );
}

interface CountryPanelProps {
  country: string | null;
  onClose: () => void;
}

function CountryPanel({ country, onClose }: CountryPanelProps) {
  const [regional, setRegional] = useState<NewsCardData[]>([]);
  const [localItems, setLocalItems] = useState<NewsCardData[]>([]);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState<Mode | null>(null);

  const requestId = useRef(0);

  const region: Region | null = country ? regionForCountry(country) : null;

  const load = useCallback(async (target: string, targetRegion: UnRegion) => {
    const id = ++requestId.current;

    setLoading(true);
    setError(null);
    setGuide(null);
    setLocalItems([]);

    try {
      const news = await getUnNews(targetRegion);
      if (id !== requestId.current) return;
      setRegional(toArticles(news.data?.latestContent));
    } catch (err) {
      if (id !== requestId.current) return;
      setError(
        err instanceof Error
          ? err.message
          : "Could not load news for this country",
      );
      setRegional([]);
    } finally {
      if (id === requestId.current) setLoading(false);
    }

    if (target === local_country) {
      try {
        const local = await getAdaDerana();
        if (id !== requestId.current) return;
        setLocalItems(toArticles(local.data?.latestContent).slice(0, 8));
      } catch {
        // console.warn("Ada derna not working !!");
      }
    }

    try {
      const result = await getDestinationGuide(target);
      if (id !== requestId.current) return;
      const content = result.data?.latestContent as Guide | null;
      if (content?.title) setGuide(content);
    } catch {
      if (id === requestId.current) setGuide(null);
    }
  }, []);

  useEffect(() => {
    if (!country) return;
    setManualMode(null);
    load(country, region ?? "all");
  }, [country, region, load]);

  useEffect(() => {
    if (!country) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [country, onClose]);

  const countryMatches = useMemo(() => {
    if (!country) return [];
    return regional.filter((item) => mentions(item, country));
  }, [regional, country]);

  const countryCount = localItems.length + countryMatches.length;
  const continentCount = localItems.length + regional.length;

  const autoMode: Mode = !region
    ? "continent"
    : loading
      ? "country"
      : countryCount === 0 && continentCount > 0
        ? "continent"
        : "country";

  const mode: Mode = manualMode ?? autoMode;

  const articles =
    mode === "country"
      ? [...localItems, ...countryMatches]
      : [...localItems, ...regional];

  const modes: Array<{ key: Mode; label: string; count: number }> = [
    { key: "country", label: country ?? "Country", count: countryCount },
    {
      key: "continent",
      label: region ? region_labels[region] : "Global",
      count: continentCount,
    },
  ];

  return (
    <AnimatePresence>
      {country && (
        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          aria-label={`News for ${country}`}
          className="mt-6 p-4 lg:p-6 rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: region ? region_colors[region] : "#9ca3af",
                  }}
                />
                <h2
                  className={`${inter.className} text-lg font-semibold text-black dark:text-white break-words`}
                >
                  {country}
                </h2>
              </div>
              <p
                className={`${roboto.className} mt-1 text-[13px] sm:text-xs text-black/60 dark:text-white/60`}
              >
                {region
                  ? `${region_labels[region]} desk · UN News`
                  : "No regional desk · showing the global UN News feed"}
              </p>
            </div>

            <button
              onClick={onClose}
              aria-label="Close country panel"
              className="flex-none w-9 h-9 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-full border-none cursor-pointer
                bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60
                hover:bg-black/10 dark:hover:bg-white/20 transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            role="tablist"
            aria-label="News scope"
           className="flex w-full sm:inline-flex sm:w-auto gap-1 p-1 mt-4 rounded-full bg-black/5 dark:bg-white/10"
          >
            {modes.map((option) => {
              const isActive = mode === option.key;
              return (
                <button
                  key={option.key}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setManualMode(option.key)}
                  className={`inline-flex min-w-0 flex-1 sm:flex-none justify-center items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-full text-[13px] sm:text-xs border-none cursor-pointer
                    transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
                    ${
                      isActive
                        ? "bg-blue-500 text-white font-medium"
                        : "text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                >
                  {option.key === "country" ? (
                    <MapPinned className="w-3.5 h-3.5" />
                  ) : (
                    <Globe2 className="w-3.5 h-3.5" />
                  )}
                  <span className="truncate max-w-[9rem]">{option.label}</span>
                  {!loading && (
                    <span
                      className={`tabular-nums ${isActive ? "text-white/70" : "text-black/40 dark:text-white/40"}`}
                    >
                      {option.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {guide && (
            <div className="flex gap-3 sm:gap-4 mt-4 p-3.5 sm:p-4 rounded-2xl bg-black/5 dark:bg-white/5">
              <Compass className="w-5 h-5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-black/55 dark:text-white/55">
                  <MapPin className="w-3 h-3" />
                  Wikivoyage
                </div>
                <p
                  className={`${roboto.className} mt-1.5 text-sm sm:text-xs leading-relaxed text-black/70 dark:text-white/70`}
                >
                  {guide.description}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 px-4 py-3 rounded-2xl bg-red-500/10 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <NewsCardSkeleton key={i} />
              ))}

            {!loading &&
              articles.map((item, i) => (
                <NewsCard key={`${item.source}-${i}`} item={item} index={i} />
              ))}
          </div>

          {!loading && !error && articles.length === 0 && (
            <EmptyState
              title="Nothing filed yet"
              hint={
                mode === "country" && continentCount > 0
                  ? "No story names this country. Switch to the regional feed."
                  : "This desk has no recent stories. Try another country or check back later."
              }
              icon={
                <Globe2 className="w-7 h-7 text-gray-400 dark:text-gray-500" />
              }
            />
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default CountryPanel;
