const bookLines: readonly string[] = [
  "e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4 g8f6 e1g1 f8e7 f1e1 b7b5 a4b3 d7d6",
  "e2e4 e7e5 g1f3 b8c6 f1c4 f8c5 c2c3 g8f6 d2d3 d7d6",
  "e2e4 e7e5 g1f3 b8c6 d2d4 e5d4 f3d4 g8f6 d4c6 b7c6",
  "e2e4 e7e5 g1f3 g8f6 f3e5 d7d6 e5f3 f6e4 d2d4 d6d5",
  "e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 a7a6",
  "e2e4 c7c5 g1f3 b8c6 d2d4 c5d4 f3d4 g8f6 b1c3 e7e5",
  "e2e4 c7c5 g1f3 e7e6 d2d4 c5d4 f3d4 b8c6 b1c3 d8c7",
  "e2e4 e7e6 d2d4 d7d5 b1c3 g8f6 c1g5 f8e7 e4e5 f6d7",
  "e2e4 c7c6 d2d4 d7d5 b1c3 d5e4 c3e4 c8f5 e4g3 f5g6",
  "e2e4 d7d5 e4d5 d8d5 b1c3 d5a5 d2d4 g8f6",
  "d2d4 d7d5 c2c4 e7e6 b1c3 g8f6 c1g5 f8e7 e2e3 e8g8",
  "d2d4 d7d5 c2c4 c7c6 g1f3 g8f6 b1c3 d5c4 a2a4 c8f5",
  "d2d4 g8f6 c2c4 e7e6 b1c3 f8b4 e2e3 e8g8 f1d3 d7d5",
  "d2d4 g8f6 c2c4 g7g6 b1c3 f8g7 e2e4 d7d6 g1f3 e8g8",
  "d2d4 g8f6 c2c4 e7e6 g1f3 d7d5 b1c3 f8e7",
  "d2d4 d7d5 g1f3 g8f6 c1f4 e7e6 e2e3 c7c5",
  "c2c4 e7e5 b1c3 g8f6 g1f3 b8c6 g2g3 d7d5",
  "g1f3 d7d5 g2g3 g8f6 f1g2 e7e6 e1g1 f8e7",
];

const book: readonly (readonly string[])[] = bookLines.map((l) => l.split(" "));
const maxBookPly = 14;

export function bookMove(
  played: readonly string[],
  isLegal: (uci: string) => boolean,
): string | null {
  if (played.length >= maxBookPly) return null;
  const options = new Set<string>();
  for (const line of book) {
    if (line.length <= played.length) continue;
    let matches = true;
    for (let i = 0; i < played.length; i++)
      if (line[i] !== played[i]) {
        matches = false;
        break;
      }
    if (matches) options.add(line[played.length]);
  }
  const legal = Array.from(options).filter(isLegal);
  return legal.length ? legal[Math.floor(Math.random() * legal.length)] : null;
}
