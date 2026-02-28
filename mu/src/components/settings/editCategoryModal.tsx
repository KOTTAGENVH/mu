import { editCategory } from "@/app/api/client/services/categories/api";
import React, { useState, useEffect } from "react";
import Loader from "../loader";

interface EditCategoryModalProps {
  id: string;
  handleClose: () => void;
  onSuccess: () => void;
}

export default function EditCategoryModal({
  id,
  handleClose,
  onSuccess,
}: EditCategoryModalProps) {
  const [newName, setNewName] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  //edit category
  const handleEdit = async () => {
    try {
      //Validate the form
      if (newName === "") {
        alert("Category Name is required");
        return;
      }
      setIsLoaded(true);

      const response = await editCategory(id, newName);
      const data = await response;

      if (data.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (data.success) {
        setIsLoaded(false);
        setIsSuccess(true);
        setTimeout(() => {
          closeModal();
          onSuccess();
        }, 1500);
      } else {
        if (data.message) {
          alert(data.message);
        } else {
          alert("Error editing category");
        }
        setIsLoaded(false);
        // console.error("Error editing category :", data.message);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error editing category");
      setIsLoaded(false);
      // console.error("Error editing category:", error);
    }
  };

  return (
    <div
      className={`fixed z-50 inset-0 overflow-y-auto transition-all duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeModal}
      />
      <div className="flex items-center justify-center min-h-screen p-4">
        {isLoaded ? (
          <Loader />
        ) : isSuccess ? (
          <div className="relative w-full max-w-md transform transition-all duration-300 scale-100">
            <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border-none shadow-2xl overflow-hidden p-8">
              <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Success!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Category edited successfully.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-60">
                <div className="bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-black dark:border-t-white"></div>
                    <span
                      className={`text-black dark:text-white  text-sm font-medium`}
                    >
                      Editing category...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div
              className={`relative w-full max-w-md transform transition-all duration-300 ${
                isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
              }`}
              role="dialog"
              aria-modal="true"
            >
              <div className="relative bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                <div className="relative px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-lg md:text-xl text-black dark:text-white`}
                    >
                      Edit Category
                    </h3>
                    <button
                      disabled={isLoaded}
                      onClick={closeModal}
                      className={`inline-flex items-center justify-center w-auto py-3 px-3 rounded-full border-none cursor-pointer bg-red-100 text-black hover:bg-red-200 dark:bg-red-900/30 dark:text-white dark:hover:bg-red-800`}
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
                <div className={`relative px-6 pb-6 space-y-5`}>
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-black dark:text-white"
                    >
                      Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="text-sm w-full px-4 py-3 bg-black/20 dark:bg-white/20 backdrop-blur-sm border-none rounded-2xl text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                        placeholder="Enter category name"
                      />
                    </div>
                  </div>
                </div>
                <div
                  className={`relative px-6 pb-6 flex flex-col sm:flex-row-reverse gap-3`}
                >
                  <button
                    type="button"
                    onClick={handleEdit}
                    disabled={isLoaded}
                    className={`${baseBtnClass} ${defaultBtnClass}`}
                  >
                    {isLoaded ? "Editing..." : "Edit Category"}
                  </button>

                  <button
                    disabled={isLoaded}
                    type="button"
                    onClick={closeModal}
                    className={`${baseBtnClass} ${defaultBtnClass}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
