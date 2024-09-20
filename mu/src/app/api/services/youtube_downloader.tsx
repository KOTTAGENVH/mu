import { apiClient } from "../axios/api";

//Interface for the youtube downloader
export interface YoutubeDownloader {
    link: string;
    storage_number: number;
    token: unknown;
}
export const youtubeDownloader = async (data: YoutubeDownloader) => {
    try {
        const response = await apiClient.post("/download_audio", data);
        return response;
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { success: false, message: error.message };
        } else {
            return { success: false, message: "An unknown error occurred" };
        }
    }
}