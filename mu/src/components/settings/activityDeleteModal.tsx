import React, { useState, useEffect } from "react";

interface DeleteActivityProps {
  handleClose: () => void;
  handleDelete: (id: string) => void;
  handleClearAll: () => void;
  isClearAllMode?: boolean;
  id?: string;
  taskname?: string;
}

export default function DeleteActivityModal({
  id,
  taskname,
  isClearAllMode,
  handleClose,
  handleDelete,
  handleClearAll,
}: DeleteActivityProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const baseBtnClass =
    "inline-flex items-center justify-center w-auto py-3 px-3 rounded-2xl border-none cursor-pointer";

  const defaultBtnClass =
    "bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700";

  const closeModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      handleClose();
    }, 200);
  };

  const onConfirm = () => {
    setIsSubmitting(true);
    if (isClearAllMode) {
      handleClearAll();
    } else if (id) {
      handleDelete(id);
    }
  };

  return (
    <div
      className={`fixed z-50 inset-0 overflow-y-auto transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeModal}
      />
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className={`relative w-full max-w-md transform transition-all duration-300 ${
            isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
          }`}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative px-6 pt-6 pb-4 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg md:text-xl text-black dark:text-white font-bold flex-1 min-w-0 break-words mr-4">
                  {isClearAllMode
                    ? "Clear All Activities?"
                    : "Confirm Deletion"}
                </h3>
                <button
                  onClick={closeModal}
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
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {isClearAllMode 
                  ? "Are you sure you want to delete all activity logs? This action cannot be undone."
                  : `Are you sure you want to delete the activity "${taskname}"?`
                }
              </p>
            </div>
            <div className="relative px-6 pb-6 overflow-y-auto flex-grow">
              <div
                className={`relative px-6 pb-6 flex flex-col sm:flex-row-reverse gap-3`}
              >
    <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isSubmitting}
                  className={`${baseBtnClass} ${defaultBtnClass}`}
                >
                  {isSubmitting 
                    ? (isClearAllMode ? "Clearing..." : "Deleting...") 
                    : (isClearAllMode ? "Clear All" : "Delete Activity")}
                </button>

                <button
                  disabled={isSubmitting}
                  type="button"
                  onClick={closeModal}
                  className={`${baseBtnClass} ${defaultBtnClass}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
