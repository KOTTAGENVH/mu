"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
  ChartConfiguration,
} from "chart.js";
import {
  databaseStatus,
  deleteLeastStreamedSongs,
  deleteSong,
  leastStreamedSongs,
  storageStatus,
} from "@/app/api/client/services/audio/api";
import Loader from "@/components/loader";
import { LucideTrash } from "lucide-react";

export interface Candidate {
  id: string;
  name: string;
  artist: string;
  playCount: number;
  skipCount: number;
}

export interface LeastListenedResponse {
  success: boolean;
  count: number;
  percentile: string;
  candidates: Candidate[];
}

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

function StatusDisplay() {
  const dbCanvasRef = useRef<HTMLCanvasElement>(null);
  const r2CanvasRef = useRef<HTMLCanvasElement>(null);
  const dbChartInstance = useRef<Chart | null>(null);
  const r2ChartInstance = useRef<Chart | null>(null);
  const [dbStats, setDbStats] = useState({
    used: 0,
    total: 1,
    documentCount: 0,
  });
  const [r2Stats, setR2Stats] = useState({ used: 0, total: 1, fileCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [leastListened, setLeastListened] =
    useState<LeastListenedResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const toGB = (bytes: number) => (bytes / 1024 ** 3).toFixed(2);
  const dbFree = dbStats.total - dbStats.used;
  const dbPercent = ((dbStats.used / dbStats.total) * 100).toFixed(1);
  const r2Free = r2Stats.total - r2Stats.used;
  const r2Percent = ((r2Stats.used / r2Stats.total) * 100).toFixed(1);

  useEffect(() => {
    handleDatabaseStatus();
    handleStorageStatus();
    handleLeastListened();
  }, []);

  useEffect(() => {
    if (!dbCanvasRef.current) return;
    if (dbChartInstance.current) {
      dbChartInstance.current.destroy();
    }

    const config: ChartConfiguration<"doughnut"> = {
      type: "doughnut",
      data: {
        labels: ["Used", "Free"],
        datasets: [
          {
            data: [dbStats.used, dbFree],
            backgroundColor: ["#3b82f6", "#e2e8f0"],
            borderColor: ["#3b82f6", "#e2e8f0"],
            borderWidth: 1,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        cutout: "75%",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${Number(ctx.raw)} MB`,
            },
          },
        },
      },
    };

    dbChartInstance.current = new Chart(dbCanvasRef.current, config);

    return () => {
      if (dbChartInstance.current) {
        dbChartInstance.current.destroy();
      }
    };
  }, [dbStats]);

  useEffect(() => {
    if (!r2CanvasRef.current) return;

    if (r2ChartInstance.current) {
      r2ChartInstance.current.destroy();
    }

    const config: ChartConfiguration<"doughnut"> = {
      type: "doughnut",
      data: {
        labels: ["Used", "Free"],
        datasets: [
          {
            data: [r2Stats.used, r2Free],
            backgroundColor: ["#f59e0b", "#e2e8f0"],
            borderColor: ["#f59e0b", "#e2e8f0"],
            borderWidth: 1,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        cutout: "75%",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${toGB(Number(ctx.raw))} GB`,
            },
          },
        },
      },
    };

    r2ChartInstance.current = new Chart(r2CanvasRef.current, config);

    return () => {
      if (r2ChartInstance.current) {
        r2ChartInstance.current.destroy();
      }
    };
  }, [r2Stats]);

  //get data for r2 storage status
  const handleStorageStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await storageStatus();

      const data = await response;
      if (data?.success) {
        setIsLoading(false);
        setR2Stats({
          used: response.storage.usedBytes,
          total: response.storage.totalBytes,
          fileCount: response.storage.fileCount,
        });
      } else {
        setIsLoading(false);
        alert("Storage status check failed");
      }
    } catch (error) {
      setIsLoading(false);
      //   console.error("Error during storage status check:", error);
      alert(
        "An error occurred while checking storage status. Please try again.",
      );
    }
  }, []);

  //get data for mongo storage status
  const handleDatabaseStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await databaseStatus();

      const data = await response;
      if (data?.success) {
        setIsLoading(false);
        setDbStats({
          used: parseFloat(response.storage.usedMB),
          total: parseFloat(response.storage.totalMB),
          documentCount: response.storage.documentCount,
        });
      } else {
        setIsLoading(false);
        alert("Database status check failed");
      }
    } catch (error) {
      setIsLoading(false);
      //   console.error("Error during database status check:", error);
      alert(
        "An error occurred while checking database status. Please try again.",
      );
    }
  }, []);

  //get least listened audios
  const handleLeastListened = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await leastStreamedSongs(30);

      const data: LeastListenedResponse = await response;
      if (data?.success) {
        setLeastListened(data);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        alert("Database status check failed");
      }
    } catch (error) {
      setIsLoading(false);
      //   console.error("Error during database status check:", error);
      alert(
        "An error occurred while checking database status. Please try again.",
      );
    }
  }, []);

  //delete least listened audios
  const handleDeleteLeastListened = async () => {
    try {
      setIsLoading(true);
      const response = await deleteLeastStreamedSongs(30);

      const data = await response;
      if (data?.success) {
        setIsLoading(false);
        handleLeastListened();
      } else {
        setIsLoading(false);
        alert("Failed to delete least listened songs");
      }
    } catch (error) {
      setIsLoading(false);
      //   console.error("Error during database status check:", error);
      alert(
        "An error occurred while deleting least listened songs. Please try again.",
      );
    }
  };

  //delete one audio by id
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to delete this audio?")) return;

      try {
        setIsLoading(true);
        setLeastListened((prev) =>
          prev
            ? {
                ...prev,
                candidates: prev.candidates.filter((c) => c.id !== id),
              }
            : prev,
        );

        const response = await deleteSong(id);

        const data = await response;
        if (!data.success) {
          alert("Failed to delete: " + data.message);
          handleLeastListened();
        }
      } catch (error) {
        console.error("Delete failed", error);
        alert("An error occurred while deleting.");
        handleLeastListened();
      } finally {
        setIsLoading(false);
      }
    },
    [handleLeastListened],
  );

  const filteredLists = useMemo(() => {
    if (!searchQuery || !leastListened) return leastListened;
    return {
      ...leastListened,
      candidates: leastListened.candidates.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    };
  }, [leastListened, searchQuery]);

  const actionBtnClass =
    "p-2 rounded-full border-none cursor-pointer transition-colors duration-200";

  return (
    <div className="flex flex-col justify-center items-center w-auto h-auto mt-8 md:mt-20 mx-4 px-3 lg:mx-16 lg:px-6 py-4">
      <div className="flex flex-wrap justify-center gap-8 max-w-[1600px] w-full">
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-sm border-none flex flex-col items-center h-96 w-full max-w-sm">
          {" "}
          {isLoading ? (
            <Loader />
          ) : (
            <>
              <h3 className="text-lg md:text-xl  text-black dark:text-white uppercase mb-4">
                Database Storage
              </h3>
              <div className="relative h-48 w-48">
                <canvas ref={dbCanvasRef} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-slate-800 dark:text-white">
                    {dbPercent}%
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Used
                  </span>
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                {dbStats?.used} MB of {dbStats?.total} MB Used | Document Count:{" "}
                {dbStats?.documentCount}
              </div>
            </>
          )}
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-sm border-none flex flex-col items-center h-96 w-full max-w-sm">
          {" "}
          {isLoading ? (
            <Loader />
          ) : (
            <>
              <h3 className="text-lg md:text-xl  text-black dark:text-white uppercase mb-4">
                Cloud Storage (R2)
              </h3>
              <div className="relative h-48 w-48">
                <canvas ref={r2CanvasRef} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-slate-800 dark:text-white">
                    {r2Percent}%
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Used
                  </span>
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                {toGB(r2Stats?.used)} GB of {toGB(r2Stats?.total)} GB Used |
                File Count: {r2Stats?.fileCount}
              </div>
            </>
          )}
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-sm border-none flex flex-col items-center h-96 w-full max-w-sm">
          {" "}
          {isLoading ? (
            <Loader />
          ) : (
            <>
              <h3 className="text-lg md:text-xl  text-black dark:text-white uppercase mb-4">
                Least Listened Songs
              </h3>
              <div className="flex flex-row flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-sm flex-1 pl-10 pr-4 py-3 bg-black/20 dark:bg-white/20 backdrop-blur-sm border-none rounded-2xl text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="Search least listened songs..."
                />
                <button
                  onClick={() => handleDeleteLeastListened()}
                  title="Delete Least Listened 30%"
                  className={`${actionBtnClass} bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800`}
                >
                  <LucideTrash className="w-4 h-4" />
                </button>
              </div>
              <div className="w-full flex-1 overflow-y-auto pr-1 space-y-2 mt-2">
                {filteredLists &&
                filteredLists.candidates &&
                filteredLists.candidates.length > 0 ? (
                  <div className="space-y-3 mt-2">
                    {filteredLists.candidates.map((list) => (
                      <div
                        key={list.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/5 dark:bg-black/20 border-none hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="min-w-0 flex-1 mr-3">
                          <p
                            className="text-sm font-medium text-black dark:text-white truncate"
                            title={list.name}
                          >
                            {list.name}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(list?.id)}
                            title="Delete"
                            className={`${actionBtnClass} bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {searchQuery
                        ? "No matching songs found."
                        : "No wish songs found."}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatusDisplay;
