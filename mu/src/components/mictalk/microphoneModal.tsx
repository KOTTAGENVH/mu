"use client";
import { useState, useEffect } from "react";
import { useMicrophone } from "@/contextApi/microphoneContext";
import Loader from "../loader";

const MicrophoneModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const { selectedMic, setSelectedMic } = useMicrophone();

  useEffect(() => {
    const getDevices = async () => {
      setLoading(true);
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setDevices(devices.filter((device) => device.kind === "audioinput"));
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
      setLoading(false);
    };
    if (isOpen) {
      getDevices();
    }
  }, [isOpen]);

  const handleSelectMic = (device: MediaDeviceInfo) => {
    setSelectedMic(device);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex items-center justify-center min-h-screen p-4 pointer-events-none">
        <div
          className="relative w-full max-w-md bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] pointer-events-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className="relative px-6 pt-6 pb-4 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg md:text-xl text-black dark:text-white font-bold">
                Select a Microphone
              </h3>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center w-auto py-2 px-2 rounded-full border-none cursor-pointer bg-red-100 text-black hover:bg-red-200 dark:bg-red-900/30 dark:text-white dark:hover:bg-red-800 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
          {selectedMic && (
            <div className="relative px-6 pb-2 shrink-0">
              <p className="text-sm text-black dark:text-white truncate">
                <span className="opacity-70">Currently using:</span>{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {selectedMic.label || "Unnamed Microphone"}
                </span>
              </p>
            </div>
          )}
          <div className="relative px-6 pb-6 overflow-y-auto flex-grow">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader />
              </div>
            ) : devices.length > 0 ? (
              <div className="space-y-3 mt-2">
                {devices.map((device) => {
                  const isSelected = selectedMic?.deviceId === device.deviceId;
                  return (
                    <div
                      key={device.deviceId}
                      onClick={() => handleSelectMic(device)}
                      className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-50/50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30"
                          : "bg-white/5 dark:bg-black/20 border border-transparent hover:bg-white/10 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="min-w-0 flex-1 mr-4">
                        <p
                          className={`text-sm font-medium truncate ${
                            isSelected
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-black dark:text-white"
                          }`}
                        >
                          {device.label || "Unnamed Microphone"}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="shrink-0 text-blue-600 dark:text-blue-400">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  No devices found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicrophoneModal;
