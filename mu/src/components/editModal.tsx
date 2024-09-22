//Edit Modal
import { useModal } from "@/contextApi/modalOpen";
import React, { useState } from "react";

function EditModal() {
  const { id, name, category, toggleModal } = useModal();
  const [newName, setNewName] = useState(name);
  const [newCategory, setNewCategory] = useState(category);
  const [isLoaded, setIsLoaded] = useState(false);

  //Close the modal
  const closeModal = () => {
    toggleModal(false, "", "", "");
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
        alert("Audio updated");
        setIsLoaded(false);
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
    <div className="fixed z-10 inset-0 overflow-y-auto">
      {isLoaded ? (
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75">
            <svg
              className="animate-spin h-5 w-5 mr-3 ..."
              viewBox="0 0 24 24"
            ></svg>
          </div>
        </div>
      ) : (
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <div
            className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-headline "
          >
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4  dark:bg-slate-950 bg-slate-300">
              <div className="sm:flex sm:items-start ">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3
                    className="text-lg leading-6 font-medium text-black dark:text-white"
                    id="modal-headline"
                  >
                    Edit Audio
                  </h3>
                  <div className="mt-2">
                    <div className="mt-2">
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-black dark:text-white"
                      >
                        Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-3xl text-black dark:text-white dark:bg-slate-950 bg-slate-300 p-2"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label
                        htmlFor="category"
                        className="block text-sm font-medium text-black dark:text-white"
                      >
                        Category
                      </label>
                      <div className="mt-1">
                        <select
                          title="category"
                          className="shadow-sm focus:ring-indigo-500 border focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-3xl text-black dark:text-white p-2 dark:bg-slate-950 bg-slate-300"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                        >
                          <option value="Rap">Rap</option>
                          <option value="Classic">Classic</option>
                          <option value="OldVibes">OldVibes</option>
                          <option value="LK">LK</option>
                          <option value="Free Style">Free Style</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-none px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% text-base font-medium text-black dark:text-white hover:from-indigo-700 hover:via-sky-700 hover:to-emerald-700 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-red-400 dark:bg-red-600 text-base font-medium text-black dark:text-white  sm:mt-0 hover:bg-red-600 hover:dark:bg-red-400 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditModal;
