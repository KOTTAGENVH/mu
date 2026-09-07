const uploads_base = "/api/services/report";

export interface UploadExportRow {
  id: string;
  name: string;
  artist: string;
  category: string;
  fileUrl: string;
  favourite: boolean;
  lastPlayedAt: string | null;
  playCount: number;
  skipCount: number;
}

export interface UploadExportSummary {
  total: number;
  exported: number;
  truncated: boolean;
  favourites: number;
  categories: number;
  totalPlays: number;
  totalSkips: number;
}

export interface UploadExport {
  generatedAt: string;
  summary: UploadExportSummary;
  uploads: UploadExportRow[];
}

export interface UploadExportResponse {
  success: boolean;
  data: UploadExport;
}

export async function getUploadExport(): Promise<UploadExport> {
  const response = await fetch(uploads_base, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Your session has expired. Please log in again."
        : "Sorry, an error occurred while building the report. Please try again later.",
    );
  }

  const payload: UploadExportResponse = await response.json();

  if (!payload?.success || !payload?.data) {
    throw new Error(
      "Sorry, an error occurred while building the report. Please try again later.",
    );
  }

  return payload.data;
}

export async function downloadUploadsPdf(): Promise<void> {
  const data = await getUploadExport();

  const { buildUploadsPdf } = await import("@/lib/settings/reportPdf");
  const blob = await buildUploadsPdf(data);

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mu-audio-library-${data.generatedAt.slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
