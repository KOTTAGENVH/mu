import { useModal } from "@/contextApi/modalOpen";
import { Inter, Roboto } from "next/font/google";
import React, { useState, useEffect } from "react";

const inter = Inter({ subsets: ['latin'], weight: ['700'] });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '500', '700'] });

function EditModal() {
  const { id, name, category, toggleModal } = useModal();
  const [newName, setNewName] = useState(name);
  const [newCategory, setNewCategory] = useState(category);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const closeModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      toggleModal(false, "", "", "");
    }, 200);
  };

  //Update the form
  const handleUpdate = async () => {
    try {
      //Validate the form
      if (newName === "" || newCategory === "") {
        alert("Name and Category are required");
        return;
      }
      setIsLoaded(true);
      const res = await fetch("/api/services/audio", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ _id: id, name: newName, category: newCategory }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Audio updated successfully!");
        setIsLoaded(false);
        closeModal();
        window.location.reload();
      } else {
        alert("Error updating audio");
        setIsLoaded(false);
        console.error("Error updating audio");
      }
    } catch (error) {
      alert("Error updating audio");
      setIsLoaded(false);
      console.error("Error updating audio:", error);
    }
  };

  return (
    <div className={`fixed z-50 inset-0 overflow-y-auto transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeModal}
      />

      <div className="flex items-center justify-center min-h-screen p-4">
        {isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-60">
            <div className="bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-black dark:border-t-white"></div>
                <span className={`text-black dark:text-white ${roboto.className} text-lg font-medium`}>Updating...</span>
              </div>
            </div>
          </div>
        )}
        <div
          className={`relative w-full max-w-md transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
            }`}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <h3 className={`${inter.className} text-xl font-semibold text-gray-900 dark:text-white`}>
                  Edit Audio
                </h3>
                <button
                  onClick={closeModal}
                  className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-full hover:bg-white/10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className={`${roboto.className} relative px-6 pb-6 space-y-5`}>
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="Enter audio name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Category
                </label>
                <div className="relative">
                  <select
                    id="category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="Rap" className="bg-white dark:bg-gray-800">Rap</option>
                    <option value="OldVibes" className="bg-white dark:bg-gray-800">Old Vibes</option>
                    <option value="Classic" className="bg-white dark:bg-gray-800">Classic</option>
                    <option value="LK" className="bg-white dark:bg-gray-800">LK</option>
                    <option value="FreeStyle" className="bg-white dark:bg-gray-800">Free Style</option>
                    <option value="MemoryLane" className="bg-white dark:bg-gray-800">Memory Lane</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className={`${roboto.className} relative px-6 pb-6 flex flex-col sm:flex-row-reverse gap-3`}>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isLoaded}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoaded ? 'Updating...' : 'Update Audio'}
              </button>

              <button
                type="button"
                onClick={closeModal}
                className="flex-1 bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-700 dark:text-gray-200 font-medium py-3 px-6 rounded-2xl hover:bg-white/30 dark:hover:bg-black/30"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditModal;