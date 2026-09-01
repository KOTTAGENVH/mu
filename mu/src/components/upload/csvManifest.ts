export interface ManifestRow {
  title: string;
  file?: string;
  artist: string;
  category: string;
  line: number;
}

export type PlanStatus =
  | "ready"
  | "missing-file"
  | "ambiguous-file"
  | "unknown-category"
  | "invalid-artist"
  | "duplicate-row";

export type UploadState =
  | "queued"
  | "uploading"
  | "done"
  | "failed"
  | "skipped";

export interface PlanItem {
  id: string;
  line: number;
  title: string;
  fileName?: string;
  artist: string;
  category: string;
  categoryId?: string;
  file?: File;
  candidates?: File[];
  matchTier?: "exact" | "loose" | "aggressive";
  status: PlanStatus;
  upload: UploadState;
  error?: string;
  attempts: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface ReconcileOptions {
  defaultCategoryId?: string;
  sanitizeArtists?: boolean;
  artistPattern?: RegExp;
}

export interface ReconcileResult {
  items: PlanItem[];
  orphanFiles: File[];
  counts: Record<PlanStatus, number>;
}

export class CsvStreamParser {
  private field = "";
  private row: string[] = [];
  private inQuotes = false;
  private pendingQuote = false;
  private rowStarted = false;

  push(chunk: string, onRow: (row: string[]) => void): void {
    for (let i = 0; i < chunk.length; i++) {
      const c = chunk[i];

      if (this.pendingQuote) {
        this.pendingQuote = false;
        if (c === '"') {
          this.field += '"';
          this.rowStarted = true;
          continue;
        }
        this.inQuotes = false;
      }

      if (this.inQuotes) {
        if (c === '"') this.pendingQuote = true;
        else {
          this.field += c;
          this.rowStarted = true;
        }
        continue;
      }

      if (c === '"') {
        this.inQuotes = true;
        this.rowStarted = true;
      } else if (c === ",") {
        this.row.push(this.field);
        this.field = "";
        this.rowStarted = true;
      } else if (c === "\n") {
        this.row.push(this.field);
        onRow(this.row);
        this.row = [];
        this.field = "";
        this.rowStarted = false;
      } else if (c !== "\r") {
        this.field += c;
        this.rowStarted = true;
      }
    }
  }

  end(onRow: (row: string[]) => void): void {
    if (this.pendingQuote) {
      this.pendingQuote = false;
      this.inQuotes = false;
    }
    if (this.rowStarted || this.field.length > 0 || this.row.length > 0) {
      this.row.push(this.field);
      onRow(this.row);
      this.row = [];
      this.field = "";
      this.rowStarted = false;
    }
  }
}

const header_aliases: Record<string, keyof Omit<ManifestRow, "line">> = {
  "audio name": "title",
  title: "title",
  name: "title",
  song: "title",
  "file name": "file",
  filename: "file",
  file: "file",
  artist: "artist",
  author: "artist",
  category: "category",
  genre: "category",
};

export interface ParseManifestResult {
  rows: ManifestRow[];
  warnings: string[];
  truncated: boolean;
}

const formula_start = /^[\s\u0000-\u001f]*[=+\-@\t\r]/;

const invisible_chars = /[\p{Cc}\p{Cf}\p{Co}\p{Cs}\p{Zl}\p{Zp}]/gu;

function cleanCell(value: string): string {
  const stripped = value.replace(invisible_chars, "").normalize("NFC").trim();
  return formula_start.test(stripped) ? `'${stripped}` : stripped;
}

export async function parseManifestFile(
  file: File,
  opts: {
    maxRows?: number;
    onProgress?: (rowsSeen: number, bytesRead: number) => void;
    signal?: AbortSignal;
  } = {},
): Promise<ParseManifestResult> {
  const maxRows = opts.maxRows ?? 100_000;
  const rows: ManifestRow[] = [];
  const warnings: string[] = [];
  const max_warnings = 500;
  let suppressedWarnings = 0;
  const addWarning = (msg: string) => {
    if (warnings.length < max_warnings) warnings.push(msg);
    else suppressedWarnings++;
  };
  let truncated = false;
  let stopReading = false;

  let header: Array<keyof Omit<ManifestRow, "line"> | null> | null = null;
  let line = 0;
  let bytesRead = 0;

  const handleRow = (raw: string[]) => {
    line++;

    if (header === null) {
      const looksLikeHeader = raw.some(
        (cell) =>
          header_aliases[
            cell
              .trim()
              .toLowerCase()
              .replace(/^\ufeff/, "")
          ],
      );
      if (looksLikeHeader) {
        header = raw.map((cell) => {
          const key = cell
            .trim()
            .toLowerCase()
            .replace(/^\ufeff/, "");
          return header_aliases[key] ?? null;
        });
        return;
      }
      header = ["title", "artist", "category"];
      addWarning(
        "No header row found — assuming Audio Name, Artist, Category.",
      );
    }

    if (rows.length >= maxRows) {
      truncated = true;
      stopReading = true;
      return;
    }

    if (raw.every((cell) => cell.trim() === "")) return;

    const rec: Record<string, string> = {};
    for (let i = 0; i < raw.length; i++) {
      const key = header[i];
      if (key) rec[key] = cleanCell(raw[i]);
    }

    const title = (rec.title ?? "").replace(/^\ufeff/, "");
    if (!title) {
      addWarning(`Line ${line}: no audio name, row skipped.`);
      return;
    }

    rows.push({
      title,
      file: rec.file || undefined,
      artist: rec.artist || "Unknown Artist",
      category: rec.category || "",
      line,
    });
  };

  const parser = new CsvStreamParser();

  if (typeof file.stream === "function") {
    const reader = file.stream().getReader();
    const decoder = new TextDecoder("utf-8");
    let lastYield = Date.now();
    try {
      for (;;) {
        if (opts.signal?.aborted)
          throw new DOMException("Aborted", "AbortError");
        const { done, value } = await reader.read();
        if (done) break;
        bytesRead += value.byteLength;
        parser.push(decoder.decode(value, { stream: true }), handleRow);
        if (stopReading) break;

        if (Date.now() - lastYield > 16) {
          opts.onProgress?.(rows.length, bytesRead);
          await new Promise((r) => setTimeout(r, 0));
          lastYield = Date.now();
        }
      }
      if (!stopReading) parser.push(decoder.decode(), handleRow);
    } finally {
      await reader.cancel().catch(() => {});
    }
  } else {
    const text = await file.text();
    parser.push(text, handleRow);
  }

  parser.end(handleRow);
  opts.onProgress?.(rows.length, bytesRead);

  if (truncated) {
    warnings.push(`Manifest capped at ${maxRows.toLocaleString()} rows.`);
  }
  if (suppressedWarnings > 0) {
    warnings.push(`…and ${suppressedWarnings.toLocaleString()} more warnings.`);
  }
  return { rows, warnings, truncated };
}

const audio_ext = /\.(mp3|m4a|aac|wav|flac|ogg|opus|webm|wma|aiff?)$/i;

const odd_chars: Record<string, string> = {
  "\u29F8": "/",
  "\u29F9": "\\",
  "\u2044": "/",
  "\u2236": ":",
  "\u201C": '"',
  "\u201D": '"',
  "\u2018": "'",
  "\u2019": "'",
  "\u2013": "-",
  "\u2014": "-",
};
const odd_re =
  /[\u29F8\u29F9\u2044\u2236\u201C\u201D\u2018\u2019\u2013\u2014]/g;

function base(name: string): string {
  return name.replace(audio_ext, "").replace(odd_re, (c) => odd_chars[c] ?? c);
}

export function looseKey(name: string): string {
  return base(name)
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function aggressiveKey(name: string): string {
  return base(name)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .toLowerCase();
}

export function fileIdentity(file: File): string {
  return `${file.webkitRelativePath || file.name}:${file.size}:${file.lastModified}`;
}

export function isAudioFile(file: File): boolean {
  return audio_ext.test(file.name) || file.type === "audio/mpeg";
}

interface FileIndex {
  exact: Map<string, File[]>;
  loose: Map<string, File[]>;
  aggressive: Map<string, File[]>;
}

export function indexFiles(files: File[]): FileIndex {
  const exact = new Map<string, File[]>();
  const loose = new Map<string, File[]>();
  const aggressive = new Map<string, File[]>();

  const add = (map: Map<string, File[]>, key: string, file: File) => {
    if (!key) return;
    const bucket = map.get(key);
    if (bucket) bucket.push(file);
    else map.set(key, [file]);
  };

  for (const file of files) {
    add(exact, base(file.name), file);
    add(loose, looseKey(file.name), file);
    add(aggressive, aggressiveKey(file.name), file);
  }

  return { exact, loose, aggressive };
}

const default_artist_pattern = /^(?![\s\S]*[\p{Cc}\p{Cf}\p{Co}\p{Cs}\p{Zl}\p{Zp}])[\s\S]+$/u;

export function sanitizeArtist(artist: string): string {
  const cleaned = artist
    .normalize("NFC")
    .replace(/[\p{Cc}\p{Cf}\p{Co}\p{Cs}\p{Zl}\p{Zp}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "Unknown Artist";
}

export function reconcile(
  rows: ManifestRow[],
  files: File[],
  categories: Category[],
  opts: ReconcileOptions = {},
): ReconcileResult {
  const artistPattern = opts.artistPattern ?? default_artist_pattern;
  const audio = files.filter(isAudioFile);
  const index = indexFiles(audio);

  const categoryByName = new Map<string, string>();
  for (const cat of categories) {
    categoryByName.set(cat.name.trim().toLowerCase(), cat.id);
  }

  const claimed = new Set<string>();
  const seenRowKeys = new Set<string>();
  const items: PlanItem[] = [];
  const counts: Record<PlanStatus, number> = {
    ready: 0,
    "missing-file": 0,
    "ambiguous-file": 0,
    "unknown-category": 0,
    "invalid-artist": 0,
    "duplicate-row": 0,
  };

  rows.forEach((row, i) => {
    const item: PlanItem = {
      id: `row-${row.line}-${i}`,
      line: row.line,
      title: row.title,
      artist: row.artist,
      category: row.category,
      fileName: row.file,
      status: "ready",
      upload: "queued",
      attempts: 0,
    };

    const rowKey = aggressiveKey(row.file || row.title);
    if (rowKey && seenRowKeys.has(rowKey)) {
      item.status = "duplicate-row";
      counts["duplicate-row"]++;
      items.push(item);
      return;
    }
    if (rowKey) seenRowKeys.add(rowKey);

    const tiers: Array<
      [FileIndex[keyof FileIndex], PlanItem["matchTier"], string]
    > = [];
    if (row.file) {
      tiers.push([index.exact, "exact", base(row.file)]);
      tiers.push([index.loose, "loose", looseKey(row.file)]);
    }
    tiers.push([index.exact, "exact", base(row.title)]);
    tiers.push([index.loose, "loose", looseKey(row.title)]);
    tiers.push([index.aggressive, "aggressive", aggressiveKey(row.title)]);
    if (row.file) {
      tiers.push([index.aggressive, "aggressive", aggressiveKey(row.file)]);
    }

    let matched: File | undefined;
    let ambiguous: File[] | undefined;

    for (const [map, tier, key] of tiers) {
      const bucket = key ? map.get(key) : undefined;
      if (!bucket) continue;
      const free = bucket.filter((f) => !claimed.has(fileIdentity(f)));
      if (free.length === 1) {
        matched = free[0];
        item.matchTier = tier;
        break;
      }
      if (free.length > 1) {
        ambiguous = free;
        item.matchTier = tier;
        break;
      }
    }

    if (ambiguous) {
      item.status = "ambiguous-file";
      item.candidates = ambiguous;
      counts["ambiguous-file"]++;
      items.push(item);
      return;
    }
    if (!matched) {
      item.status = "missing-file";
      counts["missing-file"]++;
      items.push(item);
      return;
    }

    item.file = matched;
    claimed.add(fileIdentity(matched));

    const catId = row.category
      ? categoryByName.get(row.category.trim().toLowerCase())
      : undefined;
    item.categoryId = catId ?? opts.defaultCategoryId;
    if (!item.categoryId) {
      item.status = "unknown-category";
      counts["unknown-category"]++;
      items.push(item);
      return;
    }

    if (!artistPattern.test(item.artist)) {
      if (opts.sanitizeArtists) {
        item.artist = sanitizeArtist(item.artist);
      } else {
        item.status = "invalid-artist";
        counts["invalid-artist"]++;
        items.push(item);
        return;
      }
    }

    counts.ready++;
    items.push(item);
  });

  const orphanFiles = audio.filter((f) => !claimed.has(fileIdentity(f)));
  return { items, orphanFiles, counts };
}

export class PauseGate {
  private promise: Promise<void> | null = null;
  private release: (() => void) | null = null;

  pause(): void {
    if (this.promise) return;
    this.promise = new Promise<void>((resolve) => {
      this.release = resolve;
    });
  }

  resume(): void {
    this.release?.();
    this.promise = null;
    this.release = null;
  }

  get paused(): boolean {
    return this.promise !== null;
  }

  wait(): Promise<void> {
    return this.promise ?? Promise.resolve();
  }
}

export class FatalUploadError extends Error {}
export class NonRetryableError extends Error {}

export function isSessionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /\b(401|403)\b|unauthor|forbidden|session|expired|not logged in/i.test(
    msg,
  );
}

function isRetryable(err: unknown): boolean {
  if (err instanceof NonRetryableError) return false;
  const msg = err instanceof Error ? err.message : String(err);
  if (/\b(400|404|409|413|415|422|502|504)\b/.test(msg)) return false;
  return true;
}

export interface PoolOptions<T> {
  concurrency: number;
  maxAttempts?: number;
  signal?: AbortSignal;
  gate?: PauseGate;
  onStart?: (item: T) => void;
  onSuccess?: (item: T) => void;
  onFailure?: (item: T, err: unknown, willRetry: boolean) => void;
  onFatal?: (err: unknown) => void;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    signal?.addEventListener("abort", done, { once: true });
  });
}

export async function runPool<T>(
  items: T[],
  work: (item: T, signal?: AbortSignal) => Promise<void>,
  opts: PoolOptions<T>,
): Promise<void> {
  const { concurrency, maxAttempts = 3, signal, gate } = opts;
  let cursor = 0;
  let fatal = false;

  const worker = async () => {
    for (;;) {
      if (fatal || signal?.aborted) return;
      if (gate) await gate.wait();
      if (fatal || signal?.aborted) return;

      const i = cursor++;
      if (i >= items.length) return;
      const item = items[i];

      try {
        opts.onStart?.(item);
      } catch (err) {
        console.error("[runPool] onStart callback threw:", err);
      }

      let attempt = 0;
      for (;;) {
        attempt++;
        try {
          await work(item, signal);
          opts.onSuccess?.(item);
          break;
        } catch (err) {
          if (signal?.aborted) return;

          if (isSessionError(err)) {
            fatal = true;
            opts.onFatal?.(err);
            opts.onFailure?.(item, err, false);
            return;
          }

          const willRetry = attempt < maxAttempts && isRetryable(err);
          opts.onFailure?.(item, err, willRetry);
          if (!willRetry) break;

          const delay =
            Math.min(8000, 500 * 2 ** (attempt - 1)) + Math.random() * 250;
          await sleep(delay, signal);
          if (signal?.aborted) return;
        }
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.max(1, concurrency) }, () => worker()),
  );
}

function csvCell(value: string): string {
  const safe = formula_start.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function buildFailureCsv(items: PlanItem[]): string {
  const rows = items.filter(
    (i) => i.upload === "failed" || i.status !== "ready",
  );
  const lines = ["Audio Name,File Name,Artist,Category,Reason"];
  for (const item of rows) {
    const reason = item.error ?? item.status;
    lines.push(
      [item.title, item.fileName ?? "", item.artist, item.category, reason]
        .map(csvCell)
        .join(","),
    );
  }
  return lines.join("\r\n");
}
