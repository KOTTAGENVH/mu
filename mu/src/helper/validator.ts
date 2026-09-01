const invisible = /[\p{Cc}\p{Cf}\p{Co}\p{Cs}\p{Zl}\p{Zp}]/u;

const variation = /[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/u;

const odd_space = /[^\S ]/u;

/** Zalgo cleaner*/
const mark_run = /\p{M}{5,}/u;

const leading_mark = /^\p{M}/u;

const has_letter_or_digit = /[\p{L}\p{N}]/u;

const max_raw_length_factor = 8;

const script_patterns = [
  ["Latin", /\p{Script=Latin}/u],
  ["Cyrillic", /\p{Script=Cyrillic}/u],
  ["Greek", /\p{Script=Greek}/u],
  ["Arabic", /\p{Script=Arabic}/u],
  ["Hebrew", /\p{Script=Hebrew}/u],
  ["Han", /\p{Script=Han}/u],
  ["Hiragana", /\p{Script=Hiragana}/u],
  ["Katakana", /\p{Script=Katakana}/u],
  ["Hangul", /\p{Script=Hangul}/u],
  ["Devanagari", /\p{Script=Devanagari}/u],
  ["Thai", /\p{Script=Thai}/u],
] as const;

const cjk_scripts = new Set(["Han", "Hiragana", "Katakana", "Hangul"]);

function hasSuspiciousScriptMix(value: string): boolean {
  const scripts = script_patterns
    .filter(([, pattern]) => pattern.test(value))
    .map(([name]) => name);
  if (scripts.length < 2) return false;
  return !scripts
    .filter((script) => script !== "Latin")
    .every((script) => cjk_scripts.has(script));
}

export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

export function validateText(
  raw: unknown,
  fieldName: string,
  maxLength = 200,
): ValidationResult {
  const reject = (message: string): ValidationResult => ({
    ok: false,
    message: `${fieldName} ${message}`,
  });

  if (typeof raw !== "string") return reject("is required");

  if (raw.length > maxLength * max_raw_length_factor)
    return reject("is too long");

  const value = raw.normalize("NFC").trim();

  if (value.length === 0) return reject("is empty");
  if ([...value].length > maxLength) return reject("is too long");

  if (invisible.test(value) || variation.test(value)) {
    return reject("contains invisible or control characters");
  }
  if (odd_space.test(value)) return reject("contains unusual whitespace");
  if (leading_mark.test(value)) return reject("starts with a combining mark");
  if (mark_run.test(value)) return reject("contains too many combining marks");
  if (!has_letter_or_digit.test(value))
    return reject("must contain a letter or number");
  // if (hasSuspiciousScriptMix(value)) return reject("mixes character sets");

  return { ok: true, value };
}
