import React, { useCallback, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faUpload } from "@fortawesome/free-solid-svg-icons";
import Loader from "./loader";

const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mp3Files, setMp3Files] = useState<File[]>([]);
  const [isScanning, setScanning] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isFavourite, setFavourite] = useState(false);
  const [isCategory, setCategory] = useState("");

  // Function to process the MP3 files uploaded
  const processMP3Files = (files: File[]) => {
    const mp3Files = files.filter((file) => file.type === "audio/mpeg");
    if (mp3Files.length > 0) {
      setMp3Files(mp3Files);
    } else {
      alert("Only MP3 files are allowed.");
    }
  };

  // // Function to handle file upload
  // const uploadFile = async (file: File) => {
  //   try {
  //     if (!isCategory) {
  //       alert("Please select a category");
  //       return;
  //     } else if (!file) {
  //       alert("Please upload a file.");
  //       return;
  //     }
  //     setLoading(true);

  //     //Verify jwt cookie
  //     const res = await fetch("/api/services/cookieChecker", {
  //       method: "POST",
  //     });
  //     const data = await res.json();

  //     if (data.status === 401) {
  //       window.location.href = "/";
  //       return;
  //     }

  //     if (!res.ok) {
  //       alert(data.message);
  //       setLoading(false);
  //       setScanning(false);
  //       return;
  //     }

  //     // Get a reference to the music directory in Firebase Storage
  //     const musicDirRef = ref(storage5, "music/");

  //     // Check if the file already exists
  //     const listResult = await list(musicDirRef);

  //     const fileExists = listResult.items.some(
  //       (itemRef) => itemRef.name === file.name,
  //     );

  //     if (fileExists) {
  //       alert("File already exists.");
  //       setLoading(false);
  //       setScanning(false);
  //       setMp3Files([]);
  //       return;
  //     }
  //     // Upload the file to Firebase Storage
  //     const storageRef = ref(storage5, `music/${file.name}`);
  //     const uploadTask = uploadBytesResumable(storageRef, file);
  //     uploadTask.on(
  //       "state_changed",
  //       (snapshot) => {
  //         // Handle upload progress (if needed)
  //         const progress =
  //           (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
  //         console.log(`Upload is ${progress}% done`);
  //       },
  //       (error) => {
  //         // Handle upload error
  //         console.error("Upload failed:", error);
  //         setLoading(false);
  //         setMp3Files([]);
  //         alert("An error occurred while uploading the image.");
  //       },
  //       async () => {
  //         try {
  //           // Upload completed successfully, get the download URL
  //           const downloadUrl = await getDownloadURL(storageRef);

  //           //upload to mongodb
  //           const res = await fetch("/api/services/upload", {
  //             method: "POST",
  //             headers: {
  //               "Content-Type": "application/json",
  //             },
  //             body: JSON.stringify({
  //               name: file.name,
  //               category: isCategory,
  //               fileUrl: downloadUrl,
  //               favourite: isFavourite,
  //             }),
  //           });

  //           const data = await res.json();

  //           if (data.status === 401) {
  //             window.location.href = "/";
  //             return;
  //           }

  //           if (!res.ok) {
  //             alert(data.message);
  //             console.error("Error uploading to MongoDB:", data.message);
  //             setLoading(false);
  //             setMp3Files([]);
  //           } else {
  //             alert("File uploaded successfully.");
  //             setLoading(false);
  //             setMp3Files([]);
  //           }
  //         } catch (error) {
  //           console.error("Error getting download URL:", error);
  //           alert("An error occurred while uploading the image.");
  //           setLoading(false);
  //           setMp3Files([]);
  //         }
  //         setLoading(false);
  //         setMp3Files([]);
  //       },
  //     );
  //   } catch (error) {
  //     console.error("Error uploading file:", error);
  //     alert("An error occurred while uploading the file.");
  //     setLoading(false);
  //     setScanning(false);
  //     setMp3Files([]);
  //   }
  // };

  // Function to handle drag over event
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Function to handle drop event
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    processMP3Files(files);
  }, []);

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processMP3Files(files);
  };

  // Function to open the file input dialog
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Function to handle favourite button click
  const handleFavourite = () => {
    setFavourite(!isFavourite);
  };

  return (
    <div className="uploadRoot">
      <div className="uploadControls">
        <select
          title="category"
          className="uploadSelect"
          onChange={(e) => {
            const selectedValue = e.target.value;
            if (selectedValue === "Rap") setCategory("Rap");
            else if (selectedValue === "OldVibes") setCategory("OldVibes");
            else if (selectedValue === "Classic") setCategory("Classic");
            else if (selectedValue === "LK") setCategory("LK");
            else if (selectedValue === "FreeStyle") setCategory("FreeStyle");
            else if (selectedValue === "MemoryLane") setCategory("MemoryLane");
          }}
        >
          <option value="" disabled>
            Select category…
          </option>
          <option value="Rap">Rap</option>
          <option value="OldVibes">Old Vibes</option>
          <option value="Classic">Classic</option>
          <option value="LK">LK</option>
          <option value="FreeStyle">Free Style</option>
          <option value="MemoryLane">Memory Lane</option>
        </select>
        <button
          title="favourite"
          className="uploadFavBtn"
          onClick={() => handleFavourite()}
        >
          <FontAwesomeIcon
            icon={faHeart}
            className={
              isFavourite
                ? "uploadFavIcon uploadFavIconActive"
                : "uploadFavIcon"
            }
          />
        </button>
      </div>
      <div className="uploadDropzoneWrap">
        <div
          className="uploadDropzone"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          {isLoading || isScanning ? (
            <Loader />
          ) : (
            <>
              {mp3Files.length == 0 && (
                <>
                  <FontAwesomeIcon icon={faUpload} className="uploadIcon" />
                  <h1 className="uploadTitle">
                    Drag and Drop your MP3 file here or click to select
                  </h1>
                </>
              )}
              {mp3Files.length > 0 && (
                <div className="uploadFileCard">
                  <h2 className="uploadFileCardTitle">Uploaded File:</h2>
                  <p className="uploadFileCardMeta">
                    {mp3Files[0].name} (
                    {(mp3Files[0].size / 1048576).toFixed(2)} MB)
                  </p>
                </div>
              )}
              <input
                title="file"
                type="file"
                accept=".mp3"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }} // Hide the file input
              />
            </>
          )}
        </div>
      </div>
      <div className="uploadActions">
        <button
          className="uploadSubmitBtn"
          // onClick={() => uploadFile(mp3Files[0])}
          disabled={isScanning || isLoading}
        >
          <span className="uploadSubmitText">SUBMIT</span>
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
