export const DESTINATIONS = [
  // Asia
  "Sri_Lanka",
  "India",
  "Nepal",
  "Bhutan",
  "Bangladesh",
  "Pakistan",
  "Maldives",
  "Thailand",
  "Vietnam",
  "Cambodia",
  "Laos",
  "Myanmar",
  "Malaysia",
  "Singapore",
  "Indonesia",
  "Philippines",
  "Japan",
  "South_Korea",
  "China",
  "Taiwan",
  "Hong_Kong",
  "Mongolia",
  "Kazakhstan",
  "Uzbekistan",

  // Middle East
  "United_Arab_Emirates",
  "Qatar",
  "Oman",
  "Saudi_Arabia",
  "Jordan",
  "Israel",
  "Lebanon",
  "Turkey",
  "Iran",

  // Europe
  "United_Kingdom",
  "Ireland",
  "France",
  "Spain",
  "Portugal",
  "Italy",
  "Germany",
  "Netherlands",
  "Belgium",
  "Luxembourg",
  "Switzerland",
  "Austria",
  "Czech_Republic",
  "Poland",
  "Hungary",
  "Slovakia",
  "Slovenia",
  "Croatia",
  "Bosnia_and_Herzegovina",
  "Serbia",
  "Montenegro",
  "Albania",
  "Greece",
  "Bulgaria",
  "Romania",
  "Denmark",
  "Norway",
  "Sweden",
  "Finland",
  "Iceland",
  "Estonia",
  "Latvia",
  "Lithuania",
  "Ukraine",
  "Russia",
  "Malta",
  "Cyprus",

  // Africa
  "Egypt",
  "Morocco",
  "Tunisia",
  "Kenya",
  "Tanzania",
  "Uganda",
  "Rwanda",
  "Ethiopia",
  "Ghana",
  "Nigeria",
  "Senegal",
  "South_Africa",
  "Namibia",
  "Botswana",
  "Zambia",
  "Zimbabwe",
  "Mauritius",
  "Seychelles",
  "Madagascar",

  // Americas
  "United_States_of_America",
  "Canada",
  "Mexico",
  "Cuba",
  "Jamaica",
  "Dominican_Republic",
  "Costa_Rica",
  "Panama",
  "Guatemala",
  "Belize",
  "Colombia",
  "Ecuador",
  "Peru",
  "Bolivia",
  "Brazil",
  "Chile",
  "Argentina",
  "Uruguay",

  // Oceania
  "Australia",
  "New_Zealand",
  "Fiji",
  "Papua_New_Guinea",
] as const;

export type Destination = (typeof DESTINATIONS)[number];

const aliases: Record<string, Destination> = {
  usa: "United_States_of_America",
  us: "United_States_of_America",
  "united states": "United_States_of_America",
  america: "United_States_of_America",
  uk: "United_Kingdom",
  "great britain": "United_Kingdom",
  britain: "United_Kingdom",
  england: "United_Kingdom",
  uae: "United_Arab_Emirates",
  dubai: "United_Arab_Emirates",
  holland: "Netherlands",
  czechia: "Czech_Republic",
  burma: "Myanmar",
  korea: "South_Korea",
  ceylon: "Sri_Lanka",
  lanka: "Sri_Lanka",
  bosnia: "Bosnia_and_Herzegovina",
};

function normalise(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const lookup: ReadonlyMap<string, Destination> = new Map<string, Destination>([
  ...DESTINATIONS.map(
    (title) => [normalise(title), title] as [string, Destination],
  ),
  ...Object.entries(aliases),
]);

export function resolveDestination(value: string): Destination | null {
  if (typeof value !== "string" || value.length > 80) return null;
  return lookup.get(normalise(value)) ?? null;
}

export const isKnownDestination = (value: string): boolean =>
  resolveDestination(value) !== null;

export const destinationOptions = DESTINATIONS.map((title) => ({
  value: title,
  label: title.replace(/_/g, " "),
}));
