import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { readJSON, writeJSON } from "../lib/games/chess/storage";

export function usePersistentState<T>(
  key: string,
  fallback: T,
  normalize?: (saved: T) => T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const saved = readJSON<T>(key, fallback);
    return normalize ? normalize(saved) : saved;
  });
  useEffect(() => {
    writeJSON(key, value);
  }, [key, value]);
  return [value, setValue];
}
