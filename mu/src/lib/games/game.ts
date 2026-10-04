import {
  faChessKnight,
  faPersonSnowboarding,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

export interface Game {
  id: string;
  name: string;
  tagline: string;
  description: string;
  href: string;
  icon: IconDefinition;
  categories: string[];
  minPlayers: number;
  maxPlayers: number;
  duration: string;
}

export const games: Game[] = [
  {
    id: "chess",
    name: "Chess",
    tagline: "Classic strategy",
    description:
      "Plan ahead, control the centre and checkmate the king before yours falls.",
    href: "/chess",
    icon: faChessKnight,
    categories: ["Board", "Strategy"],
    minPlayers: 1,
    maxPlayers: 2,
    duration: "10-30 min",
  }
];

export const gameCategories = Array.from(
  new Set(games.flatMap((g) => g.categories)),
);
