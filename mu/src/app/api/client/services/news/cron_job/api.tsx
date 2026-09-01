const cronjob_base = "/api/services/news/cronJob";

export type EuvdType = "latest" | "critical" | "exploited";

export type CronJob =
  | "ird/content"
  | "ird/news"
  | "cyber"
  | "cyber/kev"
  | `cyber/euvd/${EuvdType}`
  | "lankadeepa"
  | "bbcsinhala"
  | "newswire"
  | "adaderana"
  | "newsfirsttamil"
  | "un"
  | "storageStatus";

export interface CronJobResult {
  success: boolean;
  durationMs: number;
  data: {
    message: string;
    saved?: number;
    status?: string;
    deleted?: number;
    pinned?: number;
  };
}

export const cronJobLabels: Record<CronJob, string> = {
  "ird/content": "IRD Content Listing",
  "ird/news": "IRD News & Notices",
  cyber: "Cyber (merged feed)",
  "cyber/kev": "CISA KEV",
  "cyber/euvd/latest": "EUVD Latest",
  "cyber/euvd/critical": "EUVD Critical",
  "cyber/euvd/exploited": "EUVD Exploited",
  lankadeepa: "Lankadeepa",
  bbcsinhala: "BBC Sinhala",
  newswire: "Newswire",
  adaderana: "Ada Derana",
  newsfirsttamil: "News 1st Tamil",
  un: "UN News",
  storageStatus: "MongoDB cleanup",
};

export async function triggerCronJob(
  job: CronJob,
  signal?: AbortSignal,
): Promise<CronJobResult> {
  const response = await fetch(`${cronjob_base}/${job}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
  });

  if (response.ok) {
    return await response.json();
  }

  let message = `Cron job failed (${response.status})`;
  try {
    const errorData = await response.json();
    if (errorData?.message) message = errorData.message;
  } catch {}
  throw new Error(message);
}

//scrape IRD latest content listing
export async function runIrdContentJob(signal?: AbortSignal) {
  return triggerCronJob("ird/content", signal);
}

//scrape IRD news and notices
export async function runIrdNewsJob(signal?: AbortSignal) {
  return triggerCronJob("ird/news", signal);
}

//refresh the merged CISA KEV + ENISA EUVD feed
export async function runCyberJob(signal?: AbortSignal) {
  return triggerCronJob("cyber", signal);
}

//refresh the CISA KEV catalog
export async function runKevJob(signal?: AbortSignal) {
  return triggerCronJob("cyber/kev", signal);
}

//refresh ENISA EUVD by type
export async function runEuvdJob(type: EuvdType, signal?: AbortSignal) {
  return triggerCronJob(`cyber/euvd/${type}`, signal);
}

//scrape Lankadeepa
export async function runLankadeepaJob(signal?: AbortSignal) {
  return triggerCronJob("lankadeepa", signal);
}

//scrape BBC Sinhala
export async function runBBCSinhalaJob(signal?: AbortSignal) {
  return triggerCronJob("bbcsinhala", signal);
}

//scrape Newswire
export async function runNewswireJob(signal?: AbortSignal) {
  return triggerCronJob("newswire", signal);
}

//scrape Ada Derana
export async function runAdaDeranaJob(signal?: AbortSignal) {
  return triggerCronJob("adaderana", signal);
}

//scrape News 1st Tamil
export async function runNewsFirstTamilJob(signal?: AbortSignal) {
  return triggerCronJob("newsfirsttamil", signal);
}

//fetch UN News
export async function runUnNewsJob(signal?: AbortSignal) {
  return triggerCronJob("un", signal);
}

//run the MongoDB usage check and cleanup — this one can DELETE documents
export async function runStorageCleanupJob(signal?: AbortSignal) {
  return triggerCronJob("storageStatus", signal);
}